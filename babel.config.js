module.exports = {
  "plugins": [
    ["@babel/plugin-proposal-class-properties", { "loose": true }]
  ],
  "presets": [
    [
      "@babel/preset-env",
      {
        "modules": false
      }
    ],
    "@babel/preset-react"
  ],
  "env": {
    "test": {
      "presets": [
        [
          "@babel/preset-env",
          {
            "modules": "commonjs"
          }
        ]
      ]
    }
  }
};
