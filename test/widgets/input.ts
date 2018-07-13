import {Key} from 'selenium-webdriver';
import {assert, driver, useServer} from '../tools/webdriver-mocha';
import {server} from '../tools/webpack-test-server';

describe('select', () => {
  useServer(server);

  before(async function() {
    this.timeout(20000);      // Set a longer default timeout.
    await driver.get(`${server.getHost()}/input/fixture.html`);
  });

  function getAllValues() {
    return Promise.all([
      driver.find('#test1 input').value(),
      driver.find('#test2 input').value(),
      driver.find('#test3 input').value(),
    ]);
  }

  it('should update observable on enter and blur', async () => {
    assert.deepEqual(await getAllValues(), ['grain', 'grain', 'grain']);

    await driver.find('#test1 input').doClear().sendKeys("hello");
    assert.deepEqual(await getAllValues(), ['hello', '', '']);

    await driver.find('#test1 input').sendKeys("1", Key.ENTER);
    assert.deepEqual(await getAllValues(), ['hello1', 'hello1', 'hello1']);

    await driver.find('#test1 input').sendKeys(Key.BACK_SPACE, Key.BACK_SPACE, Key.BACK_SPACE, "p");
    assert.deepEqual(await getAllValues(), ['help', 'hello1', 'hello1']);

    // TODO: Losing focus by clicking away doesn't work on Firefox webdriver :(
    if ((await driver.getCapabilities()).getBrowserName() === 'firefox') {
      await driver.find('#test1 input').sendKeys(Key.ENTER);
    } else {
      await driver.find('#test2 input').click();
    }
    assert.deepEqual(await getAllValues(), ['help', 'help', 'help']);
  });

  it('should not update on invalid value when onlyIfValid', async () => {
    await driver.find('#test2 input').doClear().sendKeys("user", Key.ENTER);
    assert.deepEqual(await getAllValues(), ['', 'user', '']);

    await driver.find('#test2 input').sendKeys("@a.com", Key.ENTER);
    assert.deepEqual(await getAllValues(), ['user@a.com', 'user@a.com', 'user@a.com']);

    await driver.find('#test2 input').sendKeys(".", Key.ENTER);
    assert.deepEqual(await getAllValues(), ['user@a.com', 'user@a.com.', 'user@a.com']);
  });

  it('should update on every keystroke with onInput', async () => {
    await driver.find('#test3 input').doClear().sendKeys("app");
    assert.deepEqual(await getAllValues(), ['app', 'app', 'app']);
    await driver.find('#test3 input').sendKeys("le");
    assert.deepEqual(await getAllValues(), ['apple', 'apple', 'apple']);
    await driver.find('#test3 input').doClear();
    assert.deepEqual(await getAllValues(), ['', '', '']);
    await driver.find('#test3 input').sendKeys("x", Key.ENTER);
    assert.deepEqual(await getAllValues(), ['x', 'x', 'x']);
  });
});
