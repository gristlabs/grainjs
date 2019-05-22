import { observable } from '../../lib/observable';
import { dom } from '../../lib/dom';

const obs = observable<string>("test");
dom.domComputed(obs, (val: string) => val.toUpperCase()); // $ExpectType [Node, Node, DomMethod<Node>]
dom.domComputed(obs, (val) => val.toUpperCase());         // $ExpectType [Node, Node, DomMethod<Node>]
dom.domComputed(obs, (val: number) => val.toString());    // $ExpectError
dom.domComputed((use) => 1, (val: number) => '' + val);   // $ExpectType [Node, Node, DomMethod<Node>]
dom.domComputed((use) => 1);                              // $ExpectError
dom.domComputed((use) => use(obs).toUpperCase());         // $ExpectType [Node, Node, DomMethod<Node>]
dom.domComputed((use) => dom('div'));                     // $ExpectType [Node, Node, DomMethod<Node>]

// Check that dom.maybe passes non-null types to its callback.
interface Foo {
  str: string;
  nstr: string|null;
  ustr?: string|Element;
  foo?: Foo;
  fstr: string|Foo|null|undefined;
}
const foo: Foo = null as any;
dom.maybe(foo.str, (val) =>
  val);       // $ExpectType string
dom.maybe(foo.nstr, (val) =>
  val);       // $ExpectType string
dom.maybe(foo.ustr, (val) =>
  val);       // $ExpectType string | Element
dom.maybe(foo.foo, (val) => {
  val;        // $ExpectType Foo
  return null;
});
dom.maybe(foo.fstr, (val) => {
  val;        // $ExpectType string | Foo
  return null;
});
dom.domComputed(foo.nstr, (val) =>              // Unlike maybe(), domComputed() passes type as is
  val);       // $ExpectType string | null
dom.domComputed(foo.ustr, (val) =>              // Unlike maybe(), domComputed() passes type as is
  val);       // $ExpectType string | Element | undefined
