/**
 * Disjoint-set union (union-find) over vertices, tracking special-subset
 * membership per vertex.
 */
import { vertexKey } from "./vertices.js";

// PUBLIC INTERFACE

export class DSU {
  constructor(allVertices, specialSubset) {
    this._specialKeys = new Set(specialSubset.map(vertexKey));

    this._representative = new Map();
    this._parent = new Map();
    this._size = new Map();

    for (const vertex of allVertices) {
      const key = vertexKey(vertex);
      this._representative.set(key, vertex);
      this._parent.set(key, key);
      this._size.set(key, 1);
    }

    this._componentCount = allVertices.length;
  }

  find(vertex) {
    const startKey = vertexKey(vertex);
    let rootKey = startKey;
    while (this._parent.get(rootKey) !== rootKey) {
      rootKey = this._parent.get(rootKey);
    }
    this._compressPath(startKey, rootKey);
    return this._representative.get(rootKey);
  }

  _compressPath(startKey, rootKey) {
    let currentKey = startKey;
    while (this._parent.get(currentKey) !== rootKey) {
      const nextKey = this._parent.get(currentKey);
      this._parent.set(currentKey, rootKey);
      currentKey = nextKey;
    }
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    const rootAKey = vertexKey(rootA);
    const rootBKey = vertexKey(rootB);
    if (rootAKey === rootBKey) {
      return rootA;
    }

    const [smallerKey, largerKey] =
      this._size.get(rootAKey) <= this._size.get(rootBKey) ? [rootAKey, rootBKey] : [rootBKey, rootAKey];

    this._parent.set(smallerKey, largerKey);
    this._size.set(largerKey, this._size.get(largerKey) + this._size.get(smallerKey));
    this._size.delete(smallerKey);
    this._componentCount -= 1;
    return this._representative.get(largerKey);
  }

  componentSize(vertex) {
    return this._size.get(vertexKey(this.find(vertex))) ?? 0;
  }

  componentCount() {
    return this._componentCount;
  }

  isSpecial(vertex) {
    return this._specialKeys.has(vertexKey(vertex));
  }
}
