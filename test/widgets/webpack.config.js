/**
 * Test and develop a widget by running the following at the root of the git checkout:
 *
 *    bin/webpack-serve --config test/widgets/webpack.config.js --env.widget=WIDGET
 *
 * It will build and serve the demo code with live-reload at
 *
 *    http://localhost:9000/demo.html
 */
'use strict';

const path = require('path');

module.exports = function(env) {
  const widget = process.env.WIDGET;
  return {
    mode: "development",
    entry: {
      demo: [path.resolve(__dirname, widget, 'demo.ts')],
    },
    output: {
      path: path.resolve(__dirname, widget),
      filename: "build/[name].bundle.js",
      sourceMapFilename: "build/[name].bundle.js.map",
    },
    devtool: 'inline-source-map',
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      modules: [
        path.resolve('.'),
        path.resolve('./node_modules')
      ],
    },
    module: {
      rules: [
        { test: /\.tsx?$/, loader: "ts-loader", exclude: /node_modules/ }
      ]
    },
    serve: {
      content: [path.resolve(__dirname, widget), "."],
      port: 9000,
      open: { path: "demo.html" },
    },
  };
};
