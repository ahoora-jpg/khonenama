import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const src=await readFile(new URL('../lib/service-area.ts',import.meta.url),'utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {normalizeServiceAreas,parseServiceArea}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('Whole Karaj replaces its neighborhoods while preserving other cities',()=>assert.deepEqual(normalizeServiceAreas(['عظیمیه','کل کرج','جهانشهر','تهران / سعادت‌آباد'],'کرج'),['تمام کرج','تهران / سعادت‌آباد']));
test('Whole cities recognize both prefixes and city-prefixed database values',()=>assert.deepEqual(normalizeServiceAreas(['کرج / عظیمیه','کرج / کل کرج','تمام تهران','تهران / ونک'],'کرج'),['تمام کرج','تمام تهران']));
test('Neighborhood selections remain when no whole city is chosen',()=>assert.deepEqual(normalizeServiceAreas(['عظیمیه','تهران / ونک'],'کرج'),['عظیمیه','تهران / ونک']));
test('Whole city parser preserves the correct city',()=>assert.deepEqual(parseServiceArea('کل کرج','تهران'),{city:'کرج',area:'تمام کرج'}));

