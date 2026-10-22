'use strict';
(async () => {
  if (globalThis.SushiAdminFeatures?.enabled !== true) return;
  const template = document.getElementById('admin-content');
  document.getElementById('admin-disabled').remove();
  document.body.append(template.content.cloneNode(true));
  template.remove();
  for (const placeholder of document.querySelectorAll('script[data-admin-src]')) {
    const script = document.createElement('script');
    script.src = placeholder.getAttribute('data-admin-src');
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      placeholder.replaceWith(script);
    });
  }
})();
