/**
 * Test types using tsd. See README in this directory.
 */
import { expectType, expectError } from 'tsd';
import { observable } from '../../lib/observable';
import { dom, DomComputed } from '../../lib/dom';

const obs = observable<string>("test");
expectType<DomComputed>(dom.domComputed(obs, (val: string) => val.toUpperCase()));
expectType<DomComputed>(dom.domComputed(obs, (val) => val.toUpperCase()));
expectError(dom.domComputed(obs, (val: number) => val.toString()));
expectType<DomComputed>(dom.domComputed((use) => 1, (val: number) => '' + val));
expectError(dom.domComputed((use) => 1));
expectType<DomComputed>(dom.domComputed((use) => use(obs).toUpperCase()));
expectType<DomComputed>(dom.domComputed((use) => dom('div')));

// Check that dom.maybe passes non-null types to its callback.
interface Foo {
  str: string;
  nstr: string|null;
  ustr?: string|Element;
  foo?: Foo;
  fstr: string|Foo|null|undefined;
}
const foo: Foo = null as any;
dom.maybe(foo.str, (val) => expectType<string>(val));
dom.maybe(foo.nstr, (val) => expectType<string>(val));
dom.maybe(foo.ustr, (val) => expectType<string | Element>(val));
dom.maybe(foo.foo, (val) => { expectType<Foo>(val); return null; });
dom.maybe(foo.fstr, (val) => {
  expectType<string|Foo>(val);
  return null;
});
dom.domComputed(foo.nstr, (val) =>              // Unlike maybe(), domComputed() passes type as is
  expectType<string|null>(val));
dom.domComputed(foo.ustr, (val) =>              // Unlike maybe(), domComputed() passes type as is
  expectType<string|Element|undefined>(val));
