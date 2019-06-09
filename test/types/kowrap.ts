import { BindableValue, Computed, fromKo, Observable, subscribe, subscribeBindable, toKo } from '../../index';
import * as ko from 'knockout';

const kObs = ko.observable("foo");
const gObs = Observable.create(null, "foo");

// Check that inference works for fromKo().
fromKo(kObs);                                 // $ExpectType Observable<string>

// Check that inference works for toKo().
toKo(ko, gObs);                               // $ExpectType IKnockoutObservable<string>

// Check that inference works for use() in a Computed callback.
Computed.create(null, (use) =>                // $ExpectType Computed<string>
  use(kObs));                                 // $ExpectType string
Computed.create(null, (use) =>                // $ExpectType Computed<string>
  use(gObs));                                 // $ExpectType string

// Check that inference works for use() in a subscribe callback.
subscribe((use) =>
  use(kObs));                                 // $ExpectType string
subscribe((use) =>
  use(gObs));                                 // $ExpectType string

// Check that inference from knockout types works for bindings.
subscribeBindable(kObs, (val) =>
  val);                                       // $ExpectType string

// Check that knockout typings don't interfere with other type inference for BindableValue.
const bindable: BindableValue<string> = kObs;
subscribeBindable(bindable, (val) =>
  val);                                       // $ExpectType string
subscribeBindable(gObs, (val) =>
  val);                                       // $ExpectType string
subscribeBindable((use) => {
  use;                                        // $ExpectType UseCBOwner
  return "foo";
}, (val) =>
  val);                                       // $ExpectType string
