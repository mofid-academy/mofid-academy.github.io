import {createApi,createPostgresStore,createHttpHandler} from './core.mjs';

const config={
  siteOrigin:Deno.env.get('ZR_SITE_ORIGIN')||'https://mofid-academy.github.io',
  siteUrl:Deno.env.get('ZR_SITE_URL')||'https://mofid-academy.github.io/zero-repetition/',
  adminUsername:Deno.env.get('ZR_ADMIN_USERNAME')||'m.mirsheri',
  adminKeyHash:Deno.env.get('ZR_ADMIN_KEY_HASH'),signingKey:Deno.env.get('ZR_SIGNING_KEY'),
  sheetsWebhook:Deno.env.get('ZR_SHEETS_WEBHOOK')||'',sheetsSyncKey:Deno.env.get('ZR_SHEETS_SYNC_KEY')||''
};
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;
const db=createPostgresStore({url:Deno.env.get('SUPABASE_URL'),key});
const handler=createHttpHandler(createApi({db,config}),config.siteOrigin);
Deno.serve(handler);
