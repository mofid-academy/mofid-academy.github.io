import {cp} from 'node:fs/promises';
await cp('liquid-dist','assets',{recursive:true});
await cp('node_modules/@paper-design/shaders/LICENSE','assets/paper-shaders-LICENSE.txt');
await cp('node_modules/@paper-design/shaders/NOTICE','assets/paper-shaders-NOTICE.txt');
