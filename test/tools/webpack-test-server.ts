import {IMochaServer} from 'mocha-webdriver';
import * as webpack from 'webpack';
// @ts-ignore
import * as WebpackDevServer from 'webpack-dev-server';

// tslint:disable:no-console

export class WebpackServer implements IMochaServer {
  // WebpackDevServer instance. See https://github.com/webpack/docs/wiki/webpack-dev-server
  private _server: any;
  private _port: number = 0;

  public async start() {
    const config = require('../fixtures/webpack.config.js');
    console.log("Starting webpack-dev-serve");
    this._server = new WebpackDevServer(webpack(config), {
      ...config.devServer,
      noInfo: true,
      open: false,
    });
    const port = this._port = config.devServer.port;
    await new Promise((resolve, reject) => this._server.listen(port, 'localhost', resolve).on('error', reject));
  }

  public async stop() {
    console.log("Stopping webpack-dev-serve");
    this._server.close();
  }

  public getHost(): string {
    return `http://localhost:${this._port}`;
  }
}

export const server = new WebpackServer();
