# Knockout Integration

GrainJS was inspired by [Knockout.js](https://knockoutjs.com/documentation/introduction.html), and
includes some helpers for playing nice with it because the two were (are) used in
[Grist](https://github.com/gristlabs/grist-core#grist) together.

## Integrating Observables

GrainJS observables and computeds can work side by side with those from Knockout.js.

Most simply, a GrainJS computed can use and depend on a KnockoutJS observable, using the `use()`
callback:

```typescript
import {Computed} from 'grainjs';
import * as ko from 'knockout';

const oldCity = ko.observable("York");
const newCity = Computed.create(null, (use) => "New " + use(oldCity));
oldCity("New York");  // Set knockout observable to a new value.
newCity.get();        // Will return "New New York".
```

If needed you can wrap observables in either direction.

```typescript
import {fromKo} from 'grainjs';

fromKo(koObservable);
```

This returns a GrainJS observable that mirrors the passed-in Knockout observable (which may be a
computed as well). Similarly,

```typescript
import {toKo} from 'grainjs';
import * as ko from 'knockout';

toKo(ko, grainObservable)
```

This returns a Knockout.js observable that mirrows the passed-in GrainJS observable or computed.
Note that `toKo()` must tbe called with the `knockout` module as an argument. This is to avoid
adding Knockout as a dependency of GrainJS.

In both cases, calling `fromKo`/`toKo` twice on the same observable will return the same wrapper,
and subscriptions and disposal are appropriately set up to make usage seamless. In particular, the
returned wrapper should not be disposed; it's tied to the lifetime of the wrapped object.

## Integrating DOM Disposal

When mixing libraries, such as GrainJS, Knockout, or JQuery, DOM may be created by different
libraries, and each has some provisions for cleaning up state associated with the DOM.

While GrainJS has `domDispose()`, Knockout does cleanup in `ko.cleanNode` and
`ko.removeNode`
(see [custom disposal logic](https://knockoutjs.com/documentation/custom-bindings-disposal.html)),
and JQuery in [remove()](https://api.jquery.com/remove/) and [empty()](https://api.jquery.com/empty/).

On removing a DOM element from the page, it's important to run all associated disposers, since
different descendants of an element, and even a single element, may have associated state from
different libraries.

GrainJS supports such integration:

```typescript
import {setupKoDisposal} from 'grainjs';
import * as ko from 'knockout';

setupKoDisposal(ko);
```

This sets up integration between GrainJS and Knockout disposal. Knockout happens to take care of
JQuery cleanup too if needed. Once called, a cleanup by Knockout will run GrainJS disposers, and
`dom.domDispose()` will run Knockout disposers.
