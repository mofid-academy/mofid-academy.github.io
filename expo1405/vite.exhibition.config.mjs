import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({
  plugins:[react()],
  define:{'process.env.NODE_ENV':'"production"'},
  resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
  build:{minify:true,outDir:'exhibition-dist',emptyOutDir:true,
    lib:{entry:'src/aurora-entry.tsx',formats:['es'],fileName:'aurora-v48',cssFileName:'aurora-v48'},
    rollupOptions:{output:{codeSplitting:false}}
  }
});
