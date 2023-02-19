module.exports = {
  env: {
    browser: false,
    es2020: true,
    jest: true,
    node: true,
  },
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  settings: {
    'import/resolver': {
      node: {},
      typescript: {
        project: './tsconfig.es.json',
        alwaysTryTypes: true,
      },
    },
  },
  rules: {
    '@typescript-eslint/ban-ts-ignore': ['off'],
    '@typescript-eslint/camelcase': ['off'],
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    '@typescript-eslint/explicit-member-accessibility': 'error',
    '@typescript-eslint/interface-name-prefix': ['off'],
    '@typescript-eslint/member-delimiter-style': ['error', { multiline: { delimiter: 'none' } }],
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: {
          memberTypes: [
            'signature',
            'public-field', // = ['public-static-field', 'public-instance-field']
            'protected-field', // = ['protected-static-field', 'protected-instance-field']
            'private-field', // = ['private-static-field', 'private-instance-field']
            'constructor',
            'public-method', // = ['public-static-method', 'public-instance-method']
            'protected-method', // = ['protected-static-method', 'protected-instance-method']
            'private-method', // = ['private-static-method', 'private-instance-method']
          ],
          order: 'alphabetically',
        },
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-inferrable-types': ['off'],
    '@typescript-eslint/no-unused-vars': ['off', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-use-before-define': ['off'],
    '@typescript-eslint/semi': ['error', 'never'],
    'array-bracket-spacing': ['error', 'never', { singleValue: false }],
    'arrow-body-style': ['error', 'as-needed'],
    'computed-property-spacing': ['error', 'never'],
    'func-style': ['warn', 'declaration'],
    'keyword-spacing': 'error',
    'newline-before-return': 'off',
    'no-console': 0,
    'no-extra-semi': 'error',
    'no-multi-spaces': ['error', { ignoreEOLComments: false }],
    'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0 }],
    'no-throw-literal': 'error',
    'no-unexpected-multiline': 'error',
    'no-unreachable': 'error',
    'no-unused-vars': 'off',
    'object-curly-spacing': ['error', 'always'],
    'prefer-arrow-callback': 'error',
    quotes: ['error', 'single', { allowTemplateLiterals: true }],
    semi: ['error', 'never', { beforeStatementContinuationChars: 'never' }],
    'semi-spacing': ['error', { after: true, before: false }],
    'semi-style': ['error', 'first'],
  },
}
