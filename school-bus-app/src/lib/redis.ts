// Basic mock Redis client since Redis isn't deployed yet.
// In a real environment, replace this with ioredis or upstash/redis.

class MockRedis {
  private store: Map<string, string> = new Map();

  async set(key: string, value: string, ex?: 'EX', time?: number) {
    this.store.set(key, value);
    if (ex === 'EX' && time) {
      setTimeout(() => {
        this.store.delete(key);
      }, time * 1000);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async del(key: string) {
    this.store.delete(key);
  }
}

export const redis = new MockRedis();
