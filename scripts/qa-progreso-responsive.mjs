import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.QA_BASE_URL || 'http://localhost:3100';
const folder = process.env.QA_ARTIFACTS_DIR || 'qa-artifacts/progreso';
const widths = [355, 433, 853, 1024, 1280, 1440, 1920];
await mkdir(folder, { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];
async function check(label, run) {
  try {
    await run();
    console.log('PASS', label);
  } catch (error) {
    failures.push(label + ': ' + (error?.stack || error));
    console.error('FAIL', label, error);
  }
}
const wait = { timeout: 25000 };
const target = baseUrl + '/preview/progreso-pdf?tab=progreso&nuevo=1';

for (const width of widths) {
  await check('progreso layout ' + width, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    try {
      const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
      assert.equal(response?.status(), 200, 'Preview should load');
      await page.getByRole('heading', { name: 'Tu progreso', exact: true }).waitFor(wait);
      await page.waitForLoadState('load');
      await page.waitForTimeout(500);
      const firstAction = page.getByRole('button', { name: /Comenzar a estudiar|Continuar estudiando/ }).first();
      await firstAction.click();
      await page.locator('[id^="real-detail-title"]:visible').first().waitFor(wait);
      const docWidth = await page.evaluate(() => ({
        root: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        viewport: window.innerWidth,
      }));
      assert.ok(docWidth.root <= docWidth.viewport + 1, 'Document overflows horizontally: ' + JSON.stringify(docWidth));
      if (docWidth.body > docWidth.viewport + 1) {
        const offenders = await page.evaluate(() =>
          [...document.querySelectorAll('body *')]
            .map((element) => {
              const box = element.getBoundingClientRect();
              return {
                tag: element.tagName.toLowerCase(),
                className: String(element.className).slice(0, 140),
                left: Math.round(box.left),
                right: Math.round(box.right),
                width: Math.round(box.width),
              };
            })
            .filter((element) => element.right > window.innerWidth + 2 && element.width > 2)
            .sort((a, b) => b.right - a.right)
            .slice(0, 8)
        );
        assert.equal(
          offenders.length,
          0,
          'Visible elements extend beyond the viewport: ' + JSON.stringify({ ...docWidth, offenders })
        );
        console.log('NOTE body.scrollWidth includes clipped offscreen geometry:', JSON.stringify(docWidth));
      }
      const nav = page.getByRole('navigation', { name: 'Índice de temas' });
      const learning = page.locator('aside[aria-label="Aprendizaje y próxima actividad del tema"]');
      assert.equal(await nav.isVisible(), width >= 1024, 'Topic index responsive breakpoint');
      assert.equal(await learning.isVisible(), width >= 1280, 'Learning rail responsive breakpoint');
      if (width >= 1024) {
        await nav.getByRole('button').nth(1).click();
        await page.locator('[id^="real-detail-title"]:visible').first().waitFor(wait);
        assert.match((await page.locator('[id^="real-detail-title"]:visible').first().textContent()) ?? '', /machine learning|deep learning/i, 'Second topic navigation');
      } else {
        await page.getByRole('button', { name: 'Volver a los temas' }).click();
        await page.getByRole('button', { name: /2\. Machine learning y deep learning/i }).click();
      }
      await page.waitForTimeout(350);
      await page.screenshot({ path: folder + '/progreso-' + width + '.png', fullPage: false, animations: 'disabled' });
    } catch (error) {
      await page.screenshot({ path: folder + '/failed-' + width + '.png', animations: 'disabled' }).catch(() => {});
      throw error;
    } finally {
      await page.close();
    }
  });
}

await check('topic practice -> result -> return to same topic', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('heading', { name: 'Tu progreso', exact: true }).waitFor(wait);
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Comenzar a estudiar|Continuar estudiando/ }).first().click();
    const nav = page.getByRole('navigation', { name: 'Índice de temas' });
    await nav.getByRole('button').nth(1).click();
    const titleBefore = (await page.locator('[id^="real-detail-title"]:visible').first().textContent())?.trim();
    await page.getByRole('button', { name: 'Practicar el tema', exact: true }).click();
    await page.locator('article').first().waitFor(wait);
    assert.equal(await page.getByRole('button', { name: 'Empezar práctica' }).count(), 0, 'Topic practice must start without a size picker or extra start step');
    const counter = (await page.getByText(/Pregunta 1 de \d+/).first().textContent()) ?? '';
    const total = Number(counter.match(/de (\d+)/)?.[1]);
    assert.ok(total >= 1 && total <= 20, 'Topic practice must include 1–20 distinct questions, got: ' + counter);
    let finished = false;
    for (let count = 0; count < 30; count++) {
      const question = page.locator('article').first();
      await question.waitFor(wait);
      if (await page.getByRole('button', { name: 'Comprobar respuesta' }).isVisible().catch(() => false)) {
        await question.getByRole('button').first().click();
        await page.getByRole('button', { name: 'Comprobar respuesta' }).click();
      } else if (await page.getByRole('button', { name: 'Ver respuesta esperada' }).isVisible().catch(() => false)) {
        await question.locator('textarea').fill('Respuesta de prueba');
        await page.getByRole('button', { name: 'Ver respuesta esperada' }).click();
        await page.getByRole('button', { name: 'Necesito repasar' }).click();
      }
      const finalButton = page.getByRole('button', { name: 'Ver resultado' });
      if (await finalButton.isVisible().catch(() => false)) {
        await finalButton.click();
        finished = true;
        break;
      }
      await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
    }
    assert.ok(finished, 'Practice should finish within thirty questions');
    const back = page.getByRole('button', { name: /Reforzar este tema|Volver al tema/ }).first();
    await back.click();
    await page.locator('[id^="real-detail-title"]:visible').first().waitFor(wait);
    assert.equal((await page.locator('[id^="real-detail-title"]:visible').first().textContent())?.trim(), titleBefore, 'Back to same topic');
    await page.locator('aside[aria-label="Aprendizaje y próxima actividad del tema"]:visible h4').first().waitFor(wait);
    await page.screenshot({ path: folder + '/progreso-post-practice.png', animations: 'disabled' });
  } catch (error) {
    await page.screenshot({ path: folder + '/failed-practice.png', animations: 'disabled' }).catch(() => {});
    throw error;
  } finally {
    await page.close();
  }
});


await check('topic reinforcement: saved explanation -> optional help -> independent check', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(baseUrl + '/preview/progreso-pdf?tab=progreso', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('heading', { name: 'Tu progreso', exact: true }).waitFor(wait);
    await page.getByRole('button', { name: /Continuar estudiando|Comenzar a estudiar/ }).first().click();
    await page.getByRole('button', { name: 'Reforzar dificultades', exact: true }).first().click();
    const review = page.locator('[data-topic-reinforcement]:visible').first();
    await review.waitFor(wait);
    await review.getByRole('heading', { name: 'La pregunta que te costó' }).waitFor(wait);
    await review.getByRole('heading', { name: 'Entendamos por qué' }).waitFor(wait);
    await review.getByText('Tu respuesta anterior').waitFor(wait);
    await review.getByText('Respuesta correcta', { exact: true }).first().waitFor(wait);
    await review.getByRole('button', { name: 'Comprobar lo aprendido' }).waitFor(wait);
    const initialExtra = await review.getByText('Explicación adicional', { exact: true }).count();
    assert.equal(initialExtra, 0, 'Opening a topic review must not generate AI explanations automatically');
    await page.screenshot({ path: folder + '/refuerzo-1440.png', animations: 'disabled' });
    await review.getByRole('button', { name: 'Dame un ejemplo' }).click();
    await review.getByText('Un ejemplo para entenderlo').waitFor(wait);
    await review.getByRole('button', { name: 'Comprobar lo aprendido' }).click();
    await page.getByRole('heading', { name: 'Comprobá lo aprendido' }).waitFor(wait);
    const answers = page.locator('fieldset input[type=radio]');
    assert.ok((await answers.count()) >= 2, 'Independent check needs at least two answers');
    await answers.first().check();
    await page.getByRole('button', { name: 'Confirmar respuesta' }).click();
    await page.getByRole('heading', { name: /Resolviste el refuerzo|Todavía queda por reforzar/ }).waitFor(wait);
    await page.screenshot({ path: folder + '/refuerzo-comprobacion-1440.png', animations: 'disabled' });
  } catch (error) {
    await page.screenshot({ path: folder + '/failed-refuerzo.png', animations: 'disabled' }).catch(() => {});
    throw error;
  } finally {
    await page.close();
  }
});


for (const width of [355, 433]) {
  await check('mobile topic practice without picker ' + width, async () => {
    const page = await browser.newPage({ viewport: { width, height: 840 } });
    try {
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.getByRole('heading', { name: 'Tu progreso', exact: true }).waitFor(wait);
      await page.getByRole('button', { name: /Comenzar a estudiar|Continuar estudiando/ }).first().click();
      await page.getByRole('button', { name: 'Volver a los temas' }).click();
      await page.getByRole('button', { name: /2\. Machine learning y deep learning/i }).click();
      await page.getByRole('button', { name: 'Practicar este tema', exact: true }).click();
      await page.locator('article').first().waitFor(wait);
      assert.equal(await page.getByRole('button', { name: 'Empezar práctica' }).count(), 0);
      const horizontal = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(horizontal <= 1, 'Mobile practice must not overflow horizontally: ' + horizontal);
      await page.screenshot({ path: folder + '/practica-' + width + '.png', animations: 'disabled' });
    } catch (error) {
      await page.screenshot({ path: folder + '/failed-mobile-practica-' + width + '.png', animations: 'disabled' }).catch(() => {});
      throw error;
    } finally {
      await page.close();
    }
  });

  await check('mobile reinforcement ' + width, async () => {
    const page = await browser.newPage({ viewport: { width, height: 840 } });
    try {
      await page.goto(baseUrl + '/preview/progreso-pdf?tab=progreso', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.getByRole('heading', { name: 'Tu progreso', exact: true }).waitFor(wait);
      await page.getByRole('button', { name: /Comenzar a estudiar|Continuar estudiando/ }).first().click();
      await page.getByRole('button', { name: 'Reforzar dificultades', exact: true }).first().click();
      const review = page.locator('[data-topic-reinforcement]:visible').first();
      await review.waitFor(wait);
      await review.getByRole('heading', { name: 'La pregunta que te costó' }).waitFor(wait);
      await review.getByRole('button', { name: 'Comprobar lo aprendido' }).waitFor(wait);
      assert.equal(await page.getByRole('button', { name: 'Volver al tema', exact: true }).count(), 1);
      const horizontal = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(horizontal <= 1, 'Mobile reinforcement must not overflow horizontally: ' + horizontal);
      await page.screenshot({ path: folder + '/refuerzo-' + width + '.png', animations: 'disabled' });
    } catch (error) {
      await page.screenshot({ path: folder + '/failed-mobile-refuerzo-' + width + '.png', animations: 'disabled' }).catch(() => {});
      throw error;
    } finally {
      await page.close();
    }
  });
}

await browser.close();
if (failures.length) {
  console.error('\nQA failures:\n' + failures.join('\n\n'));
  process.exitCode = 1;
} else {
  console.log('\nResponsive and guided practice QA passed.');
}
