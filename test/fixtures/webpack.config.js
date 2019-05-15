/**
 * Test and develop a widget by running the following at the root of the git checkout:
 *
 *    bin/webpack-dev-server --config test/fixtures/webpack.config.js
 *
 * It will build and serve the demo code with live-reload at
 *
 *    http://localhost:9000/demo.html
 */
'use strict';

const fs = require('fs');
const glob = require('glob');
const path = require('path');

// Build each */index.ts as its own bundle.
const entries = {};
for (const fixture of glob.sync(`${__dirname}/*.ts`)) {
  const name = path.basename(fixture, '.ts');
  if (name.startsWith('webpack')) { continue; }
  entries[name] = fixture;
}

// Generic trivial html template for all projects.
const htmlTemplate = fs.readFileSync(`${__dirname}/template.html`, 'utf8');

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
  devServer: {
    contentBase: path.resolve(__dirname),
    port: process.env.PORT || 9200,
    open: process.env.OPEN_BROWSER || 'Google Chrome',

    // Serve a trivial little index page with a directory, and a template for each project.
    before: (app, server) => {
      // app is an express app; we get a chance to add custom endpoints to it.
      app.get('/', (req, res) =>
        res.send(Object.keys(entries).map((e) => `<a href="${e}">${e}</a><br>\n`).join('')));
      app.get(Object.keys(entries).map((e) => `/${e}`), (req, res) =>
        res.send(htmlTemplate.replace('<NAME>', path.basename(req.url))));
    },
  }
};
