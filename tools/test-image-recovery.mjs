import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const script = readFileSync("public/image-rescue.js", "utf8").replace(/\r\n/g, "\n");

test("the bundled inline payload is exactly the tested script and cannot terminate its HTML element", () => {
  const generated = readFileSync("lib/image-rescue-source.ts", "utf8");
  const payload = JSON.parse(generated.match(/export const imageRescueSource = ([\s\S]*);\s*$/)[1]);
  assert.equal(payload, script);
  assert.doesNotMatch(payload, /<\/script/i);
});

function fixture(source = "/media/businesses/12/11111111-1111-1111-1111-111111111111-thumb.webp") {
  const timers = [];
  let resolveDone;
  const done = new Promise(resolve => { resolveDone = resolve; });
  class Image {
    isConnected = true;
    complete = false;
    naturalWidth = 0;
    attrs = new Map([["src", source], ["srcset", source + " 1x"]]);
    getAttribute(name) { return this.attrs.get(name) || null; }
    removeAttribute(name) { this.attrs.delete(name); }
    setAttribute(name, value) { this.attrs.set(name, value); }
    addEventListener() {}
    set src(value) {
      this.attrs.set("src", value);
      if (value.includes("__kh_retry=1")) resolveDone();
    }
  }
  const image = new Image();
  vm.runInNewContext(script, {
    URL,
    HTMLImageElement: Image,
    location: { href: "https://khonenama.ir/" },
    document: { documentElement: {}, querySelectorAll: () => [image] },
    IntersectionObserver: class { constructor(cb) { this.cb = cb; } observe(target) { queueMicrotask(() => this.cb([{ isIntersecting: true, target }])); } unobserve() {} },
    MutationObserver: class { observe() {} },
    setTimeout: (fn, ms) => { timers.push(ms); return setTimeout(fn, 0); },
    clearTimeout,
    queueMicrotask,
    fetch: () => { throw Error("chunk requests must not be used"); },
  });
  return { done, image, source, timers };
}

test("a stalled business image gets exactly one direct retry with no chunk request", async () => {
  const f = fixture();
  await Promise.race([f.done, new Promise((_, reject) => setTimeout(() => reject(Error("direct retry did not finish")), 500))]);
  assert.match(f.image.getAttribute("src"), /__kh_retry=1$/);
  assert.equal(f.image.getAttribute("srcset"), null);
  assert.deepEqual(f.timers, [10_000]);
});

test("static CDN images are ignored", async () => {
  const f = fixture("/images/editorial/photo-1602612996819-3cd306f68b4e.webp");
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(f.image.getAttribute("src"), f.source);
  assert.deepEqual(f.timers, []);
});
