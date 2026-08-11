(function () {
  var currentScript = document.currentScript;
  if (!currentScript) return;

  var currentUrl = new URL(currentScript.src, window.location.href);
  var clarityId = currentUrl.searchParams.get('id');
  if (!clarityId) return;

  window.clarity = window.clarity || function clarity() {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  var firstScript = document.getElementsByTagName('script')[0];
  if (!firstScript || !firstScript.parentNode) return;

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.clarity.ms/tag/' + encodeURIComponent(clarityId);
  firstScript.parentNode.insertBefore(script, firstScript);
})();
