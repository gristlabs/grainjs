/**
 * Test types using tsd. See README in this directory.
 */
import { expectType } from 'tsd';
import { BindableValue, Computed, fromKo, Observable, subscribe, subscribeBindable } from '../../index';
import { IKnockoutObservable, toKo, UseCBOwner } from '../../index';
import * as ko from 'knockout';

const kObs = ko.observable("foo");
const gObs = Observable.create(null, "foo");

// Check that inference works for fromKo().
expectType<Observable<string>>(fromKo(kObs));

// Check that inference works for toKo().
expectType<IKnockoutObservable<string>>(toKo(ko, gObs));

// Check that inference works for use() in a Computed callback.
expectType<Computed<string>>(Computed.create(null, (use) => use(kObs)));
expectType<Computed<string>>(Computed.create(null, (use) => use(gObs)));

// Check that inference works for use() in a subscribe callback.
subscribe((use) =>
  expectType<string>(use(kObs)));
subscribe((use) =>
  expectType<string>(use(gObs)));

// Check that inference from knockout types works for bindings.
subscribeBindable(kObs, (val) =>
  expectType<string>(val));

// Check that knockout typings don't interfere with other type inference for BindableValue.
const bindable: BindableValue<string> = kObs;
subscribeBindable(bindable, (val) => expectType<string>(val));
subscribeBindable(gObs, (val) => expectType<string>(val));
subscribeBindable((use) => {
  expectType<UseCBOwner>(use);
  return "foo";
}, (val) => {
  expectType<string>(val)
});
