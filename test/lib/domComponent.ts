import {assert} from 'chai';
import * as sinon from 'sinon';
import {dom} from '../../lib/dom';
import {useJsDomWindow} from './testutil2';

describe('domComponent', function() {
  class Comp extends dom.Component {
    constructor(public a: number, public b: string, public c?: boolean) {
      super();
      this.setContent(dom.frag(
        dom('span', `a=${a}`),
        dom('span', `b=${b}`),
        dom('span', `c=${c}`),
      ));
    }
  }

  useJsDomWindow();

  it("should use content and call disposers correctly", function() {
    const spy = sinon.spy();
    const elem = dom('div',
      dom.create(Comp, 17, "foo", true),
      dom.create(Comp, 17, "foo"),
      // The following should all cause typescript errors (this is tested in test/types/domComponent.ts)
      // dom.create(Comp),
      // dom.create(Comp, "foo", 17, true),
      // dom.create(Comp, 17, "foo", true, 5),
      dom.createInit(Comp, [5, "hello", false], spy),
    );
    assert.equal(elem.outerHTML,
      '<div>' +
      '<!--A--><span>a=17</span><span>b=foo</span><span>c=true</span><!--B-->' +
      '<!--A--><span>a=17</span><span>b=foo</span><span>c=undefined</span><!--B-->' +
      '<!--A--><span>a=5</span><span>b=hello</span><span>c=false</span><!--B-->' +
      '</div>');
    sinon.assert.calledOnce(spy);
    sinon.assert.calledWithMatch(spy, sinon.match.instanceOf(Comp));
  });
});
