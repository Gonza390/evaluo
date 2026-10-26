import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3100';
const outputDir = process.env.QA_ARTIFACTS_DIR ?? 'qa-artifacts/study-responsive';
const viewports = [320, 375, 430, 768, 1024, 1440, 1920];
const routes = [
  { name: 'resumen', path: '/preview/progreso-pdf', ready: '[data-study-summary-intro]' },
  { name: 'progreso', path: '/preview/progreso-pdf?tab=progreso&nuevo=1', ready: '[data-recommended-topics]' },
  { name: 'errores', path: '/preview/mis-errores/explicacion', ready: '[data-topic-reinforcement]' },
];
const failures = [];
const outcomes = [];
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

function captureErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('response', response => {
    if (response.status() >= 500 && response.url().startsWith(baseUrl)) {
      errors.push('HTTP ' + response.status() + ': ' + response.url());
    }
  });
  return errors;
}

async function measureLayout(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const width = window.innerWidth;
    const elements = [...document.querySelectorAll('body *')].filter(element => {
      const el = element;
      const styles = window.getComputedStyle(el);
      if (styles.display === 'none' || styles.visibility === 'hidden') return false;
      const box = el.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0 || box.bottom < 0 || box.top > window.innerHeight) return false;
      if (box.right <= width + 2 && box.left >= -2) return false;
      // An independent carousel/tab strip may scroll horizontally by design.
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const css = window.getComputedStyle(parent);
        if ((css.overflowX === 'auto' || css.overflowX === 'scroll') &&
            parent.scrollWidth > parent.clientWidth) return false;
        parent = parent.parentElement;
      }
      return true;
    }).slice(0, 8).map(el => ({
      tag: el.tagName.toLowerCase(),
      className: String(el.className).slice(0, 100),
      left: Math.round(el.getBoundingClientRect().left),
      right: Math.round(el.getBoundingClientRect().right),
    }));
    return {
      width,
      rootWidth: root.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      rootOverflow: Math.max(0, root.scrollWidth - width),
      visibleOffscreen: elements,
    };
  });
}

async function saveState(page, name, width, errors) {
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(220);
  const metrics = await measureLayout(page);
  await page.screenshot({
    path: outputDir + '/' + name + '-' + width + '.png',
    animations: 'disabled',
    fullPage: false,
  });
  assert.ok(metrics.rootOverflow <= 2, 'Horizontal root overflow: ' + JSON.stringify(metrics));
  assert.equal(errors.length, 0, 'Runtime errors: ' + errors.join('; '));
  outcomes.push({ name, width, metrics, errors });
  console.log('PASS ' + name + ' ' + width + ' ' + JSON.stringify(metrics));
}

async function visit(page, path, ready) {
  const result = await page.goto(baseUrl + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  assert.equal(result?.status(), 200, 'Preview must respond 200: ' + path);
  // Activity conserva pestañas ocultas montadas: siempre seleccionar la instancia visible.
  await page.locator(ready + ':visible').first().waitFor({ state: 'visible', timeout: 20000 });
}

async function selectTab(page, value, mobile) {
  // Un capítulo finalizado puede mostrar un diálogo legítimo encima del lector.
  // Registrar el estado y cerrarlo antes de navegar, sin ignorar otros bloqueos.
  const chapterClose = page.getByRole('button', { name: 'Cerrar y volver al resumen', exact: true });
  if (await chapterClose.isVisible().catch(() => false)) {
    const width = page.viewportSize()?.width ?? 'unknown';
    const dialog = page.getByRole('dialog');
    await dialog.screenshot({ path: outputDir + '/popup-fin-capitulo-' + width + '.png', animations: 'disabled' });
    const modalFit = await dialog.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.left >= -2 && rect.right <= window.innerWidth + 2 &&
        rect.top >= -2 && rect.bottom <= window.innerHeight + 2;
    });
    assert.ok(modalFit, 'El popup de final de capítulo debe caber en el viewport.');
    await chapterClose.click();
  }
  if (mobile && ['resumen', 'tarjetas', 'ejercicios', 'progreso'].includes(value)) {
    const label = { resumen: 'Resumen', tarjetas: 'Flashcards', ejercicios: 'Práctica', progreso: 'Progreso' }[value];
    await page.locator('[data-pdf-mobile-navigation] button').filter({ hasText: label }).first().click();
    return;
  }
  if (mobile && value === 'glosario') {
    await page.getByRole('button', { name: /Más herramientas/ }).last().click();
    await page.getByRole('menuitem', { name: /Glosario/ }).click();
    return;
  }
  await page.locator('[data-pdf-study-tab][data-recommended-tab="' + value + '"]').first().click();
}

for (const width of viewports) {
  const height = width < 768 ? 740 : 900;
  const mobile = width < 768;
  for (const route of routes) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = captureErrors(page);
    try {
      await visit(page, route.path, route.ready);
      await saveState(page, route.name, width, errors);
    } catch (error) {
      failures.push(route.name + '/' + width + ': ' + String(error));
      await page.screenshot({ path: outputDir + '/FAILED-' + route.name + '-' + width + '.png' }).catch(() => {});
    } finally {
      await page.close();
    }
  }

  // Reutiliza el PDF real de demostración para cubrir todas las herramientas.
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = captureErrors(page);
  try {
    await visit(page, '/preview/progreso-pdf', '[data-study-summary-intro]');
    await selectTab(page, 'glosario', mobile);
    await page.locator('[data-study-glossary]:visible').first().waitFor({ timeout: 20000 });
    await saveState(page, 'glosario', width, errors);

    await selectTab(page, 'tarjetas', mobile);
    const card = page.locator('[data-flashcard-card]:visible').first();
    await card.waitFor({ timeout: 25000 });
    await saveState(page, 'flashcards-general', width, errors);

    // Verificación funcional real del giro: cara opuesta tras la animación.
    const faceBefore = await card.locator('[data-flashcard-face]').getAttribute('data-flashcard-face');
    await card.click();
    await page.waitForTimeout(550);
    const faceAfter = await card.locator('[data-flashcard-face]').getAttribute('data-flashcard-face');
    assert.notEqual(faceAfter, faceBefore, 'Flashcard must visibly flip');
    assert.equal(await card.getAttribute('aria-busy'), 'false', 'Flip must finish');
    await saveState(page, 'flashcards-girada', width, errors);

    await selectTab(page, 'ejercicios', mobile);
    await page.locator('[data-recommended-practice]:visible').first().waitFor({ timeout: 20000 });
    await saveState(page, 'practica-general', width, errors);
  } catch (error) {
    failures.push('herramientas/' + width + ': ' + String(error));
    await page.screenshot({ path: outputDir + '/FAILED-herramientas-' + width + '.png' }).catch(() => {});
  } finally {
    await page.close();
  }
}

await browser.close();
await writeFile(outputDir + '/results.json', JSON.stringify({ results: outcomes, failures }, null, 2));
if (failures.length) {
  console.error('Responsive QA failed: ' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Responsive QA passed: ' + outcomes.length + ' checks across ' + viewports.length + ' viewports.');
}
