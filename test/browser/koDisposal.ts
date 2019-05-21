import {assert, driver, useServer} from 'mocha-webdriver';
import {server} from '../tools/webpack-test-server';

describe('koDisposal', () => {
  useServer(server);

  before(async function() {
    this.timeout(20000);      // Set a longer default timeout.
    await driver.get(`${server.getHost()}/koDisposal`);
  });

  beforeEach(async () => {
    await driver.find('.test-clear-log').click();
    assert.equal(await driver.find('.test-log').getText(), '');
  });

  const expectedLog = [
    'ga',
    'ga_gb',
    'ga_gb_gc',
    'ga_gb_gc_kd',
    'ga_gb_kc',
    'ga_gb_kc_gd',
    'kcomment',
    'gcomment',
    'ka',
    'ka_kb',
    'ka_kb_kc',
    'ka_kb_kc_gd',
    'ka_kb_gc',
    'ka_kb_gc_kd',
  ];

  async function getLog(): Promise<string[]> {
    return (await driver.find('.test-log').getText()).split(/\n/);
  }

  it('should dispose all elements using knockout removeNode', async () => {
    await driver.find('.test-ko-dispose').click();
    assert.deepEqual(await getLog(), expectedLog);
    assert.equal(await driver.find('.test-ko-node-count').getText(), '21');
    assert.equal(await driver.find('.test-grain-node-count').getText(), '21');

    // Text nodes are treated differently by grainjs and knockout traversal. So let's only assert
    // that we don't have too many.
    assert.isAtMost(parseFloat(await driver.find('.test-grain-text-count').getText()), 21);
  });

  it('should dispose all elements using grainjs domDispose', async () => {
    await driver.find('.test-grain-dispose').click();
    // Disposal happens in a different order with grainjs disposal, because (a) all knockout
    // disposers get run together by knockout (no hook to run them individually), and (b) grainjs
    // disposes children before parents. The order hasn't mattered yet for any practical purposes.
    assert.sameMembers(await getLog(), expectedLog);
    assert.equal(await driver.find('.test-ko-node-count').getText(), '21');
    assert.equal(await driver.find('.test-grain-node-count').getText(), '21');

    // Text nodes are treated differently by grainjs and knockout traversal. So let's only assert
    // that we don't have too many.
    assert.isAtMost(parseFloat(await driver.find('.test-grain-text-count').getText()), 21);
  });
});
