(function () {
  var cfg = window.SITE_CONFIG || {};
  var client = cfg.adsenseClient || "";
  if (!client || client.indexOf("ca-pub-") !== 0) return;

  var slots = document.querySelectorAll("[data-ad-slot]");
  var ready = [];
  slots.forEach(function (el) {
    var name = el.getAttribute("data-ad-slot");
    var id = cfg.slots && cfg.slots[name];
    if (!id || id.indexOf("SLOT") !== -1) return;
    el.classList.add("is-live");
    el.innerHTML =
      '<ins class="adsbygoogle" style="display:block" data-ad-client="' +
      client +
      '" data-ad-slot="' +
      id +
      '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    ready.push(el);
  });
  if (!ready.length) return;

  var script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(client);
  script.onload = function () {
    ready.forEach(function () {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  };
  document.head.appendChild(script);
})();
