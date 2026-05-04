module.exports = {
  extends: ['expo'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'web-build/', 'functions/lib/'],
};
