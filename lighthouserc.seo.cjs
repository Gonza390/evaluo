/**
 * Dedicated SEO Lighthouse coverage. Kept separate from the 3-run core
 * performance baseline to cover every indexable, non-university study landing
 * without extending the production performance measurements.
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm start',
      startServerReadyPattern: 'Ready in|Local:',
      startServerReadyTimeout: 120000,
      numberOfRuns: 1,
      url: [
        'http://localhost:3000/ia-para-estudiantes',
        'http://localhost:3000/estudiar-pdf-con-ia',
        'http://localhost:3000/en',
        'http://localhost:3000/en/pdf-to-quiz',
        'http://localhost:3000/en/pdf-to-flashcards',
        'http://localhost:3000/en/study-pdf-with-ai',
        'http://localhost:3000/funciones/resumir-pdf-con-ia',
        'http://localhost:3000/funciones/crear-flashcards-desde-pdf',
        'http://localhost:3000/funciones/crear-mapa-mental-desde-pdf',
        'http://localhost:3000/convertir-pdf-en-preguntas',
        'http://localhost:3000/funciones/simulacro-examen-con-ia',
        'http://localhost:3000/funciones/practicar-por-tema',
        'http://localhost:3000/comparar/evaluo-vs-notebooklm',
        'http://localhost:3000/comparar/evaluo-vs-chatgpt',
        'http://localhost:3000/comparar/evaluo-vs-quizlet',
      ],
      settings: {
        chromeFlags: '--headless=new --no-sandbox',
      },
    },
    assert: {
      assertions: {
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.7 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4800 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.12 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci/seo-reports',
    },
  },
};
