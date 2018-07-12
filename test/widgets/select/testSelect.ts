import {server} from '../test-server';
import {assert, driver, useServer} from '../webdriver-mocha';

describe('select', () => {
  useServer(server);

  before(async function() {
    this.timeout(20000);      // Set a longer default timeout.
    await driver.get(`${server.getHost()}/select/fixture.html`);
  });

  it('should find element', async () => {
    // TODO READ RECOMMENDATIONS AT
    // https://wiki.saucelabs.com/display/DOCS/Best+Practices+for+Running+Tests
    assert.equal(await driver.find('#test_select select').getAttribute('value'), 'apple');
    assert.equal(await driver.find('#test_value').getAttribute('value'), 'apple');
    await driver.findContent('#test_select option', /papaya/).click();
    assert.equal(await driver.find('#test_select select').getAttribute('value'), 'papaya');
    assert.equal(await driver.find('#test_value').getAttribute('value'), 'papaya');
  });
});
