const baseTSConfig = require('@nextcapital/eslint-config-typescript');
const jestTSConfig = require('@nextcapital/eslint-config-typescript/jest');
const jsdocTSConfig = require('@nextcapital/eslint-config-typescript/jsdoc');
const reactTSConfig = require('@nextcapital/eslint-config-typescript/react');

const tsParser = require('@typescript-eslint/parser');

module.exports = [
  ...baseTSConfig,
  ...jestTSConfig,
  ...jsdocTSConfig,
  ...reactTSConfig,
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2016,
        sourceType: 'module'
      }
    },
    settings: {
      jest: {
        version: 29 // TODO: Fix and remove
      },
      react: {
        version: 'detect',
        defaultVersion: '18.2'
      }
    }
  },
  {
    rules: {
      '@stylistic/jsx-props-no-multi-spaces': 'off',

      'class-methods-use-this': 'off',

      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',

      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/valid-types': 'off'
    }
  },
  {
    files: [
      'js/**/*.test.*'
    ],
    rules: {
      'react/jsx-props-no-spreading': 'off'
    }
  },
];
