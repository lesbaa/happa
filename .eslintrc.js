module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 2019,
    sourceType: 'module',
    useJSXTextNode: true,
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  rules: {
    'no-console': 1,
    'no-underscore-dangle': 0,
    'no-unused-vars': 0,
    'no-useless-escape': 0,
    quotes: [2, 'single', { allowTemplateLiterals: true }],
    semi: [2, 'always'],
    strict: 2,
    'no-cond-assign': 2,
    'no-constant-condition': 2,
    'no-unreachable': 0,
    'no-dupe-else-if': 2,
    'no-duplicate-case': 2,
    'no-dupe-keys': 0,
    'no-empty': 1,
    'no-ex-assign': 2,
    'no-extra-boolean-cast': 1,
    'no-extra-semi': 1,
    'no-func-assign': 2,
    'no-import-assign': 2,
    'no-invalid-regexp': 2,
    'no-obj-calls': 2,
    'no-prototype-builtins': 0,
    'no-template-curly-in-string': 1,
    'no-unsafe-finally': 2,
    'no-unsafe-negation': 2,
    'no-unexpected-multiline': 2,
    'use-isnan': 2,
    'valid-typeof': 0,
    'array-callback-return': 2,
    'block-scoped-var': 2,
    'class-methods-use-this': 2,
    complexity: 2,
    'consistent-return': 2,
    'default-param-last': 2,
    eqeqeq: 2,
    'dot-notation': [
      2,
      { allowPattern: '^(([a-z]+_[a-z]+)|([A-Z][^A-Z]+))+$' },
    ],
    'guard-for-in': 2,
    'max-classes-per-file': 2,
    'no-alert': 2,
    'no-caller': 2,
    'no-case-declarations': 2,
    'no-constructor-return': 2,
    'no-else-return': 1,
    'no-empty-pattern': 2,
    'no-eq-null': 2,
    'no-eval': 2,
    'no-extend-native': 2,
    'no-extra-bind': 1,
    'no-extra-label': 1,
    'no-fallthrough': 2,
    'no-floating-decimal': 2,
    'no-global-assign': 2,
    'no-implicit-coercion': 2,
    'no-implicit-globals': 2,
    'no-implied-eval': 2,
    'no-invalid-this': 0,
    'no-iterator': 2,
    'no-labels': 2,
    'no-lone-blocks': 1,
    'no-loop-func': 2,
    'no-magic-numbers': [
      1,
      {
        ignore: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        detectObjects: false,
        enforceConst: true,
      },
    ],
    'no-multi-str': 1,
    'no-new-func': 2,
    'newline-before-return': 1,
    'no-new-wrappers': 2,
    'no-octal': 2,
    'no-octal-escape': 2,
    'no-param-reassign': 2,
    'no-proto': 2,
    'no-redeclare': 0,
    'no-restricted-properties': 2,
    'no-return-assign': 2,
    'no-return-await': 2,
    'no-script-url': 2,
    'no-self-assign': 1,
    'no-self-compare': 1,
    'no-sequences': 2,
    'no-throw-literal': 2,
    'no-unmodified-loop-condition': 2,
    'no-unused-expressions': 0,
    'no-unused-labels': 2,
    'no-useless-call': 2,
    'no-useless-catch': 1,
    'no-useless-concat': 1,
    'no-useless-return': 1,
    'no-void': 2,
    'no-with': 2,
    'prefer-promise-reject-errors': 1,
    'prefer-regex-literals': 1,
    'require-await': 0,
    'wrap-iife': [2, 'any'],
    yoda: 2,
    'eol-last': 1,
    'init-declarations': 0,
    'no-delete-var': 2,
    'no-label-var': 2,
    'no-restricted-globals': 2,
    'no-shadow': 0,
    'no-shadow-restricted-names': 2,
    'no-undef': 0,
    'no-undef-init': 2,
    'no-use-before-define': 0,
    'constructor-super': 2,
    'no-class-assign': 2,
    'no-confusing-arrow': 0,
    'no-const-assign': 0,
    'no-dupe-class-members': 0,
    'no-duplicate-imports': 0,
    'no-new-symbol': 0,
    'no-restricted-imports': 2,
    'no-this-before-super': 0,
    'no-useless-computed-key': 2,
    'no-useless-rename': 2,
    'no-useless-constructor': 1,
    'no-var': 0,
    'prefer-arrow-callback': 2,
    'prefer-const': 2,
    'prefer-rest-params': 2,
    'prefer-spread': 2,
    'require-yield': 2,
    'prefer-template': 2,
    'sort-imports': 0,
    'react/button-has-type': 2,
    'react/prefer-es6-class': 0,
    'react/no-find-dom-node': 2,
    'react/default-props-match-prop-types': 0,
    'react/destructuring-assignment': 0,
    'react/no-access-state-in-setstate': 2,
    'react/no-children-prop': 2,
    'react/no-danger': 2,
    'react/no-danger-with-children': 2,
    'react/no-deprecated': 0,
    'react/no-direct-mutation-state': 0,
    'react/display-name': 0,
    'react/no-multi-comp': 0,
    'react/no-redundant-should-component-update': 0,
    'react/no-render-return-value': 2,
    'react/no-typos': 0,
    'react/no-string-refs': 0,
    'react/no-this-in-sfc': 0,
    'react/no-unescaped-entities': 2,
    'react/no-unknown-property': 2,
    'react/no-unsafe': 0,
    'react/no-unused-state': 0,
    'react/no-unused-prop-types': 0,
    'react/prefer-read-only-props': 2,
    'react/prefer-stateless-function': 0,
    'react/prop-types': 0,
    'react/react-in-jsx-scope': 2,
    'react/require-render-return': 2,
    'react/self-closing-comp': 2,
    'react/state-in-constructor': 0,
    'react/void-dom-elements-no-children': 0,
    'react/jsx-no-undef': 0,
    'react/jsx-key': 2,
    'react/jsx-no-useless-fragment': 1,
    'react/jsx-no-literals': 0,
    'react/jsx-no-duplicate-props': 1,
    'react/jsx-curly-brace-presence': 1,
    'react/jsx-pascal-case': 1,
    'react-hooks/rules-of-hooks': 2,
    'react-hooks/exhaustive-deps': 1,
    'simple-import-sort/imports': 2,
    'import/first': 2,
    'import/newline-after-import': 2,
    'import/no-duplicates': 0,
    '@typescript-eslint/camelcase': 0,
    '@typescript-eslint/init-declarations': 2,
    '@typescript-eslint/no-angle-bracket-type-assertion': 0,
    '@typescript-eslint/consistent-type-definitions': 1,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/explicit-member-accessibility': 0, // for now
    '@typescript-eslint/no-explicit-any': 2,
    '@typescript-eslint/no-empty-interface': 0,
    '@typescript-eslint/no-inferrable-types': 0,
    '@typescript-eslint/ban-ts-ignore': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/no-misused-promises': 0,
    '@typescript-eslint/no-unsafe-assignment': 0,
    '@typescript-eslint/no-unsafe-call': 0,
    '@typescript-eslint/no-unsafe-member-access': 0,
    '@typescript-eslint/no-unsafe-return': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-unused-vars': [
      2,
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        args: 'all',
      },
    ],
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/no-use-before-define': [2, { functions: false }],
    '@typescript-eslint/unbound-method': 0,
    '@typescript-eslint/no-unused-expressions': 2,
    '@typescript-eslint/no-floating-promises': 0,
    '@typescript-eslint/ban-types': 0,
    '@typescript-eslint/restrict-template-expressions': 0,
    '@typescript-eslint/no-shadow': 2,
    '@typescript-eslint/no-non-null-assertion': 0,
  },
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      rules: {
        '@typescript-eslint/no-unsafe-member-access': 0,
        '@typescript-eslint/explicit-module-boundary-types': 0,
        '@typescript-eslint/restrict-template-expressions': 0,
        '@typescript-eslint/restrict-plus-operands': 0,
        '@typescript-eslint/no-unsafe-argument': 0,
      },
    },
  ],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'simple-import-sort',
    'import',
  ],
  settings: {
    react: {
      version: '16.9.0',
    },
  },
};
