import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        browser: true,
        es2022: true,
        node: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-explicit-any': 'off',
      'prefer-const': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts'],
  },
]
