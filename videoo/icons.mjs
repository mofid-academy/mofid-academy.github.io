const paths={
 play:'<path d="m9 5 12 7-12 7V5Z"/>',
 video:'<rect x="3" y="4" width="18" height="16" rx="4"/><path d="m10 9 5 3-5 3V9Z"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
 book:'<path d="M12 5C8 2 5 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-3-1-6-2-10 1Zm0 0v16M6 8h2m-2 5h2m8-5h2m-2 5h2"/>',
 settings:'<path d="m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-1 3 2 3-2 3 1 2-3-1-3 2-2-2-3-3-1-1-3H9Z"/><circle cx="12" cy="11" r="3"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 left:'<path d="M20 12H4m6-6-6 6 6 6"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 circle:'<circle cx="12" cy="12" r="8"/>',
 checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M3 16v5h18v-5"/>',
 cloud:'<path d="M6 18a5 5 0 1 1 0-10 6 6 0 0 1 12-1 5.5 5.5 0 0 1 1 11H6Z"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
 logout:'<path d="M10 4H4v16h6m4-4 4-4-4-4m-5 4h13"/>',
 up:'<path d="m6 15 6-6 6 6"/>',
 down:'<path d="m6 9 6 6 6-6"/>',
 trash:'<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
 edit:'<path d="m14 5 5 5M4 20l5-1L21 7l-5-5L4 14v6Z"/>',
 save:'<path d="M4 3h13l4 4v14H3V3h1Zm3 0v7h9V3M7 21v-7h10v7"/>',
 excel:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m7 8 5 8m0-8-5 8M15 7h3m-3 5h3m-3 5h3"/>',
 industry:'<path d="M3 21V10l6 4V9l6 4V3h5v18H3ZM7 18h1m4 0h1m4 0h1"/>',
 data:'<path d="M3 20h18M6 16v-5m6 5V5m6 11V8"/><circle cx="6" cy="8" r="1"/><circle cx="18" cy="5" r="1"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>'
};
// Official n8n wordmark: n8n-io/n8n, N8nLogo/logo-text.svg.
const n8nWordmark='<path d="M396 85.5C411.75 85.5 422.25 77.1562 422.25 64.5938C422.25 55.7812 417.562 49.3125 409.312 46.125C416.156 43.125 420 37.5 420 30.0938C420 18.375 410.438 10.5 396 10.5C381.562 10.5 372 18.375 372 30.0938C372 37.5 375.844 43.125 382.688 46.125C374.438 49.3125 369.75 55.7812 369.75 64.5938C369.75 77.1562 380.25 85.5 396 85.5ZM312 84H324V60.2812C324 46.6875 329.531 42.1875 337.688 42.1875C344.719 42.1875 348 45.4688 348 55.2188V84H360V51C360 39 353.625 31.5 340.969 31.5C332.625 31.5 327 34.9688 323.625 40.875V33H312V84ZM396 75C387.656 75 382.5 70.5938 382.5 63.2812C382.5 55.9688 387.656 51.5625 396 51.5625C404.344 51.5625 409.5 55.9688 409.5 63.2812C409.5 70.5938 404.344 75 396 75ZM396 41.625C388.781 41.625 384 37.5 384 31.3125C384 25.125 388.781 21 396 21C403.219 21 408 25.125 408 31.3125C408 37.5 403.219 41.625 396 41.625ZM432 84H444V60.2812C444 46.6875 449.531 42.1875 457.688 42.1875C464.719 42.1875 468 45.4688 468 55.2188V84H480V51C480 39 473.625 31.5 460.969 31.5C452.625 31.5 447 34.9688 443.625 40.875V33H432V84Z"/>';
export const icon=(name,extra='')=>name==='n8n'?'<svg '+extra+' class="n8n-logo" viewBox="312 0 168 96" fill="currentColor" stroke="none" aria-hidden="true">'+n8nWordmark+'</svg>':'<svg '+extra+' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.video)+'</svg>';
