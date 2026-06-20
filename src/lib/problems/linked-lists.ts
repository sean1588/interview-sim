import type { Problem } from "./types";

export const linkedListProblems: Problem[] = [
  {
    id: "add-two-numbers",
    title: "Add Two Numbers",
    difficulty: "Medium",
    prompt: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each node holds a single digit. Add the two numbers and return the sum as a linked list (also in reverse order).

**Example**

\`\`\`
Input:  l1 = [2, 4, 3], l2 = [5, 6, 4]   (342 + 465)
Output: [7, 0, 8]                          (807)
\`\`\``,
    starterCode: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def build_list(values):
    """Build a linked list from a list of values; returns the head (or None)."""
    head = None
    for value in reversed(values):
        head = ListNode(value, head)
    return head


def list_to_array(head):
    """Convert a linked list back to a plain list of values."""
    result = []
    while head is not None:
        result.append(head.val)
        head = head.next
    return result


def add_two_numbers(l1, l2):
    # Your code here
    return None


if __name__ == "__main__":
    l1 = build_list([2, 4, 3])
    l2 = build_list([5, 6, 4])
    print(list_to_array(add_two_numbers(l1, l2)))  # expected: [7, 0, 8]
`,
      javascript: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head) {
  const result = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function addTwoNumbers(l1, l2) {
  // Your code here
  return null;
}

const l1 = buildList([2, 4, 3]);
const l2 = buildList([5, 6, 4]);
console.log(listToArray(addTwoNumbers(l1, l2))); // expected: [7, 0, 8]
`,
      typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values: number[]): ListNode | null {
  let head: ListNode | null = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head: ListNode | null): number[] {
  const result: number[] = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  // Your code here
  return null;
}

const l1 = buildList([2, 4, 3]);
const l2 = buildList([5, 6, 4]);
console.log(listToArray(addTwoNumbers(l1, l2))); // expected: [7, 0, 8]
`,
    },
  },
  {
    id: "merge-k-sorted-lists",
    title: "Merge k Sorted Lists",
    difficulty: "Hard",
    prompt: `You are given an array of \`k\` linked lists, each sorted in ascending order. Merge all of them into a single sorted linked list and return its head.

**Example**

\`\`\`
Input:  lists = [[1, 4, 5], [1, 3, 4], [2, 6]]
Output: [1, 1, 2, 3, 4, 4, 5, 6]
\`\`\``,
    starterCode: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def build_list(values):
    """Build a linked list from a list of values; returns the head (or None)."""
    head = None
    for value in reversed(values):
        head = ListNode(value, head)
    return head


def list_to_array(head):
    """Convert a linked list back to a plain list of values."""
    result = []
    while head is not None:
        result.append(head.val)
        head = head.next
    return result


def merge_k_lists(lists):
    # Your code here
    return None


if __name__ == "__main__":
    lists = [build_list([1, 4, 5]), build_list([1, 3, 4]), build_list([2, 6])]
    print(list_to_array(merge_k_lists(lists)))  # expected: [1, 1, 2, 3, 4, 4, 5, 6]
`,
      javascript: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head) {
  const result = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function mergeKLists(lists) {
  // Your code here
  return null;
}

const lists = [buildList([1, 4, 5]), buildList([1, 3, 4]), buildList([2, 6])];
console.log(listToArray(mergeKLists(lists))); // expected: [1, 1, 2, 3, 4, 4, 5, 6]
`,
      typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values: number[]): ListNode | null {
  let head: ListNode | null = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head: ListNode | null): number[] {
  const result: number[] = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function mergeKLists(lists: (ListNode | null)[]): ListNode | null {
  // Your code here
  return null;
}

const lists = [buildList([1, 4, 5]), buildList([1, 3, 4]), buildList([2, 6])];
console.log(listToArray(mergeKLists(lists))); // expected: [1, 1, 2, 3, 4, 4, 5, 6]
`,
    },
  },
  {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "Easy",
    prompt: `Given the head of a singly linked list, reverse the list and return the head of the reversed list.

**Example**

\`\`\`
Input:  head = [1, 2, 3, 4, 5]
Output: [5, 4, 3, 2, 1]
\`\`\``,
    starterCode: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def build_list(values):
    """Build a linked list from a list of values; returns the head (or None)."""
    head = None
    for value in reversed(values):
        head = ListNode(value, head)
    return head


def list_to_array(head):
    """Convert a linked list back to a plain list of values."""
    result = []
    while head is not None:
        result.append(head.val)
        head = head.next
    return result


def reverse_list(head):
    # Your code here
    return None


if __name__ == "__main__":
    head = build_list([1, 2, 3, 4, 5])
    print(list_to_array(reverse_list(head)))  # expected: [5, 4, 3, 2, 1]
`,
      javascript: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head) {
  const result = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function reverseList(head) {
  // Your code here
  return null;
}

const head = buildList([1, 2, 3, 4, 5]);
console.log(listToArray(reverseList(head))); // expected: [5, 4, 3, 2, 1]
`,
      typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values: number[]): ListNode | null {
  let head: ListNode | null = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head: ListNode | null): number[] {
  const result: number[] = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function reverseList(head: ListNode | null): ListNode | null {
  // Your code here
  return null;
}

const head = buildList([1, 2, 3, 4, 5]);
console.log(listToArray(reverseList(head))); // expected: [5, 4, 3, 2, 1]
`,
    },
  },
  {
    id: "linked-list-cycle",
    title: "Linked List Cycle",
    difficulty: "Easy",
    prompt: `Given the head of a linked list, determine whether the list contains a cycle. A cycle exists if some node can be reached again by continuously following the \`next\` pointer.

**Example**

\`\`\`
Input:  head = [3, 2, 0, -4], with the tail's next pointing back to the node with value 2
Output: true

Input:  head = [1, 2]   (no cycle)
Output: false
\`\`\``,
    starterCode: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def build_list(values):
    """Build a linked list from a list of values; returns the head (or None)."""
    head = None
    for value in reversed(values):
        head = ListNode(value, head)
    return head


def list_to_array(head):
    """Convert a linked list back to a plain list of values."""
    result = []
    while head is not None:
        result.append(head.val)
        head = head.next
    return result


def has_cycle(head):
    # Your code here
    return None


if __name__ == "__main__":
    # Cyclic example: build [3, 2, 0, -4], then wire the tail back to the second node.
    cyclic = build_list([3, 2, 0, -4])
    second = cyclic.next
    tail = cyclic
    while tail.next is not None:
        tail = tail.next
    tail.next = second
    print(has_cycle(cyclic))  # expected: True

    # Acyclic example.
    acyclic = build_list([1, 2])
    print(has_cycle(acyclic))  # expected: False
`,
      javascript: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head) {
  const result = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function hasCycle(head) {
  // Your code here
  return null;
}

// Cyclic example: build [3, 2, 0, -4], then wire the tail back to the second node.
const cyclic = buildList([3, 2, 0, -4]);
const second = cyclic.next;
let tail = cyclic;
while (tail.next !== null) {
  tail = tail.next;
}
tail.next = second;
console.log(hasCycle(cyclic)); // expected: true

// Acyclic example.
const acyclic = buildList([1, 2]);
console.log(hasCycle(acyclic)); // expected: false
`,
      typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values: number[]): ListNode | null {
  let head: ListNode | null = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head: ListNode | null): number[] {
  const result: number[] = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function hasCycle(head: ListNode | null): boolean {
  // Your code here
  return false;
}

// Cyclic example: build [3, 2, 0, -4], then wire the tail back to the second node.
const cyclic = buildList([3, 2, 0, -4])!;
const second = cyclic.next;
let tail = cyclic;
while (tail.next !== null) {
  tail = tail.next;
}
tail.next = second;
console.log(hasCycle(cyclic)); // expected: true

// Acyclic example.
const acyclic = buildList([1, 2]);
console.log(hasCycle(acyclic)); // expected: false
`,
    },
  },
  {
    id: "middle-of-the-linked-list",
    title: "Middle of the Linked List",
    difficulty: "Easy",
    prompt: `Given the head of a singly linked list, return the middle node. If there are two middle nodes, return the second one.

**Example**

\`\`\`
Input:  head = [1, 2, 3, 4, 5]
Output: node 3, i.e. [3, 4, 5]

Input:  head = [1, 2, 3, 4, 5, 6]
Output: node 4, i.e. [4, 5, 6]
\`\`\``,
    starterCode: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def build_list(values):
    """Build a linked list from a list of values; returns the head (or None)."""
    head = None
    for value in reversed(values):
        head = ListNode(value, head)
    return head


def list_to_array(head):
    """Convert a linked list back to a plain list of values."""
    result = []
    while head is not None:
        result.append(head.val)
        head = head.next
    return result


def middle_node(head):
    # Your code here
    return None


if __name__ == "__main__":
    odd = build_list([1, 2, 3, 4, 5])
    print(list_to_array(middle_node(odd)))  # expected: [3, 4, 5]

    even = build_list([1, 2, 3, 4, 5, 6])
    print(list_to_array(middle_node(even)))  # expected: [4, 5, 6]
`,
      javascript: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head) {
  const result = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function middleNode(head) {
  // Your code here
  return null;
}

const odd = buildList([1, 2, 3, 4, 5]);
console.log(listToArray(middleNode(odd))); // expected: [3, 4, 5]

const even = buildList([1, 2, 3, 4, 5, 6]);
console.log(listToArray(middleNode(even))); // expected: [4, 5, 6]
`,
      typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values: number[]): ListNode | null {
  let head: ListNode | null = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head: ListNode | null): number[] {
  const result: number[] = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function middleNode(head: ListNode | null): ListNode | null {
  // Your code here
  return null;
}

const odd = buildList([1, 2, 3, 4, 5]);
console.log(listToArray(middleNode(odd))); // expected: [3, 4, 5]

const even = buildList([1, 2, 3, 4, 5, 6]);
console.log(listToArray(middleNode(even))); // expected: [4, 5, 6]
`,
    },
  },
  {
    id: "palindrome-linked-list",
    title: "Palindrome Linked List",
    difficulty: "Easy",
    prompt: `Given the head of a singly linked list, return \`true\` if the list reads the same forwards and backwards, and \`false\` otherwise.

**Example**

\`\`\`
Input:  head = [1, 2, 2, 1]
Output: true

Input:  head = [1, 2, 3]
Output: false
\`\`\``,
    starterCode: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def build_list(values):
    """Build a linked list from a list of values; returns the head (or None)."""
    head = None
    for value in reversed(values):
        head = ListNode(value, head)
    return head


def list_to_array(head):
    """Convert a linked list back to a plain list of values."""
    result = []
    while head is not None:
        result.append(head.val)
        head = head.next
    return result


def is_palindrome(head):
    # Your code here
    return None


if __name__ == "__main__":
    print(is_palindrome(build_list([1, 2, 2, 1])))  # expected: True
    print(is_palindrome(build_list([1, 2, 3])))  # expected: False
`,
      javascript: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head) {
  const result = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function isPalindrome(head) {
  // Your code here
  return null;
}

console.log(isPalindrome(buildList([1, 2, 2, 1]))); // expected: true
console.log(isPalindrome(buildList([1, 2, 3]))); // expected: false
`,
      typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values: number[]): ListNode | null {
  let head: ListNode | null = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head: ListNode | null): number[] {
  const result: number[] = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function isPalindrome(head: ListNode | null): boolean {
  // Your code here
  return false;
}

console.log(isPalindrome(buildList([1, 2, 2, 1]))); // expected: true
console.log(isPalindrome(buildList([1, 2, 3]))); // expected: false
`,
    },
  },
  {
    id: "remove-nth-node-from-end",
    title: "Remove Nth Node From End of List",
    difficulty: "Medium",
    prompt: `Given the head of a linked list, remove the \`n\`-th node from the end of the list and return the head.

**Example**

\`\`\`
Input:  head = [1, 2, 3, 4, 5], n = 2
Output: [1, 2, 3, 5]
\`\`\`

Follow-up: can you do it in one pass?`,
    starterCode: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def build_list(values):
    """Build a linked list from a list of values; returns the head (or None)."""
    head = None
    for value in reversed(values):
        head = ListNode(value, head)
    return head


def list_to_array(head):
    """Convert a linked list back to a plain list of values."""
    result = []
    while head is not None:
        result.append(head.val)
        head = head.next
    return result


def remove_nth_from_end(head, n):
    # Your code here
    return None


if __name__ == "__main__":
    head = build_list([1, 2, 3, 4, 5])
    print(list_to_array(remove_nth_from_end(head, 2)))  # expected: [1, 2, 3, 5]
`,
      javascript: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head) {
  const result = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function removeNthFromEnd(head, n) {
  // Your code here
  return null;
}

const head = buildList([1, 2, 3, 4, 5]);
console.log(listToArray(removeNthFromEnd(head, 2))); // expected: [1, 2, 3, 5]
`,
      typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values: number[]): ListNode | null {
  let head: ListNode | null = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head: ListNode | null): number[] {
  const result: number[] = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  // Your code here
  return null;
}

const head = buildList([1, 2, 3, 4, 5]);
console.log(listToArray(removeNthFromEnd(head, 2))); // expected: [1, 2, 3, 5]
`,
    },
  },
  {
    id: "reorder-list",
    title: "Reorder List",
    difficulty: "Medium",
    prompt: `Given the head of a singly linked list \`L0 → L1 → … → Ln-1 → Ln\`, reorder it in place to \`L0 → Ln → L1 → Ln-1 → L2 → …\`. You may not modify the node values; only the \`next\` pointers may change.

**Example**

\`\`\`
Input:  head = [1, 2, 3, 4]
Output: [1, 4, 2, 3]

Input:  head = [1, 2, 3, 4, 5]
Output: [1, 5, 2, 4, 3]
\`\`\``,
    starterCode: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def build_list(values):
    """Build a linked list from a list of values; returns the head (or None)."""
    head = None
    for value in reversed(values):
        head = ListNode(value, head)
    return head


def list_to_array(head):
    """Convert a linked list back to a plain list of values."""
    result = []
    while head is not None:
        result.append(head.val)
        head = head.next
    return result


def reorder_list(head):
    # Your code here (reorder in place, return None)
    return None


if __name__ == "__main__":
    head = build_list([1, 2, 3, 4])
    reorder_list(head)
    print(list_to_array(head))  # expected: [1, 4, 2, 3]

    head = build_list([1, 2, 3, 4, 5])
    reorder_list(head)
    print(list_to_array(head))  # expected: [1, 5, 2, 4, 3]
`,
      javascript: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head) {
  const result = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function reorderList(head) {
  // Your code here (reorder in place, return undefined)
}

let head = buildList([1, 2, 3, 4]);
reorderList(head);
console.log(listToArray(head)); // expected: [1, 4, 2, 3]

head = buildList([1, 2, 3, 4, 5]);
reorderList(head);
console.log(listToArray(head)); // expected: [1, 5, 2, 4, 3]
`,
      typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a linked list from an array of values; returns the head (or null).
function buildList(values: number[]): ListNode | null {
  let head: ListNode | null = null;
  for (let i = values.length - 1; i >= 0; i--) {
    head = new ListNode(values[i], head);
  }
  return head;
}

// Convert a linked list back to a plain array of values.
function listToArray(head: ListNode | null): number[] {
  const result: number[] = [];
  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function reorderList(head: ListNode | null): void {
  // Your code here (reorder in place, return undefined)
}

let head = buildList([1, 2, 3, 4]);
reorderList(head);
console.log(listToArray(head)); // expected: [1, 4, 2, 3]

head = buildList([1, 2, 3, 4, 5]);
reorderList(head);
console.log(listToArray(head)); // expected: [1, 5, 2, 4, 3]
`,
    },
  },
];
