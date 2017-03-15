"use strict";

/**
 * Returns f such that f() calls func(...boundArgs), i.e. optimizes `() => func(...boundArgs)`.
 * It is faster on node4 by 71-87%, on node6 by 57-92%.
 */
function bindB(func, b) {
  switch (b.length) {
    case 0: return () => func();
    case 1: return () => func(b[0]);
    case 2: return () => func(b[0], b[1]);
    case 3: return () => func(b[0], b[1], b[2]);
    case 4: return () => func(b[0], b[1], b[2], b[3]);
    default: return () => func.apply(null, b);
  }
}

/**
 * Returns f such that f(unboundArg) calls func(unboundArg, ...boundArgs).
 * I.e. optimizes `(arg) => func(arg, ...boundArgs)`.
 * It is faster on node4 and on node6 by 0-92%.
 */
function bindUB(func, b) {
  switch (b.length) {
    case 0: return (arg) => func(arg);
    case 1: return (arg) => func(arg, b[0]);
    case 2: return (arg) => func(arg, b[0], b[1]);
    case 3: return (arg) => func(arg, b[0], b[1], b[2]);
    case 4: return (arg) => func(arg, b[0], b[1], b[2], b[3]);
    default: return (arg) => func(arg, ...b);
  }
}

/**
 * Returns f such that f(unboundArg) calls func(...boundArgs, unboundArg).
 * I.e. optimizes `(arg) => func(...boundArgs, arg)`.
 * It is faster on node4 and on node6 by 0-92%.
 */
function bindBU(func, b) {
  switch (b.length) {
    case 0: return (arg) => func(arg);
    case 1: return (arg) => func(b[0], arg);
    case 2: return (arg) => func(b[0], b[1], arg);
    case 3: return (arg) => func(b[0], b[1], b[2], arg);
    case 4: return (arg) => func(b[0], b[1], b[2], b[3], arg);
    default: return (arg) => func(...b, arg);
  }
}

exports.bindB = bindB;
exports.bindUB = bindUB;
exports.bindBU = bindBU;
