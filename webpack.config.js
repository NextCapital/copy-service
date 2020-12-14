const _ = require('lodash');
const path = require('path');

// NOTE: Build exists for example purposes only. Typically, import directly from source.
module.exports = {
  entry: './js/index.js',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: `copy-service.js`,
    library: 'copy-service',
    libraryTarget: 'umd'
  },

  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.json']
  },

  context: __dirname,

  target: 'web',

  mode: 'production',

  stats: 'normal',

  profile: true,

  bail: true
};
