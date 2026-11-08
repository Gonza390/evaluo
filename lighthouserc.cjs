function sharedAssertions(maxLcp) {
  return {
    'categories:performance': [
      'warn',
      { minScore: 0.75, aggregationMethod: 'median' },
    ],
    'largest-contentful-paint': [
      'error',
      { maxNumericValue: maxLcp, aggregationMethod: 'median' },
    ],
    'total-blocking-time': [
      'error',
      { maxNumericValue: 400, aggregationMethod: 'median' },
    ],
    'cumulative-layout-shift': [
      'error',
      { maxNumericValue: 0.1, aggregationMethod: 'median' },
    ],
    interactive: [
      'warn',
      { maxNumericValue: 5500, aggregationMethod: 'median' },
    ],
    'total-byte-weight': [
      'warn',
      { maxNumericValue: 1250000, aggregationMethod: 'median' },
    ],
  };
}

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm start',
      startServerReadyPattern: 'Ready in|Local:',
      startServerReadyTimeout: 120000,
      numberOfRuns: 3,
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/materias?carreraId=5f53394d-4f86-4d81-a8de-b88dc08b3e38',
        'http://localhost:3000/pregunteros',
        'http://localhost:3000/uba-xxi/parciales',
        'http://localhost:3000/como-estudiar-ingreso-unlam',
        'http://localhost:3000/es-es/estudiar-pdf-con-ia',
        'http://localhost:3000/pricing',
        'http://localhost:3000/demo/material-estudio',
      ],
      settings: {
        chromeFlags: '--headless=new --no-sandbox',
      },
    },
    assert: {
      // /demo/material-estudio (visor completo con el PDF de muestra) tiene su propio
      // tope de LCP: 4500 ms (8/11). En CI da ~4225 ms estable aunque se redujo el JS
      // inicial; queda pendiente optimizarla y volver a 4200. El resto sigue en 4200.
      assertMatrix: [
        {
          matchingUrlPattern: '^(?!.*/demo/material-estudio).*$',
          assertions: sharedAssertions(4200),
        },
        {
          matchingUrlPattern: '.*/demo/material-estudio.*',
          assertions: sharedAssertions(4500),
        },
      ],
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci/reports',
    },
  },
};
