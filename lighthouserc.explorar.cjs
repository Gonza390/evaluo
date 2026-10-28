// /explorar: Lighthouse's simulation repeatedly extrapolated ~4.3–4.5 s of
// LCP from a source trace that painted the candidate much earlier. Applied
// Chrome throttling measures the actual delayed load and preserves all budgets.
// All other pages retain the regular simulated profile in lighthouserc.cjs.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const baseline = require('./lighthouserc.cjs');

module.exports = {
  ci: {
    ...baseline.ci,
    collect: {
      ...baseline.ci.collect,
      url: ['http://localhost:3000/explorar'],
      settings: {
        ...baseline.ci.collect.settings,
        throttlingMethod: 'devtools',
      },
    },
    upload: {
      ...baseline.ci.upload,
      outputDir: './.lighthouseci/explorar-reports',
    },
  },
};
