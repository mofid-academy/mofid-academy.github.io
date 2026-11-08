import {copyFile} from 'node:fs/promises';
await copyFile('ui-dist/aurora.js','assets/aurora.js');
await copyFile('ui-dist/aurora.css','assets/aurora.css');
