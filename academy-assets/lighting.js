/* Decorative Mofid adaptation of the requested Hero / Lamp lighting references. */
(function () {
  'use strict';
  function mount() {
    if (!document.body || document.getElementById('academyTopLight')) return;
    const light = document.createElement('div');
    light.id = 'academyTopLight';
    light.className = 'academy-top-light';
    light.setAttribute('aria-hidden', 'true');
    light.inert = true;
    for (const kind of ['wash', 'cone', 'halo', 'core', 'line']) {
      const layer = document.createElement('i');
      layer.className = 'academy-lamp-' + kind;
      light.append(layer);
    }
    document.documentElement.dataset.academyLighting = 'ready';
    // Last in the background stack, above existing gradient decorations.
    document.body.append(light);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();
