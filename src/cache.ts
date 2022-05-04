import LRUCache from 'lru-cache';

export class Cache<V> {
  cache: LRUCache<string, V>;

  //180000
  constructor(maxAge = 180000) {
    this.cache = new LRUCache({
      max: 500,
      ttl: maxAge,
      updateAgeOnGet: true,
    });
  }

  get(key: string): V | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: V): void {
    this.cache.set(key, value);
  }
}
