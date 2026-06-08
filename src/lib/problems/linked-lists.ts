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
    },
  },
];
