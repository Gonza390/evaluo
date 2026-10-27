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
  // El header aparece duplicado por los paneles responsive de React Activity.
  // Seleccionar la instancia visible y, si un popup aparece mientras hacemos
  // clic, cerrarlo y repetir la navegación sin forzar controles ocultos.
  const tab = page.locator('[data-pdf-study-tab][data-recommended-tab="' + value + '"]:visible').first();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await tab.click({ timeout: 5000 });
      return;
    } catch (error) {
      if (!(await chapterClose.isVisible().catch(() => false))) throw error;
      await chapterClose.click();
    }
  }
  throw new Error('No se pudo abrir la pestaña visible ' + value);
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


// Recorrido de tarjetas por tema: la misma tarjeta, sin pantalla de inicio,
// con el tema visible, dos calificaciones y destino a la práctica de ese tema.
for (const width of [375, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: width < 768 ? 740 : 900 } });
  const errors = captureErrors(page);
  try {
    await visit(page, '/preview/progreso-pdf', '[data-study-summary-intro]');
    const region = page.locator('[role="region"][aria-label="Contenido de estudio"]:visible').first();
    const chapterOne = region.locator('[data-summary-reading-section="1"]').first();
    await chapterOne.evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.waitForTimeout(350);
    // Disparar un scroll normal si el salto anterior no cruzó el umbral de lectura.
    if (!(await page.locator('[data-summary-chapter-finish]:visible').first().isVisible().catch(() => false))) {
      await region.evaluate((element) => {
        element.scrollTop = Math.min(element.scrollHeight - element.clientHeight, element.scrollTop + 150);
        element.dispatchEvent(new Event('scroll'));
      });
    }
    const finish = page.locator('[data-summary-chapter-finish]:visible').first();
    await finish.waitFor({ state: 'visible', timeout: 12000 });
    const flashcards = finish.locator('[data-summary-topic-flashcards]');
    assert.equal(await flashcards.isEnabled(), true, 'Tema debe tener tarjetas para repasar');
    await saveState(page, 'fin-capitulo-antes-flashcards', width, errors);
    await flashcards.click();
    const card = page.locator('[data-flashcard-card]:visible').first();
    await card.waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('[data-flashcard-topic]:visible').first().waitFor();
    assert.equal(await page.getByRole('button', { name: 'Comenzar repaso' }).isVisible().catch(() => false), false,
      'Flashcards de tema empiezan directamente');
    assert.equal(await page.locator('[data-flashcard-grade]:visible').count(), 2,
      'Sólo Mal y Bien son calificaciones, Aprendiendo es estado');
    await saveState(page, 'flashcards-por-tema', width, errors);

    let finished = false;
    for (let n = 0; n < 30; n++) {
      if (await page.locator('[data-topic-flashcards-result]:visible').count() > 0) {
        finished = true;
        break;
      }
      const current = page.locator('[data-flashcard-card]:visible').first();
      await current.waitFor({ state: 'visible', timeout: 8000 });
      await current.click();
      await page.waitForTimeout(510);
      assert.equal(await current.locator('[data-flashcard-face]').getAttribute('data-flashcard-face'), 'back',
        'Tarjeta por tema debe girar hasta la respuesta');
      await page.locator('[data-flashcard-grade="good"]:visible').first().click();
    }
    assert.ok(finished, 'La sesión por tema debe terminar dentro de 30 tarjetas');
    assert.equal(await page.locator('[data-topic-flashcards-primary]:visible').count(), 1,
      'El cierre por tema debe llevar a practicar');
    await saveState(page, 'flashcards-por-tema-resultado', width, errors);
    await page.locator('[data-topic-flashcards-primary]:visible').first().click();
    await page.locator('[data-recommended-practice]:visible').first().waitFor({ timeout: 12000 });
    await saveState(page, 'flashcards-por-tema-a-practica', width, errors);
  } catch (error) {
    failures.push('flashcards-por-tema/' + width + ': ' + String(error));
    await page.screenshot({
      path: outputDir + '/FAILED-flashcards-por-tema-' + width + '.png', animations: 'disabled',
    }).catch(() => {});
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
