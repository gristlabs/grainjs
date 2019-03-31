import {assert} from 'chai';
import * as sinon from 'sinon';
import {Disposable, MultiHolder} from '../../lib/dispose';
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

  it("should do type-checking and support array return values", function() {
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

  class SpySet {
    public onConstruct = sinon.spy();
    public onDispose = sinon.spy();
    public onRender = sinon.spy();
    public onDomDispose = sinon.spy();

    public getCalls(): string {
      return (`Construct=${this.onConstruct.callCount} ` +
        `Render=${this.onRender.callCount} ` +
        `Dispose=${this.onDispose.callCount} ` +
        `DomDispose=${this.onDomDispose.callCount}`);
    }
  }

  function funcComp(owner: MultiHolder, text: string, spySet: SpySet) {
    spySet.onConstruct(text);
    owner.onDispose(() => spySet.onDispose(text));
    return dom('ul', (elem: Node) => spySet.onRender(text),
      text, dom.onDispose(() => spySet.onDomDispose(text)));
  }

  class ClassComp extends Disposable {
    constructor(public text: string, public spySet: SpySet) {
      super();
      spySet.onConstruct(text);
      this.onDispose(() => spySet.onDispose(text));
    }
    public buildDom() {
      this.spySet.onRender(this.text);
      return dom('ol', this.text, dom.onDispose(() => this.spySet.onDomDispose(this.text)));
    }
  }

  it("should support function and class-based components", function() {
    const spies = [new SpySet(), new SpySet(), new SpySet()];
    const elem = dom('div',
      dom.create(funcComp, 'Hello', spies[0]),
      dom.create(ClassComp, 'World', spies[1]),
      dom.create((owner) => ClassComp.create(owner, 'Again', spies[2])),
    );
    assert.equal(elem.outerHTML, '<div>' +
      '<!--a--><ul>Hello</ul><!--b-->' +
      '<!--a--><ol>World</ol><!--b-->' +
      '<!--a--><ol>Again</ol><!--b-->' +
      '</div>');
    assert.equal(spies[0].getCalls(), 'Construct=1 Render=1 Dispose=0 DomDispose=0');
    assert.equal(spies[1].getCalls(), 'Construct=1 Render=1 Dispose=0 DomDispose=0');
    assert.equal(spies[2].getCalls(), 'Construct=1 Render=1 Dispose=0 DomDispose=0');

    dom.domDispose(elem);
    assert.equal(spies[0].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
    assert.equal(spies[1].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
    assert.equal(spies[2].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
  });

  it('should dispose components in case of a later construct error', function() {
    const spies = [new SpySet(), new SpySet(), new SpySet(), new SpySet(), new SpySet()];
    spies[3].onConstruct = sinon.stub().callsFake(() => { throw new Error('fake-error'); });
    assert.throws(() => dom('div',
      dom.create(funcComp, 'Hello', spies[0]),
      dom.create(ClassComp, 'World', spies[1]),
      dom.create((owner) => ClassComp.create(owner, 'Again', spies[2])),
      dom.create(ClassComp, 'Boom', spies[3]),
      dom.create(funcComp, 'Never', spies[4]),
    ), /fake-error/);

    assert.equal(spies[0].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
    assert.equal(spies[1].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
    assert.equal(spies[2].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
    assert.equal(spies[3].getCalls(), 'Construct=1 Render=0 Dispose=0 DomDispose=0');
    assert.equal(spies[4].getCalls(), 'Construct=0 Render=0 Dispose=0 DomDispose=0');
  });

  it('should dispose components in case of a later render error', function() {
    const spies = [new SpySet(), new SpySet(), new SpySet(), new SpySet(), new SpySet()];
    spies[3].onRender = sinon.stub().callsFake(() => { throw new Error('fake-error'); });
    assert.throws(() => dom('div',
      dom.create(funcComp, 'Hello', spies[0]),
      dom.create(ClassComp, 'World', spies[1]),
      dom.create((owner) => ClassComp.create(owner, 'Again', spies[2])),
      dom.create(ClassComp, 'Boom', spies[3]),
      dom.create(funcComp, 'Never', spies[4]),
    ), /fake-error/);

    assert.equal(spies[0].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
    assert.equal(spies[1].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
    assert.equal(spies[2].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
    assert.equal(spies[3].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=0');
    assert.equal(spies[4].getCalls(), 'Construct=0 Render=0 Dispose=0 DomDispose=0');
  });

  it('non-example from documentation', function() {
    const spies = [new SpySet(), new SpySet()];
    spies[1].onRender = sinon.stub().callsFake(() => { throw new Error('fake-error'); });
    assert.throws(() => dom('div',
      dom.create(() => new ClassComp('Non-example', spies[0])),
      dom.create(ClassComp, 'World', spies[1]),
    ), /fake-error/);

    // The lack of Dispose call of Non-example is the problem this is illustrating.
    assert.equal(spies[0].getCalls(), 'Construct=1 Render=1 Dispose=0 DomDispose=1');
    assert.equal(spies[1].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=0');
  });

  it('should dispose componnets in case of other DOM errors', function() {
    const spies = [new SpySet(), new SpySet(), new SpySet(), new SpySet()];
    assert.throws(() => dom('div',
      dom.create(funcComp, 'Hello', spies[0]),
      dom.create(ClassComp, 'World', spies[1]),
      dom('span',
        dom.create(funcComp, 'Foo', spies[2]),
        dom.create(ClassComp, 'Bar', spies[3]),
        (elem: Element) => { throw new Error('fake-error'); },
      ),
    ), /fake-error/);

    // If construct/render are called, then so are dispose/domDispose.
    assert.equal(spies[0].getCalls(), 'Construct=0 Render=0 Dispose=0 DomDispose=0');
    assert.equal(spies[1].getCalls(), 'Construct=0 Render=0 Dispose=0 DomDispose=0');
    assert.equal(spies[2].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
    assert.equal(spies[3].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
  });
});
