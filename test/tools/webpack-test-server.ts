import {IMochaServer} from 'mocha-webdriver';
import * as webpack from 'webpack';
import * as WebpackDevServer from 'webpack-dev-server';

// tslint:disable:no-console

export class WebpackServer implements IMochaServer {
  // WebpackDevServer instance. See https://github.com/webpack/docs/wiki/webpack-dev-server
  private _server: any;
  private _port: number = 0;

  public async start() {
    const config = require('../fixtures/webpack.config.js');
    console.log("Starting webpack-dev-serve");
    this._server = new WebpackDevServer({
      ...config.devServer,
      open: false,
    }, webpack(config));
    this._port = config.devServer.port;
    await new Promise((resolve, reject) => this._server.startCallback(resolve));
  }

  public async stop() {
    console.log("Stopping webpack-dev-serve");
    this._server.stop();
  }

  public getHost(): string {
    return `http://localhost:${this._port}`;
  }
}

export const server = new WebpackServer();
