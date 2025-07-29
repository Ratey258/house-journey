module.exports = {
  root: true,
  env: {
    node: true,
    'vue/setup-compiler-macros': true
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022
  },
  rules: {
    // Vue风格规则
    'vue/html-indent': ['error', 2],
    'vue/max-attributes-per-line': ['error', {
      singleline: 3,
      multiline: 1
    }],
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],

    // JavaScript规则
    'indent': ['error', 2],
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    'semi': ['error', 'always'],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    // 命名规则
    'camelcase': ['error', { properties: 'never' }],

    // 最大行长度
    'max-len': ['warn', {
      code: 150,
      ignoreComments: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true
    }],

    // 空格与格式
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'arrow-spacing': ['error', { before: true, after: true }],
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }]
  }
};
