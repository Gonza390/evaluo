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
