import {computed} from '../lib/computed';
import {computedArray, makeLiveIndex, MutableObsArray, ObsArray, obsArray} from '../lib/obsArray';
import {bundleChanges, Observable, observable} from '../lib/observable';
import {assertResetFirstArgs, assertResetSingleCall} from './testutil2';

import {assert} from 'chai';
import * as sinon from 'sinon';

describe('obsArray', function() {

  describe('MutableObsArray', function() {
    it('should emit correct splice info on changes', function() {
      const m = obsArray<string>();
      const spy = sinon.spy();
      m.addListener(spy);

      // Push to empty array.
      assert.equal(m.push("a"), 1);
      assert.deepEqual(m.get(), ["a"]);
      assertResetSingleCall(spy, undefined, m.get(), m.get(), {start: 0, numAdded: 1, deleted: []});

      // Push to non-empty array.
      assert.equal(m.push("b", "c"), 3);
      assert.deepEqual(m.get(), ["a", "b", "c"]);
      assertResetSingleCall(spy, undefined, m.get(), m.get(), {start: 1, numAdded: 2, deleted: []});

      // Splice to remove and add.
      assert.deepEqual(m.splice(1, 1, "b1", "b2"), ["b"]);
      assert.deepEqual(m.get(), ["a", "b1", "b2", "c"]);
      assertResetSingleCall(spy, undefined, m.get(), m.get(), {start: 1, numAdded: 2, deleted: ["b"]});

      // Splice to just remove.
      assert.deepEqual(m.splice(2, 2), ["b2", "c"]);
      assert.deepEqual(m.get(), ["a", "b1"]);
      assertResetSingleCall(spy, undefined, m.get(), m.get(), {start: 2, numAdded: 0, deleted: ["b2", "c"]});

      // Splice to just add.
      assert.deepEqual(m.splice(2, 0, "d", "e"), []);
      assert.deepEqual(m.get(), ["a", "b1", "d", "e"]);
      assertResetSingleCall(spy, undefined, m.get(), m.get(), {start: 2, numAdded: 2, deleted: []});

      // Shift an array.
      assert.equal(m.shift(), "a");
      assert.deepEqual(m.get(), ["b1", "d", "e"]);
      assertResetSingleCall(spy, undefined, m.get(), m.get(), {start: 0, numAdded: 0, deleted: ["a"]});

      // Unshift to empty array.
      assert.equal(m.unshift("a1", "a2"), 5);
      assert.deepEqual(m.get(), ["a1", "a2", "b1", "d", "e"]);
      assertResetSingleCall(spy, undefined, m.get(), m.get(), {start: 0, numAdded: 2, deleted: []});

      // Pop an array.
      assert.equal(m.pop(), "e");
      assert.deepEqual(m.get(), ["a1", "a2", "b1", "d"]);
      assertResetSingleCall(spy, undefined, m.get(), m.get(), {start: 4, numAdded: 0, deleted: ["e"]});

      // Splice to make empty.
      assert.deepEqual(m.splice(0), ["a1", "a2", "b1", "d"]);
      assert.deepEqual(m.get(), []);
      assertResetSingleCall(spy, undefined, m.get(), m.get(),
        {start: 0, numAdded: 0, deleted: ["a1", "a2", "b1", "d"]});

      // Pop empty array.
      assert.equal(m.pop(), undefined);
      assert.deepEqual(m.get(), []);
      sinon.assert.notCalled(spy);

      // Shift empty array.
      assert.equal(m.shift(), undefined);
      assert.deepEqual(m.get(), []);
      sinon.assert.notCalled(spy);

      // Unshift an empty array.
      assert.equal(m.unshift("a", "b"), 2);
      assert.deepEqual(m.get(), ["a", "b"]);
      assertResetSingleCall(spy, undefined, m.get(), m.get(), {start: 0, numAdded: 2, deleted: []});
    });
  });

  describe("ComputedArray", function() {
    it("should match a computed that maps an array", function() {
      const m = obsArray<string>([]);
      const mapped = computedArray(m, (x) => x.toUpperCase());
      const simple = computed((use) => use(m).map((x) => x.toUpperCase()));

      assert.deepEqual(mapped.get(), []);
      assert.deepEqual(mapped.get(), simple.get());

      m.push("a", "b", "c");
      assert.deepEqual(mapped.get(), ["A", "B", "C"]);
      assert.deepEqual(mapped.get(), simple.get());

      m.set(["w", "x", "y", "z"]);
      assert.deepEqual(mapped.get(), ["W", "X", "Y", "Z"]);
      assert.deepEqual(mapped.get(), simple.get());

      m.splice(1, 2);
      assert.deepEqual(mapped.get(), ["W", "Z"]);
      assert.deepEqual(mapped.get(), simple.get());

      m.unshift("a", "b");
      assert.deepEqual(mapped.get(), ["A", "B", "W", "Z"]);
      assert.deepEqual(mapped.get(), simple.get());

      m.push("c", "d");
      assert.deepEqual(mapped.get(), ["A", "B", "W", "Z", "C", "D"]);
      assert.deepEqual(mapped.get(), simple.get());

      m.splice(3, 0, "p", "q");
      assert.deepEqual(mapped.get(), ["A", "B", "W", "P", "Q", "Z", "C", "D"]);
      assert.deepEqual(mapped.get(), simple.get());

      m.pop();
      m.shift();
      assert.deepEqual(mapped.get(), ["B", "W", "P", "Q", "Z", "C"]);
      assert.deepEqual(mapped.get(), simple.get());

      bundleChanges(() => {
        m.pop();
        m.shift();
        m.push("x");
      });
      assert.deepEqual(mapped.get(), ["W", "P", "Q", "Z", "X"]);
      assert.deepEqual(mapped.get(), simple.get());
    });

    it("should be efficient for single splice changes", function() {
      const m = obsArray<string>([]);
      const spy1 = sinon.spy((x: string) => x.toUpperCase());
      const spy2 = sinon.spy((x: string) => x.toUpperCase());
      const simple = computed((use) => use(m).map(spy1));
      const mapped = computedArray(m, spy2);

      m.push("a", "b", "c");
      assert.deepEqual(simple.get(), ["A", "B", "C"]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1, "a", "b", "c");
      assertResetFirstArgs(spy2, "a", "b", "c");

      m.set(["w", "x", "y", "z"]);
      assert.deepEqual(simple.get(), ["W", "X", "Y", "Z"]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1, "w", "x", "y", "z");
      assertResetFirstArgs(spy2, "w", "x", "y", "z");

      m.splice(1, 2);
      assert.deepEqual(simple.get(), ["W", "Z"]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1, "w", "z");
      assertResetFirstArgs(spy2);

      m.unshift("a", "b");
      assert.deepEqual(simple.get(), ["A", "B", "W", "Z"]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1, "a", "b", "w", "z");
      assertResetFirstArgs(spy2, "a", "b");

      m.push("c", "d");
      assert.deepEqual(simple.get(), ["A", "B", "W", "Z", "C", "D"]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1, "a", "b", "w", "z", "c", "d");
      assertResetFirstArgs(spy2, "c", "d");

      m.splice(3, 0, "p", "q");
      assert.deepEqual(simple.get(), ["A", "B", "W", "P", "Q", "Z", "C", "D"]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1, "a", "b", "w", "p", "q", "z", "c", "d");
      assertResetFirstArgs(spy2, "p", "q");

      m.pop();
      m.shift();
      assert.deepEqual(simple.get(), ["B", "W", "P", "Q", "Z", "C"]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1, "a", "b", "w", "p", "q", "z", "c",
                                 "b", "w", "p", "q", "z", "c");
      assertResetFirstArgs(spy2);

      bundleChanges(() => {
        m.pop();
        m.shift();
        m.push("x");
      });
      assert.deepEqual(simple.get(), ["W", "P", "Q", "Z", "X"]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1, "w", "p", "q", "z", "x");
      assertResetFirstArgs(spy2, "w", "p", "q", "z", "x");          // Rebuilt because multiple splices.

      m.set(["foo", "bar"]);
      assert.deepEqual(simple.get(), ["FOO", "BAR"]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1, "foo", "bar");
      assertResetFirstArgs(spy2, "foo", "bar");
    });

    it("should work for an observable whose value is an ObsArray", function() {
      const sources = [
        obsArray<number>([]),
        obsArray<number>([1, 2, 3]),
      ];
      const target = observable<ObsArray<number>>(sources[0]);
      testObsArrayToggling(sources, target, (index) => target.set(sources[index]));
    });

    it("should work for a computed whose value is an ObsArray", function() {
      const sources = [
        obsArray<number>([]),
        obsArray<number>([1, 2, 3]),
      ];
      const indexObs = observable(0);
      const target = computed((use) => sources[use(indexObs)]);
      testObsArrayToggling(sources, target, (index) => indexObs.set(index));
    });

    function testObsArrayToggling(sources: ArrayLike<MutableObsArray<number>>,
                                  target: Observable<ObsArray<number>>,
                                  setIndex: (index: number) => void) {
      const spy1 = sinon.spy((x: number) => x * 10);
      const spy2 = sinon.spy((x: number) => x * 10);
      const simple = computed((use) => use(use(target)).map(spy1));
      const mapped = computedArray(target, spy2);

      assert.deepEqual(simple.get(), []);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1);
      assertResetFirstArgs(spy2);

      sources[0].push(4, 5);
      assert.deepEqual(simple.get(), [40, 50]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1, 4, 5);
      assertResetFirstArgs(spy2, 4, 5);

      setIndex(1);
      assert.deepEqual(simple.get(), [10, 20, 30]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1, 1, 2, 3);
      assertResetFirstArgs(spy2, 1, 2, 3);

      sources[0].push(6);
      assert.deepEqual(simple.get(), [10, 20, 30]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1);
      assertResetFirstArgs(spy2);

      sources[1].pop();
      assert.deepEqual(simple.get(), [10, 20]);
      assert.deepEqual(mapped.get(), simple.get());
      // This is the important check: that small changes to the currently-mirrored underlying
      // array do not require a re-mapping of the whole computedArray.
      assertResetFirstArgs(spy1, 1, 2);
      assertResetFirstArgs(spy2);

      setIndex(0);
      assert.deepEqual(simple.get(), [40, 50, 60]);
      assert.deepEqual(mapped.get(), simple.get());

      // No difference here, keeping the same index.
      setIndex(0);
      assert.deepEqual(simple.get(), [40, 50, 60]);
      assert.deepEqual(mapped.get(), simple.get());

      spy1.resetHistory();
      spy2.resetHistory();
      bundleChanges(() => {
        sources[0].unshift(7);
        sources[1].push(8, 9);
        setIndex(1);
        sources[0].set([]);
      });
      assert.deepEqual(simple.get(), [10, 20, 80, 90]);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1, 1, 2, 8, 9);
      assertResetFirstArgs(spy2, 1, 2, 8, 9);

      setIndex(0);
      assert.deepEqual(simple.get(), []);
      assert.deepEqual(mapped.get(), simple.get());
      assertResetFirstArgs(spy1);
      assertResetFirstArgs(spy2);
    }
  });

  describe("makeLiveIndex", function() {
    it("should be kept valid", function() {
      const arr = obsArray([1, 2, 3]);
      const index = makeLiveIndex(null, arr);
      assert.equal(index.get(), 0);

      index.set(-1);
      assert.equal(index.get(), 0);

      index.set(null);
      assert.equal(index.get(), 0);

      index.set(100);
      assert.equal(index.get(), 2);

      arr.splice(1, 1);
      assert.deepEqual(arr.get(), [1, 3]);
      assert.equal(index.get(), 1);

      arr.splice(0, 1, 5, 6, 7);
      assert.deepEqual(arr.get(), [5, 6, 7, 3]);
      assert.equal(index.get(), 3);

      arr.push(10);
      arr.splice(2, 2);
      assert.deepEqual(arr.get(), [5, 6, 10]);
      assert.equal(index.get(), 2);

      arr.splice(2, 1);
      assert.deepEqual(arr.get(), [5, 6]);
      assert.equal(index.get(), 1);

      arr.splice(0, 2);
      assert.deepEqual(arr.get(), []);
      assert.equal(index.get(), null);

      arr.push(1, 2, 3);
      assert.deepEqual(arr.get(), [1, 2, 3]);
      assert.equal(index.get(), 0);

      arr.splice(0, 0, 5, 6);
      assert.deepEqual(arr.get(), [5, 6, 1, 2, 3]);
      assert.equal(index.get(), 2);
    });

    it("should support setLive", function() {
      const arr = obsArray([1, 2, 3]);
      const index = makeLiveIndex(null, arr, 100);
      assert.equal(index.get(), 2);

      index.setLive(false);
      arr.splice(1, 1);
      assert.deepEqual(arr.get(), [1, 3]);
      assert.equal(index.get(), 1);     // Changed to keep it valid.

      arr.splice(0, 1, 5, 6, 7);
      assert.deepEqual(arr.get(), [5, 6, 7, 3]);
      assert.equal(index.get(), 1);     // Unchanged.

      arr.splice(0);
      assert.equal(index.get(), null);  // Changed to keep it valid.

      arr.push(1, 2, 3);
      assert.deepEqual(arr.get(), [1, 2, 3]);
      assert.equal(index.get(), 0);     // Changed to keep it valid.

      arr.splice(0, 0, 5, 6);
      assert.deepEqual(arr.get(), [5, 6, 1, 2, 3]);
      assert.equal(index.get(), 0);     // Unchanged.
    });
  });
});
