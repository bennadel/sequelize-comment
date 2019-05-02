module.exports = {
  extends: ['standard', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    semi: ['error', 'always'],
    'no-extra-semi': 'error',
    'no-var': 'error',
    'prefer-const': 'error'
  }
};
