/**
 * Redis client stub. Wire up `ioredis` in Phase 3 when BullMQ queues
 * (reminders, WhatsApp, morning digest) come online.
 */
export const redis = {
  async get(_key: string): Promise<string | null> {
    return null;
  },
  async set(_key: string, _value: string, _mode?: string, _ttl?: number) {
    return "OK";
  },
  async del(_key: string) {
    return 0;
  },
};
