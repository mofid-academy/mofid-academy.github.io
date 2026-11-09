import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({plugins:[react()],define:{'process.env.NODE_ENV':'"production"'},resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},build:{minify:true,outDir:'ui-dist',emptyOutDir:true,lib:{entry:{aurora:'src/aurora-entry.tsx','qr-card':'src/qr-entry.tsx'},formats:['es'],fileName:(_format,name)=> name+'.js',cssFileName:'aurora'},rollupOptions:{output:{assetFileNames:'[name][extname]'}}}});
