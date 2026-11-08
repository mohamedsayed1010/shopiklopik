import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  HUB_EVENTS,
  MAX_RECONNECT_DELAY,
  createNotificationsLifecycle,
  reconnectDelay,
  reconnectPolicy,
} from "../notificationsLifecycle.js";

/* A stand-in for a SignalR HubConnection: records registrations and lets the
   test fire server events and connection-state changes. */
function fakeHub({ failStarts = 0 } = {}) {
  const handlers = new Map();

  const hub = {
    state: "Disconnected",
    starts: 0,
    stops: 0,
    failStarts,
    registrations: [],
    callbacks: { close: [], reconnecting: [], reconnected: [] },
    on(event, handler) {
      hub.registrations.push(event);

      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
    },
    off(event) {
      handlers.delete(event);
    },
    onclose(cb) {
      hub.callbacks.close.push(cb);
    },
    onreconnecting(cb) {
      hub.callbacks.reconnecting.push(cb);
    },
    onreconnected(cb) {
      hub.callbacks.reconnected.push(cb);
    },
    async start() {
      hub.starts += 1;

      if (hub.failStarts > 0) {
        hub.failStarts -= 1;

        throw new Error("negotiate failed");
      }

      hub.state = "Connected";
    },
    async stop() {
      hub.stops += 1;

      hub.state = "Disconnected";
    },
    emit(event, payload) {
      (handlers.get(event) ?? []).forEach((handler) => handler(payload));
    },
    handlerCount(event) {
      return (handlers.get(event) ?? []).length;
    },
    /** SignalR gave up / the server closed the socket. */
    close() {
      hub.state = "Disconnected";

      hub.callbacks.close.forEach((cb) => cb(new Error("closed")));
    },
    reconnecting() {
      hub.state = "Reconnecting";

      hub.callbacks.reconnecting.forEach((cb) => cb());
    },
    reconnected() {
      hub.state = "Connected";

      hub.callbacks.reconnected.forEach((cb) => cb());
    },
  };

  return hub;
}

function fakeTimers() {
  let next = 1;

  const pending = new Map();

  return {
    setTimeout(fn, delay) {
      const id = next++;

      pending.set(id, { fn, delay });

      return id;
    },
    clearTimeout(id) {
      pending.delete(id);
    },
    get delays() {
      return [...pending.values()].map((entry) => entry.delay);
    },
    async runAll() {
      const entries = [...pending.entries()];

      pending.clear();

      for (const [, entry] of entries) await entry.fn();

      await flush();
    },
  };
}

function fakeTarget() {
  const listeners = new Map();

  return {
    visibilityState: "visible",
    addEventListener(type, fn) {
      listeners.set(type, [...(listeners.get(type) ?? []), fn]);
    },
    removeEventListener(type, fn) {
      listeners.set(type, (listeners.get(type) ?? []).filter((entry) => entry !== fn));
    },
    fire(type) {
      (listeners.get(type) ?? []).forEach((fn) => fn());
    },
    count(type) {
      return (listeners.get(type) ?? []).length;
    },
  };
}

/* Lets every pending promise continuation run (a macrotask turn). */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup({ failStarts = 0 } = {}) {
  const hub = fakeHub({ failStarts });

  const timers = fakeTimers();

  const win = fakeTarget();

  const doc = fakeTarget();

  const received = [];

  const counts = [];

  let resyncs = 0;

  let created = 0;

  const lifecycle = createNotificationsLifecycle({
    createConnection: async () => {
      created += 1;

      return hub;
    },
    onNotification: (notification) => received.push(notification.id),
    onUnreadCount: (count) => counts.push(count),
    onResync: () => {
      resyncs += 1;
    },
    timers,
    windowTarget: win,
    documentTarget: doc,
  });

  return {
    hub,
    timers,
    win,
    doc,
    lifecycle,
    received,
    counts,
    get resyncs() {
      return resyncs;
    },
    get created() {
      return created;
    },
  };
}

describe("reconnect policy", () => {
  it("keeps the quick first steps and then never gives up", () => {
    assert.deepEqual([0, 1, 2, 3, 4].map(reconnectDelay), [0, 2000, 5000, 10000, 30000]);

    for (const count of [5, 6, 50, 5000]) {
      assert.equal(reconnectDelay(count), MAX_RECONNECT_DELAY);
      assert.notEqual(reconnectPolicy.nextRetryDelayInMilliseconds({ previousRetryCount: count }), null);
    }
  });
});

describe("notifications connection lifecycle", () => {
  it("connects once and registers each handler exactly once", async () => {
    const t = setup();

    await t.lifecycle.start();

    assert.equal(t.created, 1);
    assert.equal(t.hub.state, "Connected");
    assert.equal(t.hub.handlerCount(HUB_EVENTS.received), 1);
    assert.equal(t.hub.handlerCount(HUB_EVENTS.unreadCountChanged), 1);
    assert.equal(t.resyncs, 0, "the first connect needs no re-read");
  });

  it("restarts by itself after SignalR gives up — no page reload", async () => {
    const t = setup();

    await t.lifecycle.start();

    t.hub.close();

    assert.deepEqual(t.timers.delays, [0], "a restart is scheduled");

    await t.timers.runAll();

    assert.equal(t.hub.state, "Connected");
    assert.equal(t.hub.starts, 2);
    assert.equal(t.created, 1, "the same connection is restarted");
    assert.equal(t.hub.handlerCount(HUB_EVENTS.received), 1, "no duplicate subscription after a restart");
    assert.equal(t.resyncs, 1, "missed pushes are re-read once");
  });

  it("keeps retrying with back-off while the server is unreachable", async () => {
    const t = setup({ failStarts: 7 });

    await t.lifecycle.start();

    const delays = [];

    for (let i = 0; i < 7; i += 1) {
      delays.push(...t.timers.delays);

      await t.timers.runAll();
    }

    assert.deepEqual(delays, [0, 2000, 5000, 10000, 30000, 60000, 60000]);
    assert.equal(t.hub.state, "Connected", "the eighth try succeeds");
    assert.equal(t.resyncs, 1);
  });

  it("resets the back-off after a successful connect", async () => {
    const t = setup({ failStarts: 2 });

    await t.lifecycle.start();
    await t.timers.runAll();
    await t.timers.runAll();

    assert.equal(t.hub.state, "Connected");
    assert.equal(t.lifecycle.state.attempts, 0);

    t.hub.close();

    assert.deepEqual(t.timers.delays, [0]);
  });

  it("SignalR's own reconnect re-reads once and resets the back-off", async () => {
    const t = setup();

    await t.lifecycle.start();

    t.hub.reconnecting();
    t.hub.reconnected();

    assert.equal(t.resyncs, 1);
    assert.equal(t.lifecycle.state.attempts, 0);
  });

  it("coming back online retries at once instead of waiting out the back-off", async () => {
    const t = setup({ failStarts: 6 });

    await t.lifecycle.start();

    for (let i = 0; i < 5; i += 1) await t.timers.runAll();

    assert.deepEqual(t.timers.delays, [60000]);

    t.hub.failStarts = 0;

    t.win.fire("online");

    await flush();

    assert.equal(t.hub.state, "Connected");
    assert.deepEqual(t.timers.delays, [], "the pending long wait is cancelled");
  });

  it("returning to the tab retries a dead socket, and ignores a live one", async () => {
    const t = setup();

    await t.lifecycle.start();

    t.doc.fire("visibilitychange");

    await flush();

    assert.equal(t.hub.starts, 1, "a connected socket is left alone");

    t.hub.close();

    t.doc.fire("visibilitychange");

    await flush();

    assert.equal(t.hub.state, "Connected");
    assert.equal(t.hub.starts, 2);
  });

  it("a notification delivered twice is handled once", async () => {
    const t = setup();

    await t.lifecycle.start();

    t.hub.emit(HUB_EVENTS.received, { id: "n1" });
    t.hub.emit(HUB_EVENTS.received, { id: "n1" });
    t.hub.emit(HUB_EVENTS.received, { id: "n2" });

    assert.deepEqual(t.received, ["n1", "n2"]);
  });

  it("a restart does not replay or double-deliver", async () => {
    const t = setup();

    await t.lifecycle.start();

    t.hub.emit(HUB_EVENTS.received, { id: "n1" });

    t.hub.close();
    await t.timers.runAll();

    t.hub.emit(HUB_EVENTS.received, { id: "n1" });
    t.hub.emit(HUB_EVENTS.received, { id: "n3" });

    assert.deepEqual(t.received, ["n1", "n3"]);
  });

  it("passes the server's unread count through, and ignores non-numbers", async () => {
    const t = setup();

    await t.lifecycle.start();

    t.hub.emit(HUB_EVENTS.unreadCountChanged, 7);
    t.hub.emit(HUB_EVENTS.unreadCountChanged, "7");

    assert.deepEqual(t.counts, [7]);
  });

  it("disposing stops the socket, removes every listener and cancels retries", async () => {
    const t = setup();

    await t.lifecycle.start();

    t.hub.close();

    assert.equal(t.timers.delays.length, 1);

    t.lifecycle.dispose();

    assert.deepEqual(t.timers.delays, []);
    assert.equal(t.win.count("online"), 0);
    assert.equal(t.doc.count("visibilitychange"), 0);
    assert.equal(t.hub.handlerCount(HUB_EVENTS.received), 0);
    assert.equal(t.hub.stops, 1);

    t.hub.close();

    assert.deepEqual(t.timers.delays, [], "a close after disposal schedules nothing");
  });

  it("unmounting while the connection is still being created never starts it (Strict Mode)", async () => {
    const hub = fakeHub();

    let release;

    const gate = new Promise((resolve) => {
      release = resolve;
    });

    const lifecycle = createNotificationsLifecycle({
      createConnection: async () => {
        await gate;

        return hub;
      },
      timers: fakeTimers(),
      windowTarget: fakeTarget(),
      documentTarget: fakeTarget(),
    });

    const starting = lifecycle.start();

    lifecycle.dispose();

    release();

    await starting;

    assert.equal(hub.starts, 0);
    assert.equal(hub.registrations.length, 0);
  });

  it("concurrent start calls share one attempt", async () => {
    const t = setup();

    await Promise.all([t.lifecycle.start(), t.lifecycle.start(), t.lifecycle.retryNow()]);

    assert.equal(t.created, 1);
    assert.equal(t.hub.starts, 1);
  });
});
