/**
 * Background job queue stub. Phase 3 replaces this with BullMQ workers:
 *  - visit reminders (1 day + 2 hours before)
 *  - WhatsApp / email sends
 *  - 9 AM advisor morning digest
 *  - 48h overdue-task escalation
 */
type JobHandler = (payload: unknown) => Promise<void>;

const handlers = new Map<string, JobHandler>();

export function registerJob(name: string, handler: JobHandler) {
  handlers.set(name, handler);
}

export async function enqueue(name: string, payload: unknown) {
  // Dev fallback: run inline. Production: push to BullMQ.
  const handler = handlers.get(name);
  if (handler) await handler(payload);
  else console.log(`[queue] (noop) ${name}`, payload);
}
