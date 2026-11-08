import {makeHandler} from './core.mjs';
const url=Deno.env.get('SUPABASE_URL')!;
const key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
Deno.serve(makeHandler({url,key}));
