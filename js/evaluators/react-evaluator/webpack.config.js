const _ = require('lodash');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const webpack = require('webpack');

const config = (mode) => ({
  entry: './ReactEvaluator.js',

  output: {
    path: `${__dirname}/dist/`,
    filename: `react-evaluator${mode === 'production' ? '.min' : ''}.js`,
    library: 'react-evaluator',
    libraryTarget: 'umd'
  },

  module: {
    rules: [{
      test: /\.js?$/,
      loader: 'babel-loader'
    }]
  },

  externals: {
    'react': 'React'
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
    new webpack.DefinePlugin({ DEV_MODE: mode === 'development' })
  ]
});

const nodeConfig = (mode) => (
  _.merge({}, config(mode), {
    target: 'node',
    output: { filename: `react-evaluator-node${mode === 'production' ? '.min' : ''}.js` }
  })
);

module.exports = [
  config('development'),
  config('production'),
  nodeConfig('development'),
  nodeConfig('production')
];
