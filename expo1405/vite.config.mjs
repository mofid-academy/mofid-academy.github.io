import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({plugins:[react()],define:{'process.env.NODE_ENV':'"production"'},resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},build:{minify:true,outDir:'ui-dist',emptyOutDir:true,lib:{entry:'src/aurora-entry.tsx',formats:['es'],fileName:()=> 'aurora.js',cssFileName:'aurora'},rollupOptions:{output:{assetFileNames:'[name][extname]'}}}});
