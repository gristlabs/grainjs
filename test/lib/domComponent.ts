import {assert} from 'chai';
import * as sinon from 'sinon';
import {bundleChanges, computed, Computed, Disposable} from '../../index';
import {dom, MultiHolder, observable} from '../../index';
import {assertResetSingleCall, useJsDomWindow} from './testutil2';

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

  it('should dispose components in case of other DOM errors', function() {
    const spies = [new SpySet(), new SpySet(), new SpySet(), new SpySet(), new SpySet(), new SpySet()];
    assert.throws(() => dom('div',
      dom.create(funcComp, 'Hello', spies[0]),
      dom.create(ClassComp, 'World', spies[1]),
      dom('span',
        dom.create(funcComp, 'Foo', spies[2]),
        dom.create(ClassComp, 'Bar', spies[3]),
        dom('p',
          dom.create(funcComp, 'Inner1', spies[4]),
          dom.create(ClassComp, 'Inner2', spies[5]),
        ),
        (elem: Element) => { throw new Error('fake-error'); },
      ),
    ), /fake-error/);

    // If construct/render are called, then so are dispose/domDispose.
    assert.equal(spies[0].getCalls(), 'Construct=0 Render=0 Dispose=0 DomDispose=0');
    assert.equal(spies[1].getCalls(), 'Construct=0 Render=0 Dispose=0 DomDispose=0');
    assert.equal(spies[2].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
    assert.equal(spies[3].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
    assert.equal(spies[4].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
    assert.equal(spies[5].getCalls(), 'Construct=1 Render=1 Dispose=1 DomDispose=1');
  });

  function joinFirstArgs(spy: sinon.SinonSpy) {
    return spy.args.map((a) => a[0]).join(",");
  }

  it('should allow return of domComputed even within a domComputed', function() {
    class MySpySet {
      public a = sinon.spy((a: any) => a);    // Creation/evaluation
      public b = sinon.spy((a: any) => a);    // Dom disposal
      public r = sinon.spy((a: any) => a);    // dom Render

      public describeReset(): string {
        const val = `-[${joinFirstArgs(this.b)}] +[${joinFirstArgs(this.a)}] R[${joinFirstArgs(this.r)}]`;
        this.a.resetHistory();
        this.b.resetHistory();
        this.r.resetHistory();
        return val;
      }
    }
    const spies1 = new MySpySet();
    const spies2 = new MySpySet();
    const spies3 = new MySpySet();
    const spies4 = new MySpySet();

    const obsOuter = observable("foo");
    const obsInner = observable("hello");
    const elem = dom('div',
      // Here domComputed returns components, to ensure that cleanup happens.
      dom.domComputed(obsOuter, (outer) => [
        // (1) CORRECT USAGE: domComputed inside domComputed, no components.
        dom.domComputed((use) => spies1.a(use(obsInner) + '1' + outer), (val) =>
          dom('div', spies1.r(val), dom.onDispose(() => spies1.b(val))),
        ),

        // (2) CORRECT USAGE: component returns domComputed, nothing to take ownership of.
        dom.create(() => dom.domComputed((use) => spies2.a(use(obsInner) + '2' + outer), (val) =>
          dom('div', spies2.r(val), dom.onDispose(() => spies2.b(val))),
        )),

        // (3) INCORRECT USAGE: component creates a Computed but doesn't take ownership of it.
        dom.create((owner) => {
          const merged = computed(obsInner, (use, val) => spies3.a(val + '3' + outer));
          return dom.domComputed(merged, (val) =>
            dom('div', spies3.r(val), dom.onDispose(() => spies3.b(val))));
        }),

        // (4) CORRECT USAGE: component creates a Computed and takes ownership of it.
        dom.create((owner) => {
          const merged = Computed.create(owner, obsInner, (use, val) => spies4.a(val + '4' + outer));
          return dom.domComputed(merged, (val) =>
            dom('div', spies4.r(val), dom.onDispose(() => spies4.b(val))));
        }),
      ]),
    );

    assert.equal(elem.outerHTML, '<div><!--a-->' +
              '<!--a--><div>hello1foo</div><!--b-->' +
      '<!--a--><!--a--><div>hello2foo</div><!--b--><!--b-->' +
      '<!--a--><!--a--><div>hello3foo</div><!--b--><!--b-->' +
      '<!--a--><!--a--><div>hello4foo</div><!--b--><!--b-->' +
      '<!--b--></div>');

    assert.equal(spies1.describeReset(), '-[] +[hello1foo] R[hello1foo]');
    assert.equal(spies2.describeReset(), '-[] +[hello2foo] R[hello2foo]');
    assert.equal(spies3.describeReset(), '-[] +[hello3foo] R[hello3foo]');
    assert.equal(spies4.describeReset(), '-[] +[hello4foo] R[hello4foo]');

    obsOuter.set('FOO');
    assert.equal(elem.outerHTML, '<div><!--a-->' +
              '<!--a--><div>hello1FOO</div><!--b-->' +
      '<!--a--><!--a--><div>hello2FOO</div><!--b--><!--b-->' +
      '<!--a--><!--a--><div>hello3FOO</div><!--b--><!--b-->' +
      '<!--a--><!--a--><div>hello4FOO</div><!--b--><!--b-->' +
      '<!--b--></div>');

    assert.equal(spies1.describeReset(), '-[hello1foo] +[hello1FOO] R[hello1FOO]');
    assert.equal(spies2.describeReset(), '-[hello2foo] +[hello2FOO] R[hello2FOO]');
    assert.equal(spies3.describeReset(), '-[hello3foo] +[hello3FOO] R[hello3FOO]');
    assert.equal(spies4.describeReset(), '-[hello4foo] +[hello4FOO] R[hello4FOO]');

    obsInner.set('world');
    assert.equal(elem.outerHTML, '<div><!--a-->' +
              '<!--a--><div>world1FOO</div><!--b-->' +
      '<!--a--><!--a--><div>world2FOO</div><!--b--><!--b-->' +
      '<!--a--><!--a--><div>world3FOO</div><!--b--><!--b-->' +
      '<!--a--><!--a--><div>world4FOO</div><!--b--><!--b-->' +
      '<!--b--></div>');

    // Note the problem with incorrect usage (3): stale computed getting evaluated.
    assert.equal(spies1.describeReset(), '-[hello1FOO] +[world1FOO] R[world1FOO]');
    assert.equal(spies2.describeReset(), '-[hello2FOO] +[world2FOO] R[world2FOO]');
    assert.equal(spies3.describeReset(), '-[hello3FOO] +[world3foo,world3FOO] R[world3FOO]');
    assert.equal(spies4.describeReset(), '-[hello4FOO] +[world4FOO] R[world4FOO]');

    bundleChanges(() => {
      obsOuter.set('baz');
      obsInner.set('Hola!');
    });
    assert.equal(elem.outerHTML, '<div><!--a-->' +
              '<!--a--><div>Hola!1baz</div><!--b-->' +
      '<!--a--><!--a--><div>Hola!2baz</div><!--b--><!--b-->' +
      '<!--a--><!--a--><div>Hola!3baz</div><!--b--><!--b-->' +
      '<!--a--><!--a--><div>Hola!4baz</div><!--b--><!--b-->' +
      '<!--b--></div>');

    assert.equal(spies1.describeReset(), '-[world1FOO] +[Hola!1baz] R[Hola!1baz]');
    assert.equal(spies2.describeReset(), '-[world2FOO] +[Hola!2baz] R[Hola!2baz]');
    assert.equal(spies3.describeReset(), '-[world3FOO] +[Hola!3baz,Hola!3foo,Hola!3FOO] R[Hola!3baz]');
    assert.equal(spies4.describeReset(), '-[world4FOO] +[Hola!4baz] R[Hola!4baz]');

    obsInner.set('xxx');
    assert.equal(elem.outerHTML, '<div><!--a-->' +
              '<!--a--><div>xxx1baz</div><!--b-->' +
      '<!--a--><!--a--><div>xxx2baz</div><!--b--><!--b-->' +
      '<!--a--><!--a--><div>xxx3baz</div><!--b--><!--b-->' +
      '<!--a--><!--a--><div>xxx4baz</div><!--b--><!--b-->' +
      '<!--b--></div>');
    assert.equal(spies1.describeReset(), '-[Hola!1baz] +[xxx1baz] R[xxx1baz]');
    assert.equal(spies2.describeReset(), '-[Hola!2baz] +[xxx2baz] R[xxx2baz]');
    assert.equal(spies3.describeReset(), '-[Hola!3baz] +[xxx3foo,xxx3FOO,xxx3baz] R[xxx3baz]');
    assert.equal(spies4.describeReset(), '-[Hola!4baz] +[xxx4baz] R[xxx4baz]');
  });

  it('should allow return of array, including domComputed', function() {
    const obs = observable("foo-");
    const spy = sinon.spy((a: any) => a);
    const elem = dom('div',
      dom.create((owner) => {
        const comp = Computed.create(owner, (use) => spy(use(obs) + "x"));
        return ['before', dom.domComputed(comp), ":", dom.domComputed((use) => use(comp).toUpperCase()), 'after'];
      }),
    );

    // Check that DOM is correct and spy was called once.
    assert.equal(elem.outerHTML, '<div><!--a-->' +
      'before<!--a-->foo-x<!--b-->:<!--a-->FOO-X<!--b-->after' +
      '<!--b--></div>');
    assertResetSingleCall(spy, undefined, "foo-x");

    // Update the observable we care about, and check that everything is updated.
    obs.set("bar-");
    assert.equal(elem.outerHTML, '<div><!--a-->' +
      'before<!--a-->bar-x<!--b-->:<!--a-->BAR-X<!--b-->after' +
      '<!--b--></div>');
    assertResetSingleCall(spy, undefined, "bar-x");

    // After disposing the element, updating observable should NOT call spy to get called.
    dom.domDispose(elem);
    obs.set("baz-");
    sinon.assert.notCalled(spy);
  });
});
