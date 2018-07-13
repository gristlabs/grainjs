import {server} from '../test-server';
import {assert, driver, useServer} from '../webdriver-mocha';

// TODO READ HELPFUL RECOMMENDATIONS AT:
// https://wiki.saucelabs.com/display/DOCS/Best+Practices+for+Running+Tests

describe('select', () => {
  useServer(server);

  before(async function() {
    this.timeout(20000);      // Set a longer default timeout.
    await driver.get(`${server.getHost()}/select/fixture.html`);
  });

  it('should update observable when value is selected', async () => {
    assert.equal(await driver.find('#test_main select').getAttribute('value'), 'apple');
    assert.equal(await driver.find('#test_value').getAttribute('value'), 'apple');
    await driver.findContent('#test_main option', /papaya/).click();
    assert.equal(await driver.find('#test_main select').getAttribute('value'), 'papaya');
    assert.equal(await driver.find('#test_value').getAttribute('value'), 'papaya');
  });

  it.only('should update UI when observable changes', async () => {
    await driver.find('#test_value').doClear().sendKeys('foo');
    assert.equal(await driver.find('#test_main select').getAttribute('value'), 'Select a fruit:');
    assert.equal(await driver.find('#test_array select').getAttribute('value'), '');
    await driver.find('#test_value').sendKeys('orange');
    assert.equal(await driver.find('#test_value').getAttribute('value'), 'orange');
    assert.equal(await driver.find('#test_array select').getAttribute('value'), 'orange');
    await driver.find('#test_value').sendKeys('cherry');
    assert.equal(await driver.find('#test_value').getAttribute('value'), 'Select a fruit:');
    assert.equal(await driver.find('#test_array select').getAttribute('value'), 'cherry');
  });

  it('should support non-string values', async () => {
    assert.equal(await driver.find('#test_rich_value').getText(), '{"a": 1}');
    await driver.findContent('#test_rich_values options', /^C/).click();
    assert.equal(await driver.find('#test_rich_value').getText(), '{"c": 0}');
  });
});
