export interface HLC {
  time: number;
  counter: number;
  node: string;
}
const MAX_COUNTER = 999999;
export function pack(clock: HLC): string {
  if (
    !Number.isSafeInteger(clock.time) ||
    clock.time < 0 ||
    clock.time > 253402300799999 ||
    !Number.isInteger(clock.counter) ||
    clock.counter < 0 ||
    clock.counter > MAX_COUNTER ||
    !/^[a-zA-Z0-9_-]+$/.test(clock.node)
  )
    throw new RangeError("Invalid hybrid logical clock");
  return `${new Date(clock.time).toISOString()}:${String(clock.counter).padStart(6, "0")}:${clock.node}`;
}
export function unpack(value: string): HLC {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z):(\d{6}):([a-zA-Z0-9_-]+)$/.exec(
    value,
  );
  if (!match) throw new Error("Malformed hybrid logical clock");
  const clock = { time: Date.parse(match[1]!), counter: Number(match[2]), node: match[3]! };
  if (pack(clock) !== value) throw new Error("Malformed hybrid logical clock");
  return clock;
}
export function compare(a: HLC | string, b: HLC | string): number {
  const left = typeof a === "string" ? unpack(a) : a;
  const right = typeof b === "string" ? unpack(b) : b;
  return Math.sign(
    left.time - right.time ||
      left.counter - right.counter ||
      (left.node < right.node ? -1 : left.node > right.node ? 1 : 0),
  );
}
function normalize(time: number, counter: number, node: string): HLC {
  const result =
    counter > MAX_COUNTER ? { time: time + 1, counter: 0, node } : { time, counter, node };
  pack(result);
  return result;
}
export function send(local: HLC, now = Date.now()): HLC {
  pack(local);
  const time = Math.max(local.time, now);
  return normalize(time, time === local.time ? local.counter + 1 : 0, local.node);
}
export function receive(local: HLC, remote: HLC, now = Date.now()): HLC {
  pack(local);
  pack(remote);
  const time = Math.max(local.time, remote.time, now);
  const counter =
    time === local.time && time === remote.time
      ? Math.max(local.counter, remote.counter) + 1
      : time === local.time
        ? local.counter + 1
        : time === remote.time
          ? remote.counter + 1
          : 0;
  return normalize(time, counter, local.node);
}
export function createClock(node: string, now = Date.now()) {
  let current: HLC = { time: now, counter: 0, node };
  pack(current);
  return {
    send: () => {
      current = send(current);
      return pack(current);
    },
    receive: (remote: string) => {
      current = receive(current, unpack(remote));
      return pack(current);
    },
  };
}
