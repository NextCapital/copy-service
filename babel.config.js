module.exports = {
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }]
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: {
          chrome: '79',
          firefox: '72',
          safari: '13',
          edge: '18'
        }
      }
    ],
    '@babel/preset-react'
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            modules: 'commonjs',
            targets: {
              node: 'current'
            }
          }
        ]
      ]
    }
  }
};
