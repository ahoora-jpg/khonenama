import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('Every server upload requests processing before storage, with no raw fallback', async () => {
  let captured;
  let fail = false;
  const exports = {};
  const code = ts.transpileModule(readFileSync('lib/server/imagekit.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, require: () => ({ env: { IMAGEKIT_PRIVATE_KEY: 'test-only' } }),
    FormData, File, btoa, TextEncoder, console,
    fetch: async (_url, options) => {
      captured = options.body;
      return new Response(JSON.stringify(fail ? { message: 'processing failed' } : { fileId: 'processed' }), { status: fail ? 400 : 200 });
    },
  });
  const upload = () => exports.uploadImageKitFile(new File(['input'], 'photo.jpg', { type: 'image/jpeg' }), { fileName: 'photo.jpg', folder: '/businesses/1' });
  assert.equal((await upload()).fileId, 'processed');
  const transformation = JSON.parse(captured.get('transformation'));
  assert.equal(transformation.pre, 'w-2560,h-2560,c-at_max,f-webp,q-90');
  fail = true;
  await assert.rejects(upload(), /IMAGEKIT_UPLOAD_FAILED/);
});

test('File verification uses the ImageKit details endpoint while deletion uses the asset endpoint', async () => {
  const exports = {};
  const calls = [];
  vm.runInNewContext(ts.transpileModule(readFileSync('lib/server/imagekit.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, require: () => ({ env: { IMAGEKIT_PRIVATE_KEY: 'test-only' } }), btoa,
    fetch: async (url, options) => {
      calls.push([url, options.method]);
      return new Response(JSON.stringify({ fileId: 'asset/id', fileType: 'image', mime: 'image/webp', size: 128, width: 100, height: 100 }), { status: 200 });
    },
  });
  const details = await exports.getImageKitFileDetails('asset/id');
  assert.equal(details.fileType, 'image');
  assert.equal(details.size, 128);
  await exports.deleteImageKitFile('asset/id');
  assert.deepEqual(calls, [['https://api.imagekit.io/v1/files/asset%2Fid/details', 'GET'], ['https://api.imagekit.io/v1/files/asset%2Fid', 'DELETE']]);
});
