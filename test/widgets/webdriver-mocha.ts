import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as repl from 'repl';
import * as webdriver from 'selenium-webdriver';
import {By, logging, ThenableWebDriver, until,
        WebDriver, WebElement, WebElementPromise} from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as firefox from 'selenium-webdriver/firefox';

chai.use(chaiAsPromised);

/**
 * By using `import {assert} from 'webdriver-mocha', you can rely on chai-as-promised,
 * e.g. use `await assert.isRejected(promise)`.
 */
export {assert} from 'chai';

/**
 * Use `import {driver} from 'webdriver-mocha' to access a WebDriver with extra methods.
 */
export let driver: IWebDriverPlus;

/**
 * Use useServer() from a test suite to start an implementation of IMochaServer with the test.
 */
export interface IMochaServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  getHost(): string;
}

const _servers: Set<IMochaServer> = new Set();

/**
 * Use this from a test suite (i.e. inside a describe() clause) to start the given server. If the
 * same server is used by multiple tests, the server is reused.
 */
export function useServer(server: IMochaServer) {
  before(async () => {
    if (!_servers.has(server)) {
      _servers.add(server);
      await server.start();
    }
  });
  // Stopping of the started-up servers happens in cleanup().
}

// Command-line option for whether to keep browser open if a test fails. This is interpreted by
// mocha, and we use it too to start up a REPL when this option is used.
const noexit: boolean = (process.argv.indexOf("--no-exit") !== -1);

/**
 * Enhanced WebDriver interface.
 */
export interface IWebDriverPlus extends ThenableWebDriver {
  /**
   * Shorthand to find element by css selector.
   */
  find(selector: string): WebElementPromise;

  /**
   * Shorthand to wait for an element to be present, using a css selector.
   */
  findWait(timeoutSec: number, selector: string, message?: string): WebElementPromise;

  /**
   * Shorthand to find all element matching a css selector.
   */
  findAll(selector: string): Promise<WebElement[]>;

  /**
   * Find elements by a css selector, and filter by getText() matching the given regex.
   */
  findContent(selector: string, contentRE: RegExp): WebElementPromise;
}

// Implementation of the enhanced WebDriver interface.
Object.assign(WebDriver.prototype, {
  find(this: IWebDriverPlus, selector: string): WebElementPromise {
    return this.findElement(By.css(selector));
  },

  findWait(this: IWebDriverPlus, timeoutSec: number, selector: string, message?: string): WebElementPromise {
    return this.wait(until.elementLocated(By.css(selector)), timeoutSec * 1000, message);
  },

  async findAll(this: IWebDriverPlus, selector: string): Promise<WebElement[]> {
    return this.findElements(By.css(selector));
  },

  findContent(this: IWebDriverPlus, selector: string, contentRE: RegExp): WebElementPromise {
    return new WebElementPromise(this, (async () => {
      const elements = await this.findElements(By.css(selector));
      const allText = await Promise.all(elements.map((e) => e.getText()));
      const elem = elements.find((el, index) => contentRE.test(allText[index]));
      if (!elem) { throw new Error(`None of ${elements.length} elements match ${contentRE}`); }
      return elem;
    })());
  },
});

// Start up the webdriver and serve files that its browser will see.
before(async function() {
  this.timeout(20000);      // Set a longer default timeout.

  // Set up browser options.
  const logPrefs = new logging.Preferences();
  logPrefs.setLevel(logging.Type.BROWSER, logging.Level.INFO);

  driver = new webdriver.Builder()
    .forBrowser('firefox')
    .setLoggingPrefs(logPrefs)
    .setChromeOptions(new chrome.Options())
    .setFirefoxOptions(new firefox.Options())
    .build() as IWebDriverPlus;
});

// Quit the webdriver and stop serving files, unless we failed and --no-exit is given.
after(async function() {
  let countFailed = 0;
  this.test.parent.eachTest((test: any) => { countFailed += test.state === 'failed' ? 1 : 0; });
  if (countFailed > 0 && noexit) {
    startRepl();
  } else {
    await cleanup();
  }
});

async function cleanup() {
  if (driver) { await driver.quit(); }

  // Stop all servers registered with useServer().
  await Promise.all(Array.from(_servers, (server) => server.stop()));
}

async function startRepl() {
  // Wait a bit to let mocha print out its errors before REPL prints its prompts.
  await new Promise((resolve) => setTimeout(resolve, 50));
  // Continue running by keeping server and webdriver, and waiting for an hour.
  // tslint:disable:no-console
  console.log("Not exiting. Abort with Ctrl-C, or type '.exit'");
  console.log("You may interact with the browser here, e.g. driver.find('.css_selector')");
  const replObj = repl.start({ prompt: "node> ", ignoreUndefined: true});
  enhanceRepl(replObj);
  Object.assign(replObj.context, {driver});
  replObj.on('exit', cleanup);
}

// TODO: would like ability to re-run the failed test suite.
// TODO: want the ability to use same webpack-serve without specifying WIDGET

function enhanceRepl(replObj: any): void {
  // Replace eval with a version that resolves returned values and stringifies WebElements.
  const origEval = replObj.eval;
  replObj.eval = function(cmd: any, context: any, filename: any, callback: any) {
    origEval(cmd, context, filename, (err: any, value: any) => {
      if (err) { callback(err, value); }
      Promise.resolve(value)
      .then((result) => useElementDescriptions(result))
      .then((result) => callback(err, result))
      .catch((error) => callback(error));
    });
  };
}

async function useElementDescriptions(obj: any): Promise<any> {
  if (obj instanceof webdriver.WebElement) {
    return await describeElement(obj);
  } else if (Array.isArray(obj)) {
    return await Promise.all(obj.map(useElementDescriptions));
  } else {
    return obj;
  }
}

async function describeElement(obj: webdriver.WebElement): Promise<string> {
  const [elemId, id, tagName, classAttr] = await Promise.all([
    obj.getId(), obj.getAttribute('id'), obj.getTagName(), obj.getAttribute('class'),
  ]);
  const idStr = id ? '#' + id : '';
  const classes = classAttr ? '.' + classAttr.replace(/ /g, '.') : '';
  return `${tagName}${idStr}${classes}[${elemId}]`;
}
