import type { Problem } from "./types";

export const designProblems: Problem[] = [
  {
    id: "lru-cache",
    title: "LRU Cache",
    difficulty: "Medium",
    prompt:
      "Design a data structure for a Least Recently Used (LRU) cache with a fixed capacity. It must support `get(key)` (return the value or -1 if absent) and `put(key, value)` (insert or update), both in O(1) time; when the cache exceeds capacity, evict the least recently used item.\n\n**Example**\n```\ncache = LRUCache(2)\ncache.put(1, 1)\ncache.put(2, 2)\ncache.get(1)    // 1\ncache.put(3, 3) // evicts key 2\ncache.get(2)    // -1 (not found)\n```",
    starterCode: {
      python: `class LRUCache:
    def __init__(self, capacity):
        # Your code here
        pass

    def get(self, key):
        # Your code here
        return -1

    def put(self, key, value):
        # Your code here
        pass


if __name__ == "__main__":
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    print(cache.get(1))     # expected: 1
    cache.put(3, 3)         # evicts key 2
    print(cache.get(2))     # expected: -1
`,
      javascript: `class LRUCache {
  constructor(capacity) {
    // Your code here
  }

  get(key) {
    // Your code here
    return -1;
  }

  put(key, value) {
    // Your code here
  }
}

const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1));  // expected: 1
cache.put(3, 3);            // evicts key 2
console.log(cache.get(2));  // expected: -1
`,
      typescript: `class LRUCache {
  constructor(capacity: number) {
    // Your code here
  }

  get(key: number): number {
    // Your code here
    return -1;
  }

  put(key: number, value: number): void {
    // Your code here
  }
}

const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1));  // expected: 1
cache.put(3, 3);            // evicts key 2
console.log(cache.get(2));  // expected: -1
`,
    },
  },
  {
    id: "trie-prefix-tree",
    title: "Trie (Prefix Tree)",
    difficulty: "Medium",
    prompt:
      "Implement a trie (prefix tree) supporting `insert(word)`, `search(word)` (returns true only if the exact word was inserted), and `startsWith(prefix)` (returns true if any inserted word has the given prefix).\n\n**Example**\n```\ntrie = Trie()\ntrie.insert(\"apple\")\ntrie.search(\"apple\")      // true\ntrie.search(\"app\")        // false\ntrie.startsWith(\"app\")    // true\ntrie.insert(\"app\")\ntrie.search(\"app\")        // true\n```",
    starterCode: {
      python: `class Trie:
    def __init__(self):
        # Your code here
        pass

    def insert(self, word):
        # Your code here
        pass

    def search(self, word):
        # Your code here
        return False

    def starts_with(self, prefix):
        # Your code here
        return False


if __name__ == "__main__":
    trie = Trie()
    trie.insert("apple")
    print(trie.search("apple"))      # expected: True
    print(trie.search("app"))        # expected: False
    print(trie.starts_with("app"))   # expected: True
    trie.insert("app")
    print(trie.search("app"))        # expected: True
`,
      javascript: `class Trie {
  constructor() {
    // Your code here
  }

  insert(word) {
    // Your code here
  }

  search(word) {
    // Your code here
    return false;
  }

  startsWith(prefix) {
    // Your code here
    return false;
  }
}

const trie = new Trie();
trie.insert("apple");
console.log(trie.search("apple"));     // expected: true
console.log(trie.search("app"));       // expected: false
console.log(trie.startsWith("app"));   // expected: true
trie.insert("app");
console.log(trie.search("app"));       // expected: true
`,
      typescript: `class Trie {
  constructor() {
    // Your code here
  }

  insert(word: string): void {
    // Your code here
  }

  search(word: string): boolean {
    // Your code here
    return false;
  }

  startsWith(prefix: string): boolean {
    // Your code here
    return false;
  }
}

const trie = new Trie();
trie.insert("apple");
console.log(trie.search("apple"));     // expected: true
console.log(trie.search("app"));       // expected: false
console.log(trie.startsWith("app"));   // expected: true
trie.insert("app");
console.log(trie.search("app"));       // expected: true
`,
    },
  },
];
