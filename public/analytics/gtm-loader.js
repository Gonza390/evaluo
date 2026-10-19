(function () {
  var currentScript = document.currentScript;
  if (!currentScript) return;

  var currentUrl = new URL(currentScript.src, window.location.href);
  var containerId = currentUrl.searchParams.get('id');
  if (!containerId) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'gtm_loaded',
    app_name: 'Evaluo',
  });

  var firstScript = document.getElementsByTagName('script')[0];
  if (!firstScript || !firstScript.parentNode) return;

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(containerId);
  firstScript.parentNode.insertBefore(script, firstScript);
})();
