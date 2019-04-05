import { observable } from '../../lib/observable';
import { dom } from '../../lib/dom';

const obs = observable<string>("test");
dom.domComputed(obs, (val: string) => val.toUpperCase()); // $ExpectType [Node, Node, DomMethod]
dom.domComputed(obs, (val) => val.toUpperCase());         // $ExpectType [Node, Node, DomMethod]
dom.domComputed(obs, (val: number) => val.toString());    // $ExpectError
dom.domComputed((use) => 1, (val: number) => '' + val);   // $ExpectType [Node, Node, DomMethod]
dom.domComputed((use) => 1);                              // $ExpectError
dom.domComputed((use) => use(obs).toUpperCase());         // $ExpectType [Node, Node, DomMethod]
dom.domComputed((use) => dom('div'));                     // $ExpectType [Node, Node, DomMethod]
