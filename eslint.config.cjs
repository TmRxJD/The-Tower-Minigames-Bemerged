const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const stylistic = require('@stylistic/eslint-plugin')

const sharedRules = {
  'no-console': 'off',
  'no-debugger': 'error',
  '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
  '@stylistic/semi': ['error', 'never'],
  '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
  '@stylistic/object-curly-spacing': ['error', 'always'],
  '@stylistic/array-bracket-spacing': ['error', 'never'],
  '@stylistic/space-before-function-paren': [
    'error',
    { anonymous: 'always', named: 'never', asyncArrow: 'always' },
  ],
  '@stylistic/comma-dangle': ['error', 'always-multiline'],
  '@stylistic/no-trailing-spaces': 'error',
  '@stylistic/eol-last': ['error', 'always'],
  '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
  '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
  '@stylistic/space-infix-ops': 'error',
  '@stylistic/space-unary-ops': 'error',
  '@stylistic/no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
}

module.exports = [
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/*.min.js', '**/*.tsbuildinfo'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      ...sharedRules,
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@stylistic': stylistic,
    },
    rules: {
      ...sharedRules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]
