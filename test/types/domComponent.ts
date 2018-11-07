import { dom } from '../../lib/dom';

class MyComp extends dom.Component {
  constructor(public a: number, public b: string, public c?: boolean) { super(); }
}

// Test that valid args are accepted.
dom.create(MyComp, 1, "hello", true);   // $ExpectType DomElementMethod
dom.create(MyComp, 1, "hello");         // $ExpectType DomElementMethod

// Test that invalid args are rejected with informative errors.
dom.create(MyComp, 1, "hello", 2);        // $ExpectError
dom.create(MyComp, "test", 1);            // $ExpectError
dom.create(MyComp, 1);                    // $ExpectError
dom.create(MyComp);                       // $ExpectError

// Test that createInit() is strict and expects a correct callback.
dom.createInit(MyComp, [1, "hello", true], (
  comp,     // $ExpectType MyComp
) => {});

dom.createInit(MyComp, [1, "hello"], (
  comp,     // $ExpectType MyComp
) => {});

// Wrong type in callback.
dom.createInit(MyComp, [1, "hello", true], (comp: number) => {}); // $ExpectError

// Wrong third argument in tuple.
dom.createInit(MyComp, [1, "hello", 2], (comp: any) => {});       // $ExpectError
