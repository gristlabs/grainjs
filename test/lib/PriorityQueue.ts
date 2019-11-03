import {assert} from 'chai';
import {min, range} from 'lodash';
import {PriorityQueue} from '../../lib/PriorityQueue';

// tslint:disable:no-var-requires
const testutil = require('./testutil');
const FastPriorityQueue  = require('fastpriorityqueue');

describe('PriorityQueue', function() {

  let seed = 1;
  function pseudoRandom() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function removeMin<T>(array: T[]) {
    if (array.length > 0) {
      const minIdx = array.indexOf(min(array)!);
      array[minIdx] = array[array.length - 1];
      array.length--;
    }
  }

  it('should sort numbers up', function() {
    const q = new PriorityQueue<number>((a, b) => a < b);
    [0.1, -1, 5.1, 4.2, 3.5].forEach((val) => q.push(val));
    assert.strictEqual(q.size, 5);
    assert.strictEqual(q.peek(), -1);
    assert.deepEqual([q.pop(), q.pop(), q.pop(), q.pop(), q.pop()],
      [-1, 0.1, 3.5, 4.2, 5.1]);
    assert.strictEqual(q.size, 0);
    assert.strictEqual(q.peek(), undefined);
    assert.strictEqual(q.pop(), undefined);
  });

  it('should sort numbers down', function() {
    const q = new PriorityQueue<number>((a, b) => a > b);
    [0.1, -1, 5.1, 4.2, 3.5].forEach((val) => q.push(val));
    assert.strictEqual(q.size, 5);
    assert.strictEqual(q.peek(), 5.1);
    assert.deepEqual([q.pop(), q.pop(), q.pop(), q.pop(), q.pop()],
      [5.1, 4.2, 3.5, 0.1, -1]);
    assert.strictEqual(q.size, 0);
    assert.strictEqual(q.peek(), undefined);
    assert.strictEqual(q.pop(), undefined);
  });

  it('should work for random operations', function() {
    const q = new PriorityQueue<number>((a, b) => a < b);
    const arr = [];
    // First fill with 1000 random numbers.
    for (let i = 0; i < 1000; i++) {
      const v = pseudoRandom();
      q.push(v);
      arr.push(v);
    }
    // Now do 2000 iterations randomly adding or removing a value.
    for (let i = 0; i < 2000; i++) {
      if (pseudoRandom() < 0.5) {
        q.pop();
        removeMin(arr);
      } else {
        const v = pseudoRandom();
        q.push(v);
        arr.push(v);
      }
    }
    assert.strictEqual(q.size, arr.length);
    arr.sort((a, b) => a - b);
    assert.deepEqual(arr.map((i) => q.pop()), arr);
    assert.strictEqual(q.size, 0);
  });

  [10, 1000].forEach((queueSize: number) => {
    describe(`Timing queue with ${queueSize} items`, function() {
      // We create a PriorityQueue, and one from "fastpriorityqueue" library, and compare.
      let priorityQueue: any;
      let fastpriorityqueue: any;
      let data: number[];
      const compare = (a: number, b: number) => a < b;

      before(function() {
        priorityQueue = new PriorityQueue(compare);
        fastpriorityqueue = new FastPriorityQueue(compare);
        data = [];
        for (let i = 0; i < queueSize; i++) {
          data.push(pseudoRandom());
        }
      });

      testutil.timeit("fill/drain fastpriorityqueue", () => {
        for (const val of data) {
          fastpriorityqueue.add(val);
        }
        while (fastpriorityqueue.size) {
          fastpriorityqueue.poll();
        }
      }, 500);

      testutil.timeit("fill/drain PriorityQueue", () => {
        for (const val of data) {
          priorityQueue.push(val);
        }
        while (priorityQueue.size) {
          priorityQueue.pop();
        }
      }, 500, { compareToPrevious: true });
    });
  });

  describe('memory', function() {
    const compare = (a: number[], b: number[]) => a[0] < b[0];
    this.timeout(10000);
    before(function() { testutil.skipWithoutGC(this); });

    // We check that the queue does not prevent garbage-collection of popped items. The
    // fillDrain() function fills the queue with some biggish objects, and then pops them all.
    function fillDrain(queue: any, pushMethod: string, popMethod: string): any {
      const count = 200;
      for (let i = 0; i < count; i++) {
        queue[pushMethod](range(i, i + 100));    // the item is an array [i, ..., i + 99]
      }
      assert.strictEqual(queue.size, count);
      for (let i = 0; i < count; i++) {
        queue[popMethod]();
      }
      assert.strictEqual(queue.size, 0);
      return queue;
    }

    const N = 500;
    it('measure memory of drained fastpriorityqueue', function() {
      return testutil.measureMemoryUsage(N, {
        createItem: (i: number) => fillDrain(new FastPriorityQueue(compare), "add", "poll"),
        test: this.test,
      });
    });
    it('measure memory of drained PriorityQueue', function() {
      return testutil.measureMemoryUsage(N, {
        createItem: (i: number) => fillDrain(new PriorityQueue(compare), "push", "pop"),
        test: this.test,
      });
    });
  });
});
