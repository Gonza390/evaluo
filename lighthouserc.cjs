module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm start',
      startServerReadyPattern: 'Ready in|Local:',
      startServerReadyTimeout: 120000,
      numberOfRuns: 3,
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/explorar',
        'http://localhost:3000/pricing',
        'http://localhost:3000/demo/material-estudio',
      ],
      settings: {
        chromeFlags: '--headless=new --no-sandbox',
      },
    },
    assert: {
      assertions: {
        'categories:performance': [
          'warn',
          { minScore: 0.75, aggregationMethod: 'median' },
        ],
        'largest-contentful-paint': [
          'error',
          { maxNumericValue: 4000, aggregationMethod: 'median' },
        ],
        'total-blocking-time': [
          'error',
          { maxNumericValue: 300, aggregationMethod: 'median' },
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
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci/reports',
    },
  },
};
