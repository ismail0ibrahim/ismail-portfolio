(function () {
  var analytics = window.PORTFOLIO_ANALYTICS;
  if (!analytics || !analytics.configured || sessionStorage.getItem("portfolio-visit")) {
    return;
  }
  sessionStorage.setItem("portfolio-visit", "pending");

  var languages = { en: 1, de: 1, es: 1, it: 1, tr: 1, ru: 1, zh: 1, ar: 1 };

  function text(value, max) {
    if (typeof value !== "string") {
      return "";
    }
    return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
  }

  function hex(bytes) {
    return Array.from(bytes, function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }

  function randomKey() {
    var bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return hex(bytes);
  }

  function referrerHost(value) {
    if (!value) {
      return "";
    }
    try {
      var url = new URL(value);
      var host = url.hostname.toLowerCase();
      if ((url.protocol !== "https:" && url.protocol !== "http:") || url.origin === location.origin) {
        return "";
      }
      if (!/^[a-z0-9.-]{1,253}$/.test(host) || host.indexOf("..") !== -1) {
        return "";
      }
      return url.protocol + "//" + host;
    } catch (error) {
      return "";
    }
  }

  function deviceClass() {
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean") {
      return navigator.userAgentData.mobile ? "Mobile" : "Desktop";
    }
    return /Mobi|Android/i.test(navigator.userAgent || "") ? "Mobile" : "Desktop";
  }

  function browserClass() {
    var brands = navigator.userAgentData && navigator.userAgentData.brands;
    var names = brands ? brands.map(function (brand) { return brand.brand || ""; }).join(" ") : "";
    var probe = names || navigator.userAgent || "";
    if (/Edge|Edg/i.test(probe)) return "Edge";
    if (/Firefox/i.test(probe)) return "Firefox";
    if (/Chrome|Chromium/i.test(probe)) return "Chrome";
    if (/Safari/i.test(probe)) return "Safari";
    return "Other";
  }

  function pagePath() {
    var path = location.pathname || "/";
    if (!/^\/[A-Za-z0-9._/-]*$/.test(path) || path.indexOf("..") !== -1 || path.length > 120) {
      return "/";
    }
    return path;
  }

  async function visitorKey(ip) {
    var day = new Date().toISOString().slice(0, 10);
    if (!ip || !crypto.subtle) {
      return randomKey();
    }
    var bytes = new TextEncoder().encode(ip + "|" + day);
    var digest = await crypto.subtle.digest("SHA-256", bytes);
    return hex(new Uint8Array(digest).slice(0, 6));
  }

  function send(body) {
    fetch(analytics.origin + "/rest/v1/visits", {
      method: "POST",
      headers: {
        apikey: analytics.anonKey,
        Authorization: "Bearer " + analytics.anonKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(body),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      keepalive: true
    }).then(function (response) {
      if (response.ok) {
        sessionStorage.setItem("portfolio-visit", "1");
      } else {
        sessionStorage.removeItem("portfolio-visit");
      }
    }).catch(function () {
      sessionStorage.removeItem("portfolio-visit");
    });
  }

  var visit = {
    page: pagePath(),
    language: languages[document.documentElement.lang] ? document.documentElement.lang : "en",
    referrer: referrerHost(document.referrer),
    device: deviceClass(),
    browser: browserClass(),
    country: "",
    country_code: "",
    city: "",
    region: "",
    visitor_key: ""
  };

  var controller = new AbortController();
  var timer = setTimeout(function () {
    controller.abort();
  }, 2500);

  fetch("https://get.geojs.io/v1/ip/geo.json", {
    signal: controller.signal,
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store"
  })
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .catch(function () {
      return null;
    })
    .then(function (geo) {
      clearTimeout(timer);
      var countryCode = text(geo && geo.country_code, 2).toUpperCase();
      visit.country = text(geo && geo.country, 80);
      visit.city = text(geo && geo.city, 80);
      visit.region = text(geo && geo.region, 80);
      visit.country_code = /^[A-Z]{2}$/.test(countryCode) ? countryCode : "";
      return visitorKey(text(geo && geo.ip, 64));
    })
    .then(function (key) {
      visit.visitor_key = /^[a-f0-9]{12}$/.test(key) ? key : randomKey();
      send(visit);
    })
    .catch(function () {});
})();
