export const MAX_VIDEO_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 20;
export const VIDEO_LIMITS: Record<string, number> = { free: 0, pro: 2, premium: 5 };

// Parse the ISO BMFF movie header rather than trusting client-supplied duration.
export function mp4Duration(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset: number) => String.fromCharCode(...bytes.slice(offset, offset + 4));
  let duration = 0, movie = false, data = false, format = false, videoTrack = false;
  function walk(start: number, end: number, depth: number) {
    if (depth > 6) throw new Error("INVALID_VIDEO");
    for (let pos = start; pos < end;) {
      if (pos + 8 > end) throw new Error("INVALID_VIDEO");
      let size = view.getUint32(pos), header = 8;
      const type = text(pos + 4);
      if (size === 1) {
        if (pos + 16 > end) throw new Error("INVALID_VIDEO");
        const large = view.getBigUint64(pos + 8);
        if (large > BigInt(bytes.length)) throw new Error("INVALID_VIDEO");
        size = Number(large); header = 16;
      } else if (size === 0) size = end - pos;
      if (size < header || pos + size > end) throw new Error("INVALID_VIDEO");
      const payload = pos + header;
      if (type === "ftyp") format = true;
      if (type === "mdat" && size > header) data = true;
      if (type === "moov") movie = true;
      if (["moov", "trak", "mdia"].includes(type)) walk(payload, pos + size, depth + 1);
      if (type === "hdlr" && payload + 12 <= pos + size && text(payload + 8) === "vide") videoTrack = true;
      if (type === "mvhd" || type === "mdhd") {
        const version = bytes[payload];
        if (version !== 0 && version !== 1) throw new Error("INVALID_VIDEO");
        const scaleOffset = payload + (version === 1 ? 20 : 12);
        if (scaleOffset + (version === 1 ? 12 : 8) > pos + size) throw new Error("INVALID_VIDEO");
        const scale = view.getUint32(scaleOffset);
        const ticks = version === 1 ? Number(view.getBigUint64(scaleOffset + 4)) : view.getUint32(scaleOffset + 4);
        if (!scale) throw new Error("INVALID_VIDEO");
        duration = Math.max(duration, ticks / scale);
      }
      pos += size;
    }
  }
  walk(0, bytes.length, 0);
  if (!movie || !data || !format || !videoTrack || !Number.isFinite(duration) || duration <= 0) throw new Error("INVALID_VIDEO");
  if (duration > MAX_VIDEO_SECONDS) throw new Error("VIDEO_TOO_LONG");
  return duration;
}
