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

const glob = require('glob');
const path = require('path');

// Build each */fixture.ts as its own bundle.
const entries = {};
for (const fixture of glob.sync(`${__dirname}/*/fixture.ts`)) {
  entries[path.basename(path.dirname(fixture))] = fixture;
}

module.exports = {
  mode: "development",
  entry: entries,
  output: {
    path: path.resolve(__dirname),
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
    content: [path.resolve(__dirname), "."],
    port: 9000,
    open: { path: "/" },

    // Serve a trivial little index page.
    add: (app, middleware, options) => {
      app.use((ctx, next) => {
        if (ctx.url === '/') {
          ctx.type = 'html';
          ctx.body = Object.keys(entries).map((e) => `<a href="${e}/fixture.html">${e}</a><br>\n`).join('');
        }
        return next();
      });
    },
  }
};
