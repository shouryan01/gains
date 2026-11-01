import { describe, expect, it } from "vitest";
import { compare, pack, unpack, receive, send, uuidv7 } from "../index";
describe("hybrid logical clocks", () => {
  const clock = { time: 1720000000000, counter: 7, node: "device-a" };
  it("roundtrips sortable timestamps", () => {
    expect(unpack(pack(clock))).toEqual(clock);
    const next = send(clock, clock.time);
    expect(compare(clock, next)).toBe(-1);
    expect(pack(clock) < pack(next)).toBe(true);
  });
  it("survives a backwards wall clock", () =>
    expect(send(clock, 1)).toEqual({ ...clock, counter: 8 }));
  it("merges equal, older, newer and wall-clock timestamps", () => {
    expect(receive(clock, { ...clock, counter: 12, node: "b" }, 1).counter).toBe(13);
    expect(receive(clock, { ...clock, time: 1 }, 1).counter).toBe(8);
    expect(receive(clock, { ...clock, time: clock.time + 1 }, 1).counter).toBe(8);
    expect(receive(clock, clock, clock.time + 2).counter).toBe(0);
    expect(compare({ ...clock, node: "a" }, { ...clock, node: "b" })).toBe(-1);
  });
  it("carries counter overflow into physical time", () =>
    expect(send({ ...clock, counter: 999999 }, 1)).toEqual({
      ...clock,
      time: clock.time + 1,
      counter: 0,
    }));
  it("rejects malformed clocks", () => {
    expect(() => unpack("invalid")).toThrow();
    expect(() => pack({ ...clock, counter: -1 })).toThrow();
    expect(() => unpack("2024-02-31T00:00:00.000Z:000000:a")).toThrow();
  });
});
it("generates unique, monotonic RFC UUIDv7 IDs through rollback and overflow", () => {
  const ids = Array.from({ length: 5000 }, (_, i) => uuidv7(1720000000000 - i));
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids).toEqual([...ids].sort());
  expect(ids[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
