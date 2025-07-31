module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
    'vue/setup-compiler-macros': true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    // 错误级别规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': ['error', { destructuring: 'all' }],

    // Vue 特定规则
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/html-closing-bracket-newline': ['error', {
      'singleline': 'never',
      'multiline': 'always'
    }],
    'vue/html-self-closing': ['error', {
      'html': {
        'void': 'always',
        'normal': 'always',
        'component': 'always'
      }
    }],
    'vue/max-attributes-per-line': ['error', {
      'singleline': 3,
      'multiline': 1
    }],
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn',

    // 格式化规则
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'only-multiline'],
    'arrow-parens': ['error', 'as-needed'],
    'eqeqeq': ['error', 'always', { 'null': 'ignore' }],

    // 复杂度规则
    'max-len': ['warn', { 'code': 120, 'ignoreComments': true, 'ignoreStrings': true, 'ignoreTemplateLiterals': true }],
    'complexity': ['warn', 15],
    'max-depth': ['warn', 4],
    'max-nested-callbacks': ['warn', 3],
    'max-statements': ['warn', 30]
  },
  overrides: [
    {
      files: ['*.test.js', '*.spec.js'],
      rules: {
        'no-undef': 'off',
        'max-statements': 'off'
      }
    },
    {
      files: ['*.vue'],
      rules: {
        'indent': 'off' // 在Vue文件中禁用缩进规则，避免与Vue格式化冲突
      }
    }
  ]
};
