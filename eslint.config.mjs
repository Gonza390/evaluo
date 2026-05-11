import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/.next/**',
      '**/.vercel/**',
      '**/node_modules/**',
      'audit-local.js',
      'audit-local.cjs',
      'tsconfig.tsbuildinfo',
      'seed.js',
      'seed.cjs',
      'tailwind.config.js',
      'tailwind.config.cjs',
      'public/pdf.worker.min.mjs',
      'public/react-pdf-worker-5.4.296.min.mjs',
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
