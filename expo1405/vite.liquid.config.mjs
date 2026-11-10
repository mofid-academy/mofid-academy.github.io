import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},build:{minify:true,outDir:'liquid-dist',emptyOutDir:true,lib:{entry:'src/liquid-metal-entry.ts',formats:['es'],fileName:()=> 'liquid-metal-v22.js',cssFileName:'liquid-metal-v22'},rollupOptions:{output:{chunkFileNames:'liquid-metal-[name]-[hash].js',assetFileNames:'[name][extname]'}}}});
