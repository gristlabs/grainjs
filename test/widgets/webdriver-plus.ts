import {By, promise, until, WebDriver,
        WebElement, WebElementCondition, WebElementPromise} from 'selenium-webdriver';

/**
 * This is implemented by both the WebDriver, and individual WebElements.
 */
export interface IFindInterface {
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
  findAll(selector: string): promise.Promise<WebElement[]>;

  /**
   * Find elements by a css selector, and filter by getText() matching the given regex.
   */
  findContent(selector: string, contentRE: RegExp): WebElementPromise;
}

declare module "selenium-webdriver" {
  // tslint:disable:interface-name no-shadowed-variable no-empty-interface

  /**
   * Enhanced WebDriver with shorthand find*() methods.
   */
  interface WebDriver extends IFindInterface {
    // No extra methods beside IFindInterface.
  }

  /**
   * Enhanced WebElement, with shorthand find*() methods, and chainable do*() methods.
   */
  interface WebElement extends IFindInterface {
    doClick(): WebElementPromise;
    doSendKeys(): WebElementPromise;
    doSubmit(): WebElementPromise;
    doSlear(): WebElementPromise;
  }
}

async function findContentHelper(finder: WebDriver|WebElement,
                                 selector: string, contentRE: RegExp): Promise<WebElement> {
  const elements = await finder.findElements(By.css(selector));
  const allText = await Promise.all(elements.map((e) => e.getText()));
  const elem = elements.find((el, index) => contentRE.test(allText[index]));
  if (!elem) { throw new Error(`None of ${elements.length} elements match ${contentRE}`); }
  return elem;
}

// Enhance WebDriver to implement IWebDriverPlus interface.
Object.assign(WebDriver.prototype, {
  find(this: WebDriver, selector: string): WebElementPromise {
    return this.findElement(By.css(selector));
  },

  findAll(this: WebDriver, selector: string): promise.Promise<WebElement[]> {
    return this.findElements(By.css(selector));
  },

  findWait(this: WebDriver, timeoutSec: number, selector: string, message?: string): WebElementPromise {
    return this.wait(until.elementLocated(By.css(selector)), timeoutSec * 1000, message);
  },

  findContent(this: WebDriver, selector: string, contentRE: RegExp): WebElementPromise {
    return new WebElementPromise(this, findContentHelper(this, selector, contentRE));
  },
});

// Enhance WebElement to implement IWebElementPlus interface.
Object.assign(WebElement.prototype, {
  find(this: WebElement, selector: string): WebElementPromise {
    return this.findElement(By.css(selector));
  },

  findAll(this: WebElement, selector: string): promise.Promise<WebElement[]> {
    return this.findElements(By.css(selector));
  },

  findWait(this: WebElement, timeoutSec: number, selector: string, message?: string): WebElementPromise {
    const condition = new WebElementCondition(`for element matching ${selector}`,
      () => this.findElements(By.css(selector)).then((e) => e[0]));
    return this.getDriver().wait(condition, timeoutSec * 1000, message);
  },

  findContent(this: WebDriver, selector: string, contentRE: RegExp): WebElementPromise {
    return new WebElementPromise(this, findContentHelper(this, selector, contentRE));
  },

  doClick(this: WebElement): WebElementPromise {
    return new WebElementPromise(this.getDriver(), this.click().then(() => this));
  },
  doSendKeys(this: WebElement, ...args: any[]): WebElementPromise {
    return new WebElementPromise(this.getDriver(), this.sendKeys(...args).then(() => this));
  },
  doSubmit(this: WebElement): WebElementPromise {
    return new WebElementPromise(this.getDriver(), this.submit().then(() => this));
  },
  doClear(this: WebElement): WebElementPromise {
    return new WebElementPromise(this.getDriver(), this.clear().then(() => this));
  },
});
