import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
const code = ts.transpileModule(readFileSync('lib/server/business-upload-form.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInNewContext(code, { exports, Response, TransformStream, Number, Error });
const read = exports.readBusinessUploadForm;

test('Normal multipart photo upload parses without changing its bytes', async () => {
  const form = new FormData();
  form.set('file', new File(['photo-bytes'], 'photo.webp', { type: 'image/webp' }));
  const parsed = await read(new Request('https://example.test/upload', { method: 'POST', body: form }));
  assert.equal(parsed.get('file').type, 'image/webp');
  assert.equal(await parsed.get('file').text(), 'photo-bytes');
});
test('Oversized declared upload is rejected before reading the body', async () => {
  let touched = false;
  const request = { headers: new Headers({ 'content-type': 'multipart/form-data; boundary=x', 'content-length': String(10 * 1024 * 1024) }), body: { pipeThrough() { touched = true; throw new Error('body must not be read'); } } };
  await assert.rejects(read(request), /FILE_TOO_LARGE/);
  assert.equal(touched, false);
});
test('Actual multipart limit rejects oversized extra fields without a content-length header', async () => {
  const form = new FormData();
  form.set('file', new File(['small'], 'small.webp', { type: 'image/webp' }));
  form.set('extra', new Blob([new Uint8Array(10 * 1024 * 1024)]));
  const request = new Request('https://example.test/upload', { method: 'POST', body: form });
  assert.equal(request.headers.get('content-length'), null);
  await assert.rejects(read(request), /FILE_TOO_LARGE/);
});
test('Malformed and non-multipart bodies are rejected', async () => {
  for (const contentType of ['application/json', 'multipart/form-data; boundary=missing']) {
    await assert.rejects(read(new Request('https://example.test/upload', { method: 'POST', headers: { 'Content-Type': contentType }, body: 'invalid' })), /INVALID_FILE/);
  }
});
