import {assert, driver, useServer} from '../tools/webdriver-mocha';
import {server} from '../tools/webpack-test-server';

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
    assert.equal(await driver.find('#test_array select').getAttribute('value'), 'apple');
    assert.equal(await driver.find('#test_value').getAttribute('value'), 'apple');

    await driver.findContent('#test_main option', /papaya/).doClick();
    assert.equal(await driver.find('#test_main select').getAttribute('value'), 'papaya');
    assert.equal(await driver.find('#test_array select').getAttribute('value'), '');
    assert.equal(await driver.find('#test_value').getAttribute('value'), 'papaya');

    await driver.findContent('#test_array option', /cherry/).doClick();
    assert.equal(await driver.find('#test_main select').getAttribute('value'), 'Select a fruit:');
    assert.equal(await driver.find('#test_array select').getAttribute('value'), 'cherry');
    assert.equal(await driver.find('#test_value').getAttribute('value'), 'cherry');
  });

  it('should update UI when observable changes', async () => {
    await driver.find('#test_value').doClear().doSendKeys('foo');
    assert.equal(await driver.find('#test_main select').getAttribute('value'), 'Select a fruit:');
    assert.equal(await driver.find('#test_array select').getAttribute('value'), '');

    await driver.find('#test_value').doClear().doSendKeys('orange');
    assert.equal(await driver.find('#test_main select').getAttribute('value'), 'orange');
    assert.equal(await driver.find('#test_array select').getAttribute('value'), 'orange');

    await driver.find('#test_value').doClear().doSendKeys('cherry');
    assert.equal(await driver.find('#test_main select').getAttribute('value'), 'Select a fruit:');
    assert.equal(await driver.find('#test_array select').getAttribute('value'), 'cherry');
  });

  it('should support non-string values', async () => {
    assert.equal(await driver.find('#test_num_value').getAttribute('value'), '3.9');
    assert.equal(await driver.find('#test_num_type').getText(), 'number');
    assert.equal(await driver.find('#test_num select').getAttribute('value'), "C3");

    await driver.findContent('#test_num option', /^A/).click();
    assert.equal(await driver.find('#test_num_value').getAttribute('value'), '1.5');
    assert.equal(await driver.find('#test_num_type').getText(), 'number');
    assert.equal(await driver.find('#test_num select').getAttribute('value'), "A1");

    await driver.find('#test_num_value').doClear().doSendKeys("45");
    assert.equal(await driver.find('#test_num select').getAttribute('value'), "");
    assert.equal(await driver.find('#test_num_value').getAttribute('value'), '45');
    assert.equal(await driver.find('#test_num_type').getText(), 'number');

    await driver.find('#test_num_value').doClear().doSendKeys("3.9");
    assert.equal(await driver.find('#test_num select').getAttribute('value'), "C3");
    assert.equal(await driver.find('#test_num_type').getText(), 'number');
  });
});
