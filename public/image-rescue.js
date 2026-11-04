(() => {
  const RETRY_DELAY = 10_000;
  const states = new WeakMap();

  function eligible(source) {
    try {
      const url = new URL(source, location.href);
      if (!["khonenama.ir", "www.khonenama.ir"].includes(url.hostname)) return null;
      if (!/^\/media\/businesses\/[1-9]\d*\/[a-f0-9-]{36}(?:-thumb)?\.webp$/.test(url.pathname)) return null;
      return url.pathname;
    } catch {
      return null;
    }
  }

  function retry(img, state) {
    if (states.get(img) !== state || !img.isConnected || state.attempts >= 1 ||
        (img.complete && img.naturalWidth > 0)) return;
    state.attempts++;
    const srcset = img.getAttribute("srcset");
    if (srcset) img.removeAttribute("srcset");
    const url = new URL(state.source, location.href);
    url.searchParams.set("__kh_retry", "1");
    img.src = url.pathname + url.search;
  }

  const intersection = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const img = entry.target;
      intersection.unobserve(img);
      const state = states.get(img);
      if (state) state.timer = setTimeout(() => retry(img, state), RETRY_DELAY);
    }
  }, { rootMargin: "300px" });

  function watch(img) {
    const source = img.getAttribute("src");
    const path = source && eligible(source);
    if (!path) return;
    const previous = states.get(img);
    if (previous?.path === path) return;
    if (previous?.timer) clearTimeout(previous.timer);
    const state = { source, path, attempts: 0, timer: null };
    states.set(img, state);
    img.addEventListener("error", () => retry(img, state), { once: true });
    intersection.observe(img);
  }

  function scan(root) {
    if (root instanceof HTMLImageElement) watch(root);
    root.querySelectorAll?.("img[src]").forEach(watch);
  }

  scan(document);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "attributes") watch(record.target);
      else record.addedNodes.forEach(node => { if (node.nodeType === 1) scan(node); });
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
})();
