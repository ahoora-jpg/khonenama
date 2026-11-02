// A cheap preflight only; the existing provider must still decode and re-encode.
// Do not treat a matching signature as proof that a file is safe to publish.
export function imageSignatureMatches(bytes: Uint8Array, mime: string): boolean {
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length < 12) return false;
  switch (mime) {
    case "image/jpeg": return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png": return [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v);
    case "image/gif": return ["GIF87a", "GIF89a"].includes(text(0,6));
    case "image/webp": return text(0,4) === "RIFF" && text(8,12) === "WEBP";
    case "image/avif": {
      if (text(4,8) !== "ftyp" || bytes.length < 16) return false;
      const size = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
      if (size < 16 || size > bytes.length || size % 4 !== 0) return false;
      if (["avif", "avis"].includes(text(8,12))) return true;
      for (let i=16; i+4<=size; i+=4) if (["avif", "avis"].includes(text(i,i+4))) return true;
      return false;
    }
    default: return false;
  }
}
