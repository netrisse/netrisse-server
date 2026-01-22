const ultraMegaConfig = require('eslint-config-ultra-mega');

module.exports = [
  ...ultraMegaConfig,
  {
    languageOptions: {
      globals: {
        clearInterval: 'false',
        console: 'false',
        module: 'false',
        process: 'false',
        require: 'false',
        setInterval: 'false',
      },
    },
  },
];
