// Cap the entire multipart request, including untrusted extra fields, before parsing.
const MAX_REQUEST_BYTES = 9 * 1024 * 1024;

export async function readBusinessUploadForm(request: Request, maxBytes = MAX_REQUEST_BYTES): Promise<FormData> {
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().startsWith("multipart/form-data;") || !request.body) throw new Error("INVALID_FILE");
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > maxBytes) throw new Error("FILE_TOO_LARGE");
  let received = 0;
  let exceeded = false;
  const bounded = request.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      received += chunk.byteLength;
      if (received > maxBytes) {
        exceeded = true;
        throw new Error("FILE_TOO_LARGE");
      }
      controller.enqueue(chunk);
    },
  }));
  try {
    return await new Response(bounded, { headers: { "Content-Type": type } }).formData();
  } catch {
    throw new Error(exceeded ? "FILE_TOO_LARGE" : "INVALID_FILE");
  }
}
