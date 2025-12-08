# API Reference
## attr
```ts
attr(attrName: string, attrValueObs: BindableValue<string | null | undefined>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets an attribute of a DOM element to the given value. Removes the attribute when the value is null or undefined.

::: info Example

```ts
dom('a', dom.attr('href', urlObs))
```


:::

## attrElem
```ts
attrElem(elem: Element, attrName: string, attrValue: string | null | undefined): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets an attribute of a DOM element to the given value. Removes the attribute when the value is null or undefined. The `attr()` variant takes no `elem` argument, and `attrValue` may be an observable or function.


<table><thead>
<tr><th>Parameter</th><th>Description</th></tr>
</thead>
<tbody>
<tr><td><code>elem</code></td><td>The element to update.
</td></tr>
<tr><td><code>attrName</code></td><td>The name of the attribute to bind, e.g. 'href'.
</td></tr>
<tr><td><code>attrValue</code></td><td>The string value, or null or undefined to remove the attribute.
</td></tr>
</tbody></table>

## attrs
```ts
attrs(attrsObj: IAttrObj): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## attrsElem
```ts
attrsElem(elem: Element, attrsObj: IAttrObj): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets multiple attributes of a DOM element. The `attrs()` variant takes no `elem` argument. Null and undefined values are omitted, and booleans are either omitted or set to empty string.


<table><thead>
<tr><th>Parameter</th><th>Description</th></tr>
</thead>
<tbody>
<tr><td><code>attrsObj</code></td><td>Object mapping attribute names to attribute values.
</td></tr>
</tbody></table>

## autoDispose
```ts
autoDispose(disposable: IDisposable | null): ((elem: Node) => void) | undefined;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

## autoDisposeElem
```ts
autoDisposeElem(elem: Node, disposable: IDisposable | null): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

## BaseObservable
```ts
class BaseObservable<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

## BindableValue
```ts
type BindableValue<T> = BaseObservable<T> | ComputedCallback<T> | T | IKnockoutReadObservable<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/binding.ts" target="_blank">Defined in binding.ts</a></div>

## bindB
```ts
bindB<R>(func: (...args: any[]) => R, b: any[]): () => R;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/util.ts" target="_blank">Defined in util.ts</a></div>

## bindBU
```ts
bindBU<R>(func: (...args: any[]) => R, b: any[]): (arg: any) => R;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/util.ts" target="_blank">Defined in util.ts</a></div>

## bindUB
```ts
bindUB<U, R>(func: (arg: U, ...args: any[]) => R, b: any[]): (arg: U) => R;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/util.ts" target="_blank">Defined in util.ts</a></div>

## boolAttr
```ts
boolAttr(attrName: string, boolValueObs: BindableValue<boolean>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## boolAttrElem
```ts
boolAttrElem(elem: Element, attrName: string, boolValue: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## bundleChanges
```ts
bundleChanges<T>(func: () => T): T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/_computed_queue.ts" target="_blank">Defined in _computed_queue.ts</a></div>

## ChangeCB
```ts
type ChangeCB = (hasListeners: boolean) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

## cls
```ts
cls(className: string, boolValue?: BindableValue<boolean>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## cls
```ts
cls(className: BindableValue<string>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## clsElem
```ts
clsElem(elem: Element, className: string, boolValue?: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## clsPrefix
```ts
clsPrefix(prefix: string, className: string, boolValue?: BindableValue<boolean>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## clsPrefix
```ts
clsPrefix(prefix: string, className: BindableValue<string>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## Computed
```ts
class Computed<T> extends Observable<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

## computed
```ts
computed<T>(cb: (use: UseCB) => T): Computed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

## computed
```ts
computed<T, A>(a: Obs<A>, cb: (use: UseCB, a: A) => T): Computed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

## computed
```ts
computed<T, A, B>(a: Obs<A>, b: Obs<B>, cb: (use: UseCB, a: A, b: B) => T): Computed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

## computed
```ts
computed<T, A, B, C>(a: Obs<A>, b: Obs<B>, c: Obs<C>, cb: (use: UseCB, a: A, b: B, c: C) => T): Computed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

## computed
```ts
computed<T, A, B, C, D>(a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, cb: (use: UseCB, a: A, b: B, c: C, d: D) => T): Computed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

## computed
```ts
computed<T, A, B, C, D, E>(a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, e: Obs<E>, cb: (use: UseCB, a: A, b: B, c: C, d: D, e: E) => T): Computed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

## ComputedArray
```ts
class ComputedArray<T, U> extends ObsArray<U>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

## computedArray
```ts
computedArray<T, U>(obsArr: BaseObservable<T[]> | Observable<BaseObservable<T[]>>, mapper: (item: T, index: number, arr: ComputedArray<T, U>) => U): ObsArray<U>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

## ComputedCallback
```ts
type ComputedCallback<T> = (use: UseCBOwner, ...args: any[]) => T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/binding.ts" target="_blank">Defined in binding.ts</a></div>

## create
```ts
create<Fn extends IDomCreator<any[]>>(fn: Fn, ...args: DomCreatorArgs<Fn>): DomContents;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

## data
```ts
data(key: string, valueObs: BindableValue<any>): DomMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## dataElem
```ts
dataElem(elem: Node, key: string, value: any): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## Disposable
```ts
abstract class Disposable implements IDisposable, IDisposableOwner
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

## dom
```ts
dom<Tag extends TagName>(tagString: Tag, ...args: IDomArgs<TagElem<Tag>>): TagElem<Tag>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dom.ts" target="_blank">Defined in dom.ts</a></div>

## dom
```ts
namespace dom
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dom.ts" target="_blank">Defined in dom.ts</a></div>

## DomArg
```ts
type DomArg<T = Node> = Node | string | void | null | undefined | IDomArgs<T> | DomMethod<T> | (T extends Element ? IAttrObj : never);
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## DomComponentReturn
```ts
type DomComponentReturn = DomContents | IDomComponent;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

## domComputed
```ts
domComputed(valueObs: BindableValue<Exclude<DomArg, DomMethod>>): DomComputed;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

## domComputed
```ts
domComputed<T>(valueObs: BindableValue<T>, contentFunc: (val: T) => DomContents): DomComputed;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

## DomComputed
```ts
type DomComputed = [Node, Node, DomMethod];
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

## domComputedOwned
```ts
domComputedOwned<T>(valueObs: BindableValue<T>, contentFunc: (owner: MultiHolder, val: T) => DomContents): DomComputed;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

## DomContents
```ts
type DomContents = Node | string | DomComputed | void | null | undefined | IDomContentsArray;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

## DomCreateFunc
```ts
type DomCreateFunc<R, Args extends IDomArgs<R> = IDomArgs<R>> = (...args: Args) => R;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/styled.ts" target="_blank">Defined in styled.ts</a></div>

## domDispose
```ts
domDispose(node: Node): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

## domDisposeHooks
```ts
domDisposeHooks: IDomDisposeHooks
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

## DomElementArg
```ts
type DomElementArg = DomArg<HTMLElement>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## DomElementMethod
```ts
type DomElementMethod = DomMethod<HTMLElement>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## DomMethod
```ts
type DomMethod<T = Node> = (elem: T) => DomArg<T> | void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## Emitter
```ts
class Emitter extends LLink
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

## EventCB
```ts
type EventCB<E extends Event = Event, T extends EventTarget = EventTarget> = (this: void, event: E, elem: T) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

## EventName
```ts
type EventName = keyof HTMLElementEventMap;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

## EventType
```ts
type EventType<E extends EventName | string> = E extends EventName ? HTMLElementEventMap[E] : Event;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

## find
```ts
find(selector: string): Element | null;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## findAll
```ts
findAll(selector: string): NodeListOf<Element>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## forEach
```ts
forEach<T>(obsArray: MaybeObsArray<T>, itemCreateFunc: (item: T) => Node | null): DomContents;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domForEach.ts" target="_blank">Defined in domForEach.ts</a></div>

## frag
```ts
frag(...args: IDomArgs<DocumentFragment>): DocumentFragment;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## fromKo
```ts
fromKo<KObs extends IKnockoutObservable<any>>(koObs: KObs): Observable<InferKoType<KObs>>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

## getData
```ts
getData(elem: Node, key: string): any;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## hide
```ts
hide(boolValueObs: BindableValue<boolean>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## hideElem
```ts
hideElem(elem: HTMLElement, boolValue: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## Holder
```ts
class Holder<T extends IDisposable> implements IDisposable, IDisposableOwner
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

## IAttrObj
```ts
interface IAttrObj
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## IClsName
```ts
interface IClsName
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/styled.ts" target="_blank">Defined in styled.ts</a></div>

## IDisposable
```ts
interface IDisposable
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

## IDisposableCtor
```ts
interface IDisposableCtor<Derived, CtorArgs extends any[]>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

## IDisposableOwner
```ts
interface IDisposableOwner
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

## IDisposableOwnerT
```ts
interface IDisposableOwnerT<T extends IDisposable>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

## IDomArgs
```ts
interface IDomArgs<T = Node> extends Array<DomArg<T>>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## IDomComponent
```ts
interface IDomComponent
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

## IDomContentsArray
```ts
interface IDomContentsArray extends Array<DomContents>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

## IDomCreateClass
```ts
interface IDomCreateClass<Args extends any[]>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

## IDomCreateFunc
```ts
type IDomCreateFunc<Args extends any[]> = (owner: MultiHolder, ...args: Args) => DomComponentReturn;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

## IDomCreator
```ts
type IDomCreator<Args extends any[]> = IDomCreateFunc<Args> | IDomCreateClass<Args>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

## IDomDisposeHooks
```ts
interface IDomDisposeHooks
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

## IInputOptions
```ts
interface IInputOptions
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/input.ts" target="_blank">Defined in input.ts</a></div>

## IKeyHandlers
```ts
interface IKeyHandlers<T extends HTMLElement = HTMLElement>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

## IKnockoutModule
```ts
interface IKnockoutModule
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

## IKnockoutObservable
```ts
interface IKnockoutObservable<T> extends IKnockoutReadObservable<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

## IKnockoutReadObservable
```ts
interface IKnockoutReadObservable<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

## InferKoType
```ts
type InferKoType<KObs extends IKnockoutReadObservable<any>> = KObs extends {
    peek(): infer T;
} ? T : never;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

## InferUseType
```ts
type InferUseType<TObs extends Obs<any> | IKnockoutReadObservable<any>> = TObs extends Obs<infer T> ? T : TObs extends {
    peek(): infer U;
} ? U : never;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

## INodeFunc
```ts
type INodeFunc = (node: Node) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

## input
```ts
input(obs: Observable<string>, options: IInputOptions, ...args: IDomArgs<HTMLInputElement>): HTMLInputElement;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/input.ts" target="_blank">Defined in input.ts</a></div>

## IObsArraySplice
```ts
interface IObsArraySplice<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

## IOption
```ts
type IOption<T> = (T & string) | IOptionFull<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/select.ts" target="_blank">Defined in select.ts</a></div>

## IOptionFull
```ts
interface IOptionFull<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/select.ts" target="_blank">Defined in select.ts</a></div>

## ISpliceListener
```ts
type ISpliceListener<T, C> = (this: C, val: T[], prev: T[], change?: IObsArraySplice<T>) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

## ISubscribable
```ts
type ISubscribable = ISubscribableObs | IKnockoutReadObservable<any>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

## ISubscribableObs
```ts
interface ISubscribableObs
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

## KeyEventType
```ts
type KeyEventType = 'keypress' | 'keyup' | 'keydown';
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

## keyframes
```ts
keyframes(styles: string): string;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/styled.ts" target="_blank">Defined in styled.ts</a></div>

## KoWrapObs
```ts
class KoWrapObs<T> extends Observable<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

## Listener
```ts
class Listener extends LLink
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

## ListenerCB
```ts
type ListenerCB<T> = (this: T, ...args: any[]) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

## LiveIndex
```ts
class LiveIndex extends Observable<number | null>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

## LLink
```ts
class LLink
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

## makeLiveIndex
```ts
makeLiveIndex<T>(owner: IDisposableOwnerT<LiveIndex> | null, obsArr: ObsArray<T>, initialIndex?: number): LiveIndex;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

## makeTestId
```ts
makeTestId(prefix: string): TestId;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## maybe
```ts
maybe<T>(boolValueObs: BindableValue<T>, contentFunc: (val: NonNullable<T>) => DomContents): DomComputed;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

## MaybeObsArray
```ts
type MaybeObsArray<T> = BaseObservable<T[]> | T[];
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

## maybeOwned
```ts
maybeOwned<T>(boolValueObs: BindableValue<T>, contentFunc: (owner: MultiHolder, val: NonNullable<T>) => DomContents): DomComputed;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

## MultiHolder
```ts
class MultiHolder extends Disposable
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

## MutableObsArray
```ts
class MutableObsArray<T> extends ObsArray<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

## noTestId
```ts
noTestId: TestId
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## ObsArray
```ts
class ObsArray<T> extends BaseObservable<T[]>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

## obsArray
```ts
obsArray<T>(value?: T[]): MutableObsArray<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

## Observable
```ts
class Observable<T> extends BaseObservable<T> implements IDisposableOwnerT<T & IDisposable>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

## observable
```ts
observable<T>(value: T): Observable<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

## obsHolder
```ts
obsHolder<T>(value: T & IDisposable): Observable<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

## on
```ts
on<E extends EventName | string, T extends EventTarget>(eventType: E, callback: EventCB<EventType<E>, T>, { useCapture }?: {
    useCapture?: boolean | undefined;
}): DomMethod<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

## onDispose
```ts
onDispose(disposerFunc: INodeFunc): (elem: Node) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

## onDisposeElem
```ts
onDisposeElem(elem: Node, disposerFunc: INodeFunc): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

## onElem
```ts
onElem<E extends EventName | string, T extends EventTarget>(elem: T, eventType: E, callback: EventCB<EventType<E>, T>, { useCapture }?: {
    useCapture?: boolean | undefined;
}): IDisposable;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

## onKeyDown
```ts
onKeyDown<T extends HTMLElement>(keyHandlers: IKeyHandlers<T>): DomMethod<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

## onKeyElem
```ts
onKeyElem<T extends HTMLElement>(elem: T, evType: KeyEventType, keyHandlers: IKeyHandlers<T>): IDisposable;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

## onKeyPress
```ts
onKeyPress<T extends HTMLElement>(keyHandlers: IKeyHandlers<T>): DomMethod<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

## onMatch
```ts
onMatch(selector: string, eventType: string, callback: EventCB, { useCapture }?: {
    useCapture?: boolean | undefined;
}): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

## onMatchElem
```ts
onMatchElem(elem: EventTarget, selector: string, eventType: string, callback: EventCB, { useCapture }?: {
    useCapture?: boolean | undefined;
}): IDisposable;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

## prop
```ts
prop<T>(property: string, valueObs: BindableValue<T>): DomMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## propElem
```ts
propElem<T>(elem: Node, property: string, value: T): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## PureComputed
```ts
class PureComputed<T> extends Observable<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

## pureComputed
```ts
pureComputed<T>(cb: (use: UseCB) => T): PureComputed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

## pureComputed
```ts
pureComputed<A, T>(a: Observable<A>, cb: (use: UseCB, a: A) => T): PureComputed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

## pureComputed
```ts
pureComputed<A, B, T>(a: Observable<A>, b: Observable<B>, cb: (use: UseCB, a: A, b: B) => T): PureComputed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

## pureComputed
```ts
pureComputed<A, B, C, T>(a: Observable<A>, b: Observable<B>, c: Observable<C>, cb: (use: UseCB, a: A, b: B, c: C) => T): PureComputed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

## pureComputed
```ts
pureComputed<A, B, C, D, T>(a: Observable<A>, b: Observable<B>, c: Observable<C>, d: Observable<D>, cb: (use: UseCB, a: A, b: B, c: C, d: D) => T): PureComputed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

## pureComputed
```ts
pureComputed<A, B, C, D, E, T>(a: Observable<A>, b: Observable<B>, c: Observable<C>, d: Observable<D>, e: Observable<E>, cb: (use: UseCB, a: A, b: B, c: C, d: D, e: E) => T): PureComputed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

## replaceContent
```ts
replaceContent(nodeBefore: Node, nodeAfter: Node, content: DomContents): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

## select
```ts
select<T>(obs: Observable<T>, optionArray: MaybeObsArray<IOption<T>>, options?: {
    defLabel?: string;
}): HTMLSelectElement;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/select.ts" target="_blank">Defined in select.ts</a></div>

## setDisposeOwner
```ts
setDisposeOwner<T extends IDisposable>(owner: IDisposableOwnerT<T> | null, obj: T): T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

## setupKoDisposal
```ts
setupKoDisposal(ko: IKnockoutModule): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

## show
```ts
show(boolValueObs: BindableValue<boolean>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## showElem
```ts
showElem(elem: HTMLElement, boolValue: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## style
```ts
style(property: string, valueObs: BindableValue<string>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## styled
```ts
styled<Tag extends TagName>(tag: Tag, styles: string): DomCreateFunc<TagElem<Tag>> & IClsName;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/styled.ts" target="_blank">Defined in styled.ts</a></div>

## styled
```ts
styled<Args extends any[], R extends Element>(creator: (...args: Args) => R, styles: string): typeof creator & IClsName;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/styled.ts" target="_blank">Defined in styled.ts</a></div>

## styleElem
```ts
styleElem(elem: Element, property: string, value: string): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## subscribe
```ts
subscribe(cb: (use: UseCB) => void): Subscription;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

## subscribe
```ts
subscribe<A>(a: Obs<A>, cb: (use: UseCB, a: A) => void): Subscription;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

## subscribe
```ts
subscribe<A, B>(a: Obs<A>, b: Obs<B>, cb: (use: UseCB, a: A, b: B) => void): Subscription;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

## subscribe
```ts
subscribe<A, B, C>(a: Obs<A>, b: Obs<B>, c: Obs<C>, cb: (use: UseCB, a: A, b: B, c: C) => void): Subscription;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

## subscribe
```ts
subscribe<A, B, C, D>(a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, cb: (use: UseCB, a: A, b: B, c: C, d: D) => void): Subscription;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

## subscribe
```ts
subscribe<A, B, C, D, E>(a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, e: Obs<E>, cb: (use: UseCB, a: A, b: B, c: C, d: D, e: E) => void): Subscription;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

## subscribeBindable
```ts
subscribeBindable<KObs extends IKnockoutReadObservable<any>>(valueObs: KObs, callback: (val: InferKoType<KObs>) => void): IDisposable | null;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/binding.ts" target="_blank">Defined in binding.ts</a></div>

## subscribeBindable
```ts
subscribeBindable<T>(valueObs: BindableValue<T>, callback: (val: T) => void): IDisposable | null;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/binding.ts" target="_blank">Defined in binding.ts</a></div>

## subscribeElem
```ts
subscribeElem<T>(elem: Node, valueObs: BindableValue<T>, callback: (newVal: T, oldVal?: T) => void): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/binding.ts" target="_blank">Defined in binding.ts</a></div>

## Subscription
```ts
class Subscription
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

## svg
```ts
svg(tagString: string, ...args: IDomArgs<SVGElement>): SVGElement;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## TagElem
```ts
type TagElem<T extends TagName> = T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## TagName
```ts
type TagName = keyof HTMLElementTagNameMap | string;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## TestId
```ts
type TestId = (name: string) => DomElementMethod | null;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## text
```ts
text(valueObs: BindableValue<string>): DomMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## textElem
```ts
textElem(elem: Node, value: string): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

## toKo
```ts
toKo<T>(knockout: IKnockoutModule, grainObs: Observable<T>): IKnockoutObservable<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

## update
```ts
update<T extends Node, Args extends IDomArgs<T>>(elem: T, ...args: Args): T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

## UseCB
```ts
type UseCB = <TObs extends Obs<any> | IKnockoutReadObservable<any>>(obs: TObs) => InferUseType<TObs>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

## UseCBOwner
```ts
interface UseCBOwner extends UseCB
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>
