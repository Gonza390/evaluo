import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/.next/**',
      '**/.next*/**',
      '**/.vercel/**',
      '**/node_modules/**',
      'tmp/**',
      'output/**',
      'backups/**',
      '.tmp*/**',
      '**/.tmp*/**',
      '*.log',
      '**/*.log',
      'audit-local.js',
      'audit-local.cjs',
      'tsconfig.tsbuildinfo',
      'seed.js',
      'seed.cjs',
      'tailwind.config.js',
      'tailwind.config.cjs',
      'public/pdf.worker.min.mjs',
      'public/react-pdf-worker-5.4.296.min.mjs',
      'public/pdf-thumbnail-runtime-5.4.296.mjs',
    ],
  },
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  }
);
