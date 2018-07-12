import {server} from '../test-server';
import {assert, driver, useServer} from '../webdriver-mocha';

describe('select', () => {
  useServer(server);

  before(async function() {
    this.timeout(20000);      // Set a longer default timeout.
    await driver.get('http://localhost:9010/demo.html');
  });

  it('should find element', async () => {
    // TODO READ RECOMMENDATIONS AT
    // https://wiki.saucelabs.com/display/DOCS/Best+Practices+for+Running+Tests
    assert.equal(await driver.find('#test_select select').getAttribute('value'), 'apple');
    assert.equal(await driver.find('#test_value').getAttribute('value'), 'apple');
    // TODO: sendKeys does not seem a reliable way to select an option :(
    await driver.find('#test_select select').sendKeys('papaya');
    assert.equal(await driver.find('#test_select select').getAttribute('value'), 'papaya');
    assert.equal(await driver.find('#test_value').getAttribute('value'), 'papaya');
  });
});
