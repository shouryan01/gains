/** RFC 9562 UUIDv7 with a monotonic 12-bit sequence, including clock rollback. */
let lastTime = -1;
let sequence = 0;
export function uuidv7(now = Date.now()): string {
  if (!Number.isSafeInteger(now) || now < 0 || now > 0xffffffffffff)
    throw new RangeError("Invalid UUID timestamp");
  let time = Math.max(now, lastTime);
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  sequence = time === lastTime ? sequence + 1 : ((bytes[6]! << 8) | bytes[7]!) & 0xfff;
  if (sequence > 0xfff) {
    time += 1;
    sequence = 0;
  }
  lastTime = time;
  let stamp = time;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = stamp % 256;
    stamp = Math.floor(stamp / 256);
  }
  bytes[6] = 0x70 | (sequence >> 8);
  bytes[7] = sequence & 0xff;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
