import LRUCache from 'lru-native2';

export class Cache<V> {
  cache: LRUCache<V>;

  //180000
  constructor(maxAge = 180000) {
    this.cache = new LRUCache({ maxLoadFactor: 2, size: 500, maxAge });
  }

  get(key: string): V | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: V): void {
    this.cache.set(key, value);
  }
}
