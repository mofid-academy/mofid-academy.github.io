import {build} from 'esbuild';
import {copyFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(root+'assets/licenses',{recursive:true});
await build({
  absWorkingDir:root,entryPoints:['tools/liquid-metal-entry.mjs'],
  outfile:'assets/liquid-metal.mjs',bundle:true,format:'esm',target:'es2020',
  minify:true,legalComments:'inline',
  banner:{js:'/* Paper Shaders 0.0.82, Copyright 2026 Paper. Apache-2.0. See licenses/paper-shaders-LICENSE.txt and paper-shaders-NOTICE.txt. */'}
});
for(const file of ['LICENSE','NOTICE'])await copyFile(root+'node_modules/@paper-design/shaders/'+file,root+'assets/licenses/paper-shaders-'+file+'.txt');
