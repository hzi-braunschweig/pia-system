module.exports = {
  root: true,
  env: {
    commonjs: true,
    es2020: true,
    node: true,
    mocha: true,
  },
  plugins: ['no-only-tests'],
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    'no-console': 'off',
    'no-var': 'error',
    'prefer-const': 'error',
    'no-only-tests/no-only-tests': 'error',
  },
  ignorePatterns: ['dist'],
};
