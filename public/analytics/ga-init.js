(function () {
  var currentScript = document.currentScript;
  if (!currentScript) return;

  var currentUrl = new URL(currentScript.src, window.location.href);
  var measurementId = currentUrl.searchParams.get('id');
  if (!measurementId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });
})();
