/** Generic array-based binary min-heap. */

// PUBLIC INTERFACE

export class MinHeap {
  constructor(isLess) {
    this._items = [];
    this._isLess = isLess;
  }

  get size() {
    return this._items.length;
  }

  push(entry) {
    this._items.push(entry);
    this._siftUp(this._items.length - 1);
  }

  pop() {
    if (this._items.length === 0) {
      return undefined;
    }
    const top = this._items[0];
    const last = this._items.pop();
    if (this._items.length > 0) {
      this._items[0] = last;
      this._siftDown(0);
    }
    return top;
  }

  _siftUp(index) {
    let childIndex = index;
    while (childIndex > 0) {
      const parentIndex = Math.floor((childIndex - 1) / 2);
      if (!this._isLess(this._items[childIndex], this._items[parentIndex])) {
        break;
      }
      this._swap(childIndex, parentIndex);
      childIndex = parentIndex;
    }
  }

  _siftDown(index) {
    let parentIndex = index;
    for (;;) {
      const leftIndex = 2 * parentIndex + 1;
      const rightIndex = 2 * parentIndex + 2;
      let smallestIndex = parentIndex;

      if (leftIndex < this._items.length && this._isLess(this._items[leftIndex], this._items[smallestIndex])) {
        smallestIndex = leftIndex;
      }
      if (rightIndex < this._items.length && this._isLess(this._items[rightIndex], this._items[smallestIndex])) {
        smallestIndex = rightIndex;
      }
      if (smallestIndex === parentIndex) {
        break;
      }
      this._swap(parentIndex, smallestIndex);
      parentIndex = smallestIndex;
    }
  }

  _swap(i, j) {
    [this._items[i], this._items[j]] = [this._items[j], this._items[i]];
  }
}
