import {cp} from 'node:fs/promises';
await cp('ui-dist','assets',{recursive:true});
