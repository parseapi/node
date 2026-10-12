// Build first. Packed ESM/CJS consumers require no DOM, IndexedDB, eval or HTTP.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const root=fileURLToPath(new URL('..',import.meta.url)),consumer=mkdtempSync(join(tmpdir(),'parseapi-emoji-offline-'));
const fixture=JSON.parse(readFileSync(new URL('../test/fixtures/emoji-catalog.json',import.meta.url),'utf8'));
try{
 const [packed]=JSON.parse(execFileSync('npm',['pack','--ignore-scripts','--json','--cache',join(consumer,'cache'),'--pack-destination',consumer],{cwd:root,encoding:'utf8'}));
 const installed=join(consumer,'node_modules','@parseapi','sdk');mkdirSync(installed,{recursive:true});execFileSync('tar',['-xzf',join(consumer,packed.filename),'--strip-components=1','-C',installed]);
 const controls=`let fetchCalls=0;globalThis.fetch=()=>{fetchCalls++;throw Error('Unexpected HTTP');};for(const name of ['window','document','indexedDB','localStorage','sessionStorage'])Object.defineProperty(globalThis,name,{get(){throw Error('Unexpected '+name);},configurable:true});`;
 const body=`const local=new EmojiCatalog(${JSON.stringify(fixture)});if(local.lookup('❤').emoji!=='❤️'||local.parse('x ❤️ ❤️').emojis[0]?.positions.length!==2)throw Error('Offline inventory failed');if(fetchCalls)throw Error('Network used');console.log('packed offline consumer passed');`;
 writeFileSync(join(consumer,'esm.mjs'),controls+`const {EmojiCatalog}=await import('@parseapi/sdk/offline');`+body);
 writeFileSync(join(consumer,'commonjs.cjs'),controls+`const {EmojiCatalog}=require('@parseapi/sdk/offline');`+body);
 for(const file of ['esm.mjs','commonjs.cjs'])execFileSync(process.execPath,['--disallow-code-generation-from-strings',file],{cwd:consumer,encoding:'utf8'});
 writeFileSync(join(consumer,'offline.mts'),`import {EmojiCatalog,type EmojiCatalogData} from '@parseapi/sdk/offline';declare const data:EmojiCatalogData;const local=new EmojiCatalog(data);local.search('heart');local.convert(':heart:',{direction:'to_emoji',shortcodeSource:'cldr'});local.parse('❤️');`);
 execFileSync(join(root,'node_modules','.bin','tsc'),['--noEmit','--strict','--module','NodeNext','--target','ES2022','--lib','ES2022,ES2022.Intl','offline.mts'],{cwd:consumer,encoding:'utf8'});
 const bundles={};for(const [name,entry]of [['catalog',`export {EmojiCatalog} from ${JSON.stringify(join(root,'dist/offline.js'))};`],['offline_all',`export * from ${JSON.stringify(join(root,'dist/offline.js'))};`]]){
  const result=await build({stdin:{contents:entry,resolveDir:consumer,sourcefile:name+'.mjs'},bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true,treeShaking:true});const bytes=result.outputFiles[0].contents;
  if(/\beval\s*\(|new Function\s*\(|\bfetch\s*\(|\bindexedDB\b|\bdocument\b|\bwindow\b/.test(new TextDecoder().decode(bytes)))throw Error('Unexpected restricted dependency in '+name);
  bundles[name]={raw_bytes:bytes.length,gzip_level6_bytes:gzipSync(bytes,{level:6}).length,sha256:createHash('sha256').update(bytes).digest('hex')};
  if(process.argv[3])writeFileSync(join(process.argv[3],name+'.mjs'),bytes);
 }
 const receipt={generated_at:new Date().toISOString(),local_unpublished:true,package_version:JSON.parse(readFileSync(join(root,'package.json'))).version,packed_name:packed.filename,esm:true,commonjs:true,no_dom:true,no_indexeddb:true,no_storage:true,no_http:true,fetch_calls:0,node_disallow_code_generation_from_strings:true,typescript_without_dom_library:true,bundles,limitations:['This proves packaged headless operations and absence of unsafe-eval dependencies. Browser CSP response-header execution must be separately verified.','Bundles exclude the JSON catalog; headless functionality is not a complete picker UI.']};
 if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
}finally{rmSync(consumer,{recursive:true,force:true});}
