const _ = require('lodash');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const webpack = require('webpack');

const config = (mode) => ({
  entry: './copyService.js',

  output: {
    path: `${__dirname}/dist/`,
    filename: `copy-service${mode === 'production' ? '.min' : ''}.js`,
    library: 'copy-service',
    libraryTarget: 'umd'
  },

  module: {
    rules: [{
      test: /\.js?$/,
      loader: 'babel-loader'
    }]
  },

  context: __dirname,

  target: 'web',

  stats: 'normal',

  devtool: mode === 'development' ? 'source-map' : false,

  mode,

  profile: true,

  bail: true,

  cache: true,

  plugins: [
    new LodashModuleReplacementPlugin({
      cloning: true,
      collections: true,
      paths: true
    }),
    new webpack.DefinePlugin({
      DEV_MODE: mode === 'development'
    })
  ]
});

const nodeConfig = (mode) => (
  _.merge({}, config(mode), {
    target: 'node',
    output: {
      filename: `copy-service-node${mode === 'production' ? '.min' : ''}.js`
    }
  })
);

module.exports = [
  config('development'),
  config('production'),
  nodeConfig('development'),
  nodeConfig('production')
];
