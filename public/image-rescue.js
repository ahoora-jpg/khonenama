(() => {
  const CHUNK_SIZE = 48000;
  const MAX_SIZE = 8 * 1024 * 1024;
  const EMPTY = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  const states = new WeakMap();
  const queue = [];
  let active = 0;

  function eligible(source) {
    try {
      const url = new URL(source, location.href);
      if (!["khonenama.ir", "www.khonenama.ir"].includes(url.hostname)) return null;
      if (!/^\/images\/[a-z0-9/_-]+\.webp$/.test(url.pathname) &&
          !/^\/media\/businesses\/[1-9]\d*\/[a-f0-9-]{36}(?:-thumb)?\.webp$/.test(url.pathname)) return null;
      return url.pathname;
    } catch {
      return null;
    }
  }

  async function chunk(path, index) {
    const url = `/api/image-chunk?path=${encodeURIComponent(path)}&index=${index}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(7000), credentials: "omit" });
        if ([400, 403, 404, 413, 416].includes(response.status)) throw Object.assign(Error("unavailable"), { permanent: true });
        if (!response.ok || response.headers.get("X-Chunk-Index") !== String(index)) throw Error("chunk failed");
        const total = Number(response.headers.get("X-Image-Length"));
        if (!Number.isSafeInteger(total) || total < 1 || total > MAX_SIZE) throw Error("invalid length");
        const bytes = await response.arrayBuffer();
        const expected = Math.min(CHUNK_SIZE, total - index * CHUNK_SIZE);
        if (expected < 1 || bytes.byteLength !== expected) throw Error("incomplete chunk");
        return { total, bytes };
      } catch (error) {
        if (error.permanent || attempt === 2) throw error;
        await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }

  async function restoreImage(img, state) {
    if (states.get(img) !== state || !img.isConnected || (img.complete && img.naturalWidth > 0) || img.getAttribute("src") !== state.source) return;
    state.attempts++;
    const srcset = img.getAttribute("srcset");
    img.removeAttribute("srcset");
    img.src = EMPTY; // Cancel the stalled full-size transfer.
    try {
      const first = await chunk(state.path, 0);
      const count = Math.ceil(first.total / CHUNK_SIZE);
      const parts = new Array(count);
      parts[0] = first.bytes;
      for (let start = 1; start < count; start += 2) {
        const indices = Array.from({ length: Math.min(2, count - start) }, (_, i) => start + i);
        const fetched = await Promise.all(indices.map(index => chunk(state.path, index)));
        fetched.forEach((part, i) => {
          if (part.total !== first.total) throw Error("image changed");
          parts[indices[i]] = part.bytes;
        });
      }
      if (states.get(img) !== state || !img.isConnected || img.getAttribute("src") !== EMPTY) return;
      img.removeAttribute("srcset");
      const objectUrl = URL.createObjectURL(new Blob(parts, { type: "image/webp" }));
      img.src = objectUrl;
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch {
      if (states.get(img) === state && img.isConnected && img.getAttribute("src") === EMPTY) {
        if (srcset) img.setAttribute("srcset", srcset);
        img.src = state.source;
        if (state.attempts < 2) state.timer = setTimeout(() => enqueue(img, state), 1500);
      }
    }
  }

  function enqueue(img, state) {
    if (state.queued || state.attempts >= 2 || states.get(img) !== state || !img.isConnected ||
        img.getAttribute("src") !== state.source || (img.complete && img.naturalWidth > 0)) return;
    state.queued = true;
    queue.push([img, state]);
    drain();
  }

  function drain() {
    while (active < 2 && queue.length) {
      const [img, state] = queue.shift();
      active++;
      restoreImage(img, state).finally(() => { state.queued = false; active--; drain(); });
    }
  }

  const intersection = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const img = entry.target;
      intersection.unobserve(img);
      const state = states.get(img);
      if (!state) continue;
      state.timer = setTimeout(() => enqueue(img, state), 1500);
    }
  }, { rootMargin: "300px" });

  function watch(img) {
    const source = img.getAttribute("src");
    const path = source && eligible(source);
    if (!path) return;
    const previous = states.get(img);
    if (previous?.source === source) return;
    if (previous?.timer) clearTimeout(previous.timer);
    states.set(img, { source, path, timer: null, attempts: 0, queued: false });
    intersection.observe(img);
  }

  function scan(root) {
    if (root instanceof HTMLImageElement) watch(root);
    root.querySelectorAll?.("img[src]").forEach(watch);
  }

  function start() {
    scan(document);
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "attributes") watch(record.target);
        else record.addedNodes.forEach(node => { if (node.nodeType === 1) scan(node); });
      }
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  }

  // The deferred script can run before DOMContentLoaded; other stalled modules must not block recovery.
  start();
})();
