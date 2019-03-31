import {assert} from 'chai';
import * as sinon from 'sinon';
import {Disposable} from '../../lib/dispose';
import {dom} from '../../lib/dom';
import {useJsDomWindow} from './testutil2';

describe('domComponent', function() {
  class Comp extends Disposable {
    constructor(public a: number, public b: string, public c?: boolean) {
      super();
    }
    public buildDom() {
      return [
        dom('span', `a=${this.a}`),
        dom('span', `b=${this.b}`),
        dom('span', `c=${this.c}`),
      ];
    }
  }

  useJsDomWindow();

  it("should use content and call disposers correctly", function() {
    const spy = sinon.spy((a: any) => a);
    const elem = dom('div',
      dom.create(Comp, 17, "foo", true),
      dom.create(Comp, 17, "foo"),
      // The following should all cause typescript errors (this is tested in test/types/domComponent.ts)
      // dom.create(Comp),
      // dom.create(Comp, "foo", 17, true),
      // dom.create(Comp, 17, "foo", true, 5),
      dom.create((owner) => spy(Comp.create(owner, 5, "hello", false))),
    );
    assert.equal(elem.outerHTML,
      '<div>' +
      '<!--a--><span>a=17</span><span>b=foo</span><span>c=true</span><!--b-->' +
      '<!--a--><span>a=17</span><span>b=foo</span><span>c=undefined</span><!--b-->' +
      '<!--a--><span>a=5</span><span>b=hello</span><span>c=false</span><!--b-->' +
      '</div>');
    sinon.assert.calledOnce(spy);
    sinon.assert.calledWithMatch(spy, sinon.match.instanceOf(Comp));
  });
});
