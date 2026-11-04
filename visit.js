(function () {
  var analytics = window.PORTFOLIO_ANALYTICS;
  if (!analytics || !analytics.configured || sessionStorage.getItem("portfolio-visit")) {
    return;
  }
  sessionStorage.setItem("portfolio-visit", "pending");

  var languages = { en: 1, de: 1, es: 1, it: 1, tr: 1, ru: 1, zh: 1, ar: 1 };
  var systems = { Windows: 1, macOS: 1, Android: 1, iOS: 1, Linux: 1, ChromeOS: 1, Other: 1 };

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

  function cleanIp(value) {
    var ip = text(value, 45);
    var v4 = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
    if (v4.test(ip)) {
      return ip;
    }
    if (ip.indexOf(":") !== -1 && ip.indexOf("..") === -1 && /^[0-9a-f:.]{2,45}$/i.test(ip)) {
      return ip.toLowerCase();
    }
    return "";
  }

  function coordinate(value, min, max) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) {
      return null;
    }
    return Math.round(number * 10000) / 10000;
  }

  function timezoneName(value) {
    var zone = text(value, 64);
    if (/^[A-Za-z][A-Za-z0-9_+-]{0,63}(\/[A-Za-z0-9_+-]{1,64}){0,2}$/.test(zone)) {
      return zone;
    }
    return "";
  }

  function browserTimezone() {
    try {
      return timezoneName(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    } catch (error) {
      return "";
    }
  }

  function ispName(geo) {
    return text((geo && (geo.organization_name || geo.organization)) || "", 120);
  }

  function asnValue(value) {
    var asn = text(String(value == null ? "" : value), 12).replace(/^AS/i, "");
    return /^[0-9]{1,10}$/.test(asn) ? asn : "";
  }

  function accuracyKm(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) {
      return null;
    }
    number = Math.round(number);
    if (number < 0 || number > 20000) {
      return null;
    }
    return number;
  }

  function osName(platform, ua) {
    var probe = platform || "";
    if (/Android/i.test(probe)) return "Android";
    if (/iOS|iPhone|iPad/i.test(probe)) return "iOS";
    if (/Win/i.test(probe)) return "Windows";
    if (/Mac/i.test(probe)) return "macOS";
    if (/Chrome OS|CrOS/i.test(probe)) return "ChromeOS";
    if (/Linux/i.test(probe)) return "Linux";
    var agent = ua || "";
    if (/Android/i.test(agent)) return "Android";
    if (/iPhone|iPad|iPod/i.test(agent)) return "iOS";
    if (/Windows/i.test(agent)) return "Windows";
    if (/Mac OS X/i.test(agent)) return "macOS";
    if (/CrOS/i.test(agent)) return "ChromeOS";
    if (/Linux/i.test(agent)) return "Linux";
    return "Other";
  }

  function versionText(value) {
    var version = text(value, 40);
    return /^[A-Za-z0-9._+-]{1,40}$/.test(version) ? version : "";
  }

  function architectureName(value) {
    var name = text(value, 16).toLowerCase().replace(/[-_]/g, "");
    if (name === "x86" || name === "x64" || name === "x8664" || name === "amd64") return "x86";
    if (name === "arm64" || name === "aarch64") return "arm64";
    if (name === "arm") return "arm";
    return "";
  }

  function modelName(value) {
    var model = text(value, 80);
    return model.length > 1 ? model : "";
  }

  function browserLanguage() {
    var value = text(navigator.language || "", 35);
    return /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,2}$/.test(value) ? value : "";
  }

  function screenSize() {
    var width = window.screen ? Math.round(Number(screen.width)) : 0;
    var height = window.screen ? Math.round(Number(screen.height)) : 0;
    if (!width || !height || width < 50 || height < 50 || width > 20000 || height > 20000) {
      return "";
    }
    return width + "x" + height;
  }

  function matchingVersion(list, browserName) {
    if (!Array.isArray(list)) {
      return "";
    }
    var patterns = {
      Edge: /Edge|Edg/i,
      Chrome: /Chrome|Chromium/i,
      Firefox: /Firefox/i,
      Safari: /Safari/i
    };
    var pattern = patterns[browserName];
    if (!pattern) {
      return "";
    }
    var chromium = "";
    for (var i = 0; i < list.length; i += 1) {
      var item = list[i] || {};
      var brand = item.brand || "";
      var version = text(String(item.version || ""), 20);
      if (!pattern.test(brand) || !/^[0-9]+(\.[0-9]+){0,3}$/.test(version)) {
        continue;
      }
      if (browserName === "Chrome" && /Chromium/i.test(brand)) {
        chromium = version;
        continue;
      }
      return version;
    }
    return chromium;
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve) {
      var settled = false;
      var timer = setTimeout(function () {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, ms);
      Promise.resolve(promise).then(function (value) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(value);
        }
      }, function () {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(null);
        }
      });
    });
  }

  function clientHints() {
    var browser = browserClass();
    var base = {
      os: osName("", navigator.userAgent || ""),
      os_version: "",
      architecture: "",
      model: "",
      browser_version: matchingVersion(navigator.userAgentData && navigator.userAgentData.brands, browser)
    };
    var uaData = navigator.userAgentData;
    if (!uaData || typeof uaData.getHighEntropyValues !== "function") {
      return Promise.resolve(base);
    }
    return withTimeout(uaData.getHighEntropyValues([
      "platform",
      "platformVersion",
      "architecture",
      "model",
      "fullVersionList"
    ]), 1500).then(function (hints) {
      if (!hints) {
        return base;
      }
      base.os = osName(hints.platform || "", navigator.userAgent || "");
      base.os_version = versionText(hints.platformVersion);
      base.architecture = architectureName(hints.architecture);
      base.model = modelName(hints.model);
      var fullVersion = matchingVersion(hints.fullVersionList, browser);
      if (fullVersion) {
        base.browser_version = fullVersion;
      }
      return base;
    });
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

  function endpoint() {
    return analytics.origin + "/rest/v1/visits";
  }

  function postVisit(body) {
    return fetch(endpoint(), {
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
    });
  }

  function baseVisit(body) {
    return {
      page: body.page,
      language: body.language,
      referrer: body.referrer,
      device: body.device,
      browser: body.browser,
      country: body.country,
      country_code: body.country_code,
      city: body.city,
      region: body.region,
      visitor_key: body.visitor_key
    };
  }

  function send(body) {
    postVisit(body).then(function (response) {
      if (response.ok) {
        sessionStorage.setItem("portfolio-visit", "1");
        return;
      }
      if (response.status !== 400) {
        sessionStorage.removeItem("portfolio-visit");
        return;
      }
      return postVisit(baseVisit(body)).then(function (retry) {
        if (retry.ok) {
          sessionStorage.setItem("portfolio-visit", "1");
        } else {
          sessionStorage.removeItem("portfolio-visit");
        }
      });
    }).catch(function () {
      sessionStorage.removeItem("portfolio-visit");
    });
  }

  function loadGeo() {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, 2500);
    return fetch("https://get.geojs.io/v1/ip/geo.json", {
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store"
    }).then(function (response) {
      return response.ok ? response.json() : null;
    }).catch(function () {
      return null;
    }).then(function (geo) {
      clearTimeout(timer);
      return geo;
    });
  }

  Promise.all([loadGeo(), clientHints()]).then(function (results) {
    var geo = results[0];
    var hints = results[1] || {};
    var countryCode = text(geo && geo.country_code, 2).toUpperCase();
    var visit = {
      page: pagePath(),
      language: languages[document.documentElement.lang] ? document.documentElement.lang : "en",
      referrer: referrerHost(document.referrer),
      device: deviceClass(),
      browser: browserClass(),
      browser_version: hints.browser_version || "",
      browser_language: browserLanguage(),
      os: systems[hints.os] ? hints.os : "Other",
      os_version: hints.os_version || "",
      architecture: hints.architecture || "",
      model: hints.model || "",
      screen: screenSize(),
      country: text(geo && geo.country, 80),
      country_code: /^[A-Z]{2}$/.test(countryCode) ? countryCode : "",
      city: text(geo && geo.city, 80),
      region: text(geo && geo.region, 80),
      timezone: timezoneName(geo && geo.timezone) || browserTimezone(),
      isp: ispName(geo),
      asn: asnValue(geo && geo.asn),
      ip: cleanIp(geo && geo.ip),
      latitude: coordinate(geo && geo.latitude, -90, 90),
      longitude: coordinate(geo && geo.longitude, -180, 180),
      accuracy_km: accuracyKm(geo && geo.accuracy),
      visitor_key: ""
    };
    if (visit.latitude == null) delete visit.latitude;
    if (visit.longitude == null) delete visit.longitude;
    if (visit.accuracy_km == null) delete visit.accuracy_km;
    return visitorKey(visit.ip).then(function (key) {
      visit.visitor_key = /^[a-f0-9]{12}$/.test(key) ? key : randomKey();
      send(visit);
    });
  }).catch(function () {});
})();
