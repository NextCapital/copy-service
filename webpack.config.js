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

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },

  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.json', '.ts']
  },

  context: __dirname,

  target: 'web',

  mode: 'production',

  stats: 'normal',

  profile: true,

  bail: true
};
