import type { Problem } from "./types";

export const jsUtilProblems: Problem[] = [
  {
    id: "debounce",
    title: "Debounce",
    difficulty: "Medium",
    prompt:
      "Implement a `debounce(fn, delay)` higher-order function. It returns a wrapped function that postpones invoking `fn` until `delay` milliseconds have elapsed since the last call; each new call resets the timer. The wrapped call should preserve `this` and forward its arguments.\n\n**Example**\n```\nconst log = debounce(() => console.log(\"ran\"), 100);\nlog(); log(); log();   // fn runs only once, ~100ms after the last call\n```",
    starterCode: {
      javascript: `function debounce(fn, delay) {
  // Your code here
  return function (...args) {
    // Your code here
  };
}

let count = 0;
const inc = debounce(() => { count += 1; }, 100);
inc();
inc();
inc();
setTimeout(() => console.log(count), 150);  // expected: 1
`,
    },
  },
  {
    id: "rate-limiter",
    title: "Rate Limiter",
    difficulty: "Medium",
    prompt:
      "Implement an in-memory sliding-window rate limiter. `isAllowed(userId)` returns true and records the request if the user has made fewer than `limit` requests within the trailing `windowMs` time window, otherwise it returns false. Each user is tracked independently.\n\n**Example**\n```\nlimiter = RateLimiter(2, 1000)   // 2 requests per 1000ms\nlimiter.isAllowed(\"u1\")          // true\nlimiter.isAllowed(\"u1\")          // true\nlimiter.isAllowed(\"u1\")          // false (limit reached)\n```",
    starterCode: {
      javascript: `class RateLimiter {
  constructor(limit, windowMs) {
    // Your code here
  }

  isAllowed(userId) {
    // Your code here
    return false;
  }
}

const limiter = new RateLimiter(2, 1000);
console.log(limiter.isAllowed("u1"));  // expected: true
console.log(limiter.isAllowed("u1"));  // expected: true
console.log(limiter.isAllowed("u1"));  // expected: false
`,
    },
  },
  {
    id: "custom-iterator",
    title: "Custom Iterator",
    difficulty: "Medium",
    prompt:
      "Implement an iterator over an array exposing `hasNext()` (true while elements remain) and `next()` (returns the next element and advances, or undefined when exhausted).\n\n**Example**\n```\nit = ArrayIterator([1, 2, 3])\nit.hasNext()   // true\nit.next()      // 1\nit.next()      // 2\nit.next()      // 3\nit.hasNext()   // false\nit.next()      // undefined\n```",
    starterCode: {
      javascript: `class ArrayIterator {
  constructor(arr) {
    // Your code here
  }

  hasNext() {
    // Your code here
    return false;
  }

  next() {
    // Your code here
    return undefined;
  }
}

const it = new ArrayIterator([1, 2, 3]);
const out = [];
while (it.hasNext()) {
  out.push(it.next());
}
console.log(out);          // expected: [1, 2, 3]
console.log(it.next());    // expected: undefined
`,
    },
  },
  {
    id: "deep-clone",
    title: "Deep Clone",
    difficulty: "Medium",
    prompt:
      "Implement a function that deep-clones a value made of nested objects and arrays, so that mutating the clone never affects the original. Primitives are returned as-is; objects and arrays are copied recursively.\n\n**Example**\n```\noriginal = { a: 1, b: { c: 2, d: [3, 4] } }\nclone = deep_clone(original)\nclone[\"b\"][\"c\"] = 99\noriginal[\"b\"][\"c\"]   // still 2\n```",
    starterCode: {
      python: `def deep_clone(value):
    # Your code here
    return value


if __name__ == "__main__":
    original = {"a": 1, "b": {"c": 2, "d": [3, 4]}}
    clone = deep_clone(original)
    clone["b"]["c"] = 99
    print(original["b"]["c"])   # expected: 2
`,
      javascript: `function deepClone(value) {
  // Your code here
  return value;
}

const original = { a: 1, b: { c: 2, d: [3, 4] } };
const clone = deepClone(original);
clone.b.c = 99;
console.log(original.b.c);   // expected: 2
`,
    },
  },
  {
    id: "flatten-nested-array",
    title: "Flatten a Nested Array",
    difficulty: "Easy",
    prompt:
      "Given an array that may contain arbitrarily nested arrays of values, return a new single-level array with all values in order.\n\n**Example**\n```\nflatten([[1, 2, [3]], [4, 5]])   // [1, 2, 3, 4, 5]\nflatten([1, [2], [3], 4, [5]])   // [1, 2, 3, 4, 5]\n```",
    starterCode: {
      python: `def flatten(nested):
    # Your code here
    return []


if __name__ == "__main__":
    print(flatten([[1, 2, [3]], [4, 5]]))   # expected: [1, 2, 3, 4, 5]
    print(flatten([1, [2], [3], 4, [5]]))   # expected: [1, 2, 3, 4, 5]
`,
      javascript: `function flatten(nested) {
  // Your code here
  return [];
}

console.log(flatten([[1, 2, [3]], [4, 5]]));   // expected: [1, 2, 3, 4, 5]
console.log(flatten([1, [2], [3], 4, [5]]));   // expected: [1, 2, 3, 4, 5]
`,
    },
  },
  {
    id: "basic-calculator",
    title: "Basic Calculator",
    difficulty: "Easy",
    prompt:
      "Implement a `calculator(a, b, op)` function that applies a binary arithmetic operator to two numbers, where `op` is one of `+`, `-`, `*`, `/`. Throw an error for any unrecognized operator.\n\n**Example**\n```\ncalculator(2, 4, \"+\")   // 6\ncalculator(2, 4, \"-\")   // -2\ncalculator(2, 4, \"*\")   // 8\ncalculator(2, 4, \"/\")   // 0.5\n```",
    starterCode: {
      python: `def calculator(a, b, op):
    # Your code here
    return None


if __name__ == "__main__":
    print(calculator(2, 4, "+"))   # expected: 6
    print(calculator(2, 4, "-"))   # expected: -2
    print(calculator(2, 4, "*"))   # expected: 8
    print(calculator(2, 4, "/"))   # expected: 0.5
`,
      javascript: `function calculator(a, b, op) {
  // Your code here
  return undefined;
}

console.log(calculator(2, 4, "+"));   // expected: 6
console.log(calculator(2, 4, "-"));   // expected: -2
console.log(calculator(2, 4, "*"));   // expected: 8
console.log(calculator(2, 4, "/"));   // expected: 0.5
`,
    },
  },
];
