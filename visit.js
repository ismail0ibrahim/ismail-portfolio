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

  function deviceClass(hints) {
    var platform = (hints && hints.os) || "";
    var lowPlatform = navigator.userAgentData && navigator.userAgentData.platform;
    var factors = hints && hints.formFactors;
    if (Array.isArray(factors)) {
      for (var i = 0; i < factors.length; i += 1) {
        if (/Mobile|Tablet/i.test(String(factors[i] || ""))) {
          return "Mobile";
        }
      }
    }
    if (platform === "Android" || platform === "iOS" || lowPlatform === "Android" || lowPlatform === "iOS") {
      return "Mobile";
    }
    if (navigator.userAgentData && navigator.userAgentData.mobile === true) {
      return "Mobile";
    }
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "")) {
      return "Mobile";
    }
    return "Desktop";
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

  function modelFromUa(ua) {
    var match = /Android [^;)]*;\s*([^;)]+)/i.exec(ua || "");
    if (!match) {
      return "";
    }
    var token = text(match[1], 80).replace(/\s+Build.*$/i, "");
    if (token.length < 2 || /^(K|Android|Mobile|Linux|HarmonyOS)$/i.test(token)) {
      return "";
    }
    return token;
  }

  function friendlyModel(model) {
    var value = modelName(model);
    if (!value) {
      return "";
    }
    var compact = value.replace(/\s+/g, "");
    if (/^SM-M556/i.test(compact)) {
      return "Samsung Galaxy M55";
    }
    if (/^SM-/i.test(compact)) {
      return "Samsung " + compact.toUpperCase();
    }
    if (/^Galaxy\b/i.test(value)) {
      return "Samsung " + value;
    }
    return value;
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
    var lowPlatform = navigator.userAgentData && navigator.userAgentData.platform;
    var base = {
      os: osName(lowPlatform || "", navigator.userAgent || ""),
      os_version: "",
      architecture: "",
      model: "",
      formFactors: [],
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
      "fullVersionList",
      "formFactors"
    ]), 3500).then(function (hints) {
      if (!hints) {
        return base;
      }
      base.os = osName(hints.platform || lowPlatform || "", navigator.userAgent || "");
      base.os_version = versionText(hints.platformVersion);
      base.architecture = architectureName(hints.architecture);
      base.model = modelName(hints.model);
      base.formFactors = Array.isArray(hints.formFactors) ? hints.formFactors.slice(0, 4) : [];
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
    var bytes = new TextEncoder().encode(ip + "|" + day + "|2");
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

  function loadJson(url, ms) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, ms);
    return fetch(url, {
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store"
    }).then(function (response) {
      return response.ok ? response.json() : null;
    }).catch(function () {
      return null;
    }).then(function (data) {
      clearTimeout(timer);
      return data;
    });
  }

  function isPublicIp(ip) {
    if (!ip) {
      return false;
    }
    var parts = ip.split(".");
    if (parts.length === 4) {
      var a = Number(parts[0]);
      var b = Number(parts[1]);
      if (a === 0 || a === 10 || a === 127) return false;
      if (a === 169 && b === 254) return false;
      if (a === 192 && b === 168) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 100 && b >= 64 && b <= 127) return false;
      return true;
    }
    var v6 = ip.toLowerCase();
    if (v6 === "::1" || v6.indexOf("fe80:") === 0 || v6.indexOf("fc") === 0 || v6.indexOf("fd") === 0) {
      return false;
    }
    return v6.indexOf(":") !== -1;
  }

  function isCountryCentroid(latitude, longitude) {
    if (latitude == null || longitude == null) {
      return false;
    }
    return Math.abs(latitude - 37.751) < 0.05 && Math.abs(longitude + 97.822) < 0.05;
  }

  function isHostedNetwork(geo) {
    var asn = geo.asn || "";
    if (/^(15169|396982|16509|14618|13335|8075|14061|16276)$/.test(asn)) {
      return true;
    }
    return /Google LLC|Google Cloud|Amazon|AWS|Microsoft|Cloudflare|DigitalOcean|Akamai|Fastly/i.test(geo.isp || "");
  }

  function isCoarse(geo) {
    if (!geo || geo.unreliable || !isPublicIp(geo.ip)) return true;
    if (isHostedNetwork(geo)) return true;
    if (geo.accuracy != null && geo.accuracy >= 400) return true;
    if (isCountryCentroid(geo.latitude, geo.longitude)) return true;
    if (!geo.city) return true;
    return false;
  }

  function markUnreliable(list) {
    var coarseIp = {};
    (list || []).forEach(function (geo) {
      if (!geo || !geo.ip) {
        return;
      }
      if ((geo.accuracy != null && geo.accuracy >= 400) || isCountryCentroid(geo.latitude, geo.longitude) || isHostedNetwork(geo)) {
        coarseIp[geo.ip] = true;
      }
    });
    (list || []).forEach(function (geo) {
      if (geo && coarseIp[geo.ip]) {
        geo.unreliable = true;
      }
    });
  }

  function zoneCountry(zone) {
    var zones = {
      "Africa/Cairo": ["EG", "Egypt"],
      "Africa/Tripoli": ["LY", "Libya"],
      "Africa/Khartoum": ["SD", "Sudan"],
      "Africa/Juba": ["SS", "South Sudan"],
      "Africa/Nairobi": ["KE", "Kenya"],
      "Africa/Addis_Ababa": ["ET", "Ethiopia"],
      "Africa/Lagos": ["NG", "Nigeria"],
      "Africa/Johannesburg": ["ZA", "South Africa"],
      "Africa/Casablanca": ["MA", "Morocco"],
      "Africa/Algiers": ["DZ", "Algeria"],
      "Africa/Tunis": ["TN", "Tunisia"],
      "Africa/Accra": ["GH", "Ghana"],
      "Africa/Dar_es_Salaam": ["TZ", "Tanzania"],
      "Africa/Kampala": ["UG", "Uganda"],
      "Asia/Riyadh": ["SA", "Saudi Arabia"],
      "Asia/Dubai": ["AE", "United Arab Emirates"],
      "Asia/Kuwait": ["KW", "Kuwait"],
      "Asia/Qatar": ["QA", "Qatar"],
      "Asia/Bahrain": ["BH", "Bahrain"],
      "Asia/Muscat": ["OM", "Oman"],
      "Asia/Baghdad": ["IQ", "Iraq"],
      "Asia/Amman": ["JO", "Jordan"],
      "Asia/Beirut": ["LB", "Lebanon"],
      "Asia/Damascus": ["SY", "Syria"],
      "Asia/Gaza": ["PS", "Palestine"],
      "Asia/Hebron": ["PS", "Palestine"],
      "Asia/Aden": ["YE", "Yemen"],
      "Asia/Jerusalem": ["IL", "Israel"],
      "Asia/Tehran": ["IR", "Iran"],
      "Europe/Istanbul": ["TR", "Turkey"],
      "Asia/Karachi": ["PK", "Pakistan"],
      "Asia/Kolkata": ["IN", "India"],
      "Asia/Calcutta": ["IN", "India"],
      "Asia/Dhaka": ["BD", "Bangladesh"],
      "Asia/Jakarta": ["ID", "Indonesia"],
      "Asia/Singapore": ["SG", "Singapore"],
      "Asia/Kuala_Lumpur": ["MY", "Malaysia"],
      "Asia/Manila": ["PH", "Philippines"],
      "Asia/Bangkok": ["TH", "Thailand"],
      "Asia/Ho_Chi_Minh": ["VN", "Vietnam"],
      "Asia/Shanghai": ["CN", "China"],
      "Asia/Hong_Kong": ["HK", "Hong Kong"],
      "Asia/Taipei": ["TW", "Taiwan"],
      "Asia/Tokyo": ["JP", "Japan"],
      "Asia/Seoul": ["KR", "South Korea"],
      "Australia/Sydney": ["AU", "Australia"],
      "Australia/Melbourne": ["AU", "Australia"],
      "Australia/Perth": ["AU", "Australia"],
      "Australia/Brisbane": ["AU", "Australia"],
      "Pacific/Auckland": ["NZ", "New Zealand"],
      "Europe/London": ["GB", "United Kingdom"],
      "Europe/Paris": ["FR", "France"],
      "Europe/Berlin": ["DE", "Germany"],
      "Europe/Rome": ["IT", "Italy"],
      "Europe/Madrid": ["ES", "Spain"],
      "Europe/Amsterdam": ["NL", "Netherlands"],
      "Europe/Brussels": ["BE", "Belgium"],
      "Europe/Zurich": ["CH", "Switzerland"],
      "Europe/Vienna": ["AT", "Austria"],
      "Europe/Stockholm": ["SE", "Sweden"],
      "Europe/Oslo": ["NO", "Norway"],
      "Europe/Copenhagen": ["DK", "Denmark"],
      "Europe/Helsinki": ["FI", "Finland"],
      "Europe/Warsaw": ["PL", "Poland"],
      "Europe/Prague": ["CZ", "Czechia"],
      "Europe/Athens": ["GR", "Greece"],
      "Europe/Bucharest": ["RO", "Romania"],
      "Europe/Moscow": ["RU", "Russia"],
      "America/New_York": ["US", "United States"],
      "America/Detroit": ["US", "United States"],
      "America/Chicago": ["US", "United States"],
      "America/Denver": ["US", "United States"],
      "America/Phoenix": ["US", "United States"],
      "America/Los_Angeles": ["US", "United States"],
      "America/Anchorage": ["US", "United States"],
      "Pacific/Honolulu": ["US", "United States"],
      "America/Toronto": ["CA", "Canada"],
      "America/Vancouver": ["CA", "Canada"],
      "America/Mexico_City": ["MX", "Mexico"],
      "America/Sao_Paulo": ["BR", "Brazil"],
      "America/Argentina/Buenos_Aires": ["AR", "Argentina"],
      "America/Bogota": ["CO", "Colombia"],
      "America/Lima": ["PE", "Peru"],
      "America/Santiago": ["CL", "Chile"]
    };
    return zones[zone] || null;
  }

  function fromGeojs(data) {
    if (!data || !data.ip) {
      return null;
    }
    var code = text(data.country_code, 2).toUpperCase();
    return {
      ip: cleanIp(data.ip),
      country: text(data.country, 80),
      country_code: /^[A-Z]{2}$/.test(code) ? code : "",
      city: text(data.city, 80),
      region: text(data.region, 80),
      latitude: coordinate(data.latitude, -90, 90),
      longitude: coordinate(data.longitude, -180, 180),
      accuracy: accuracyKm(data.accuracy),
      timezone: timezoneName(data.timezone),
      isp: ispName(data),
      asn: asnValue(data.asn)
    };
  }

  function fromIpwho(data) {
    if (!data || data.success === false || !data.ip) {
      return null;
    }
    var connection = data.connection || {};
    var zone = data.timezone || {};
    var code = text(data.country_code, 2).toUpperCase();
    return {
      ip: cleanIp(data.ip),
      country: text(data.country, 80),
      country_code: /^[A-Z]{2}$/.test(code) ? code : "",
      city: text(data.city, 80),
      region: text(data.region, 80),
      latitude: coordinate(data.latitude, -90, 90),
      longitude: coordinate(data.longitude, -180, 180),
      accuracy: null,
      timezone: timezoneName(zone.id || ""),
      isp: text(connection.isp || connection.org || "", 120),
      asn: asnValue(connection.asn)
    };
  }

  function geoScore(geo, deviceCode) {
    if (!geo || !isPublicIp(geo.ip)) {
      return -100;
    }
    var score = 1;
    if (!isCoarse(geo)) score += 6;
    if (geo.city) score += 1;
    if (deviceCode && geo.country_code === deviceCode) score += 5;
    if (deviceCode && geo.country_code && geo.country_code !== deviceCode) score -= 3;
    return score;
  }

  function locationFields(list) {
    markUnreliable(list);
    var deviceZone = browserTimezone();
    var deviceCountry = zoneCountry(deviceZone);
    var deviceCode = deviceCountry ? deviceCountry[0] : "";
    var geo = null;
    var bestScore = -100;
    (list || []).forEach(function (item) {
      var score = geoScore(item, deviceCode);
      if (score > bestScore) {
        geo = item;
        bestScore = score;
      }
    });
    var place = {
      country: "",
      country_code: "",
      city: "",
      region: "",
      latitude: null,
      longitude: null,
      accuracy_km: null,
      timezone: deviceZone,
      isp: geo ? geo.isp : "",
      asn: geo ? geo.asn : "",
      ip: geo && isPublicIp(geo.ip) ? geo.ip : ""
    };
    if (geo && !isCoarse(geo)) {
      place.country = geo.country;
      place.country_code = geo.country_code;
      place.city = geo.city;
      place.region = geo.region;
      place.latitude = geo.latitude;
      place.longitude = geo.longitude;
      place.accuracy_km = geo.accuracy;
    } else if (deviceCountry) {
      place.country = deviceCountry[1];
      place.country_code = deviceCountry[0];
    } else if (geo) {
      place.country = geo.country;
      place.country_code = geo.country_code;
    }
    return place;
  }

  function loadGeo() {
    return Promise.all([
      loadJson("https://get.geojs.io/v1/ip/geo.json", 4000).then(fromGeojs),
      loadJson("https://ipwho.is/", 4000).then(fromIpwho)
    ]).then(function (list) {
      return list.filter(Boolean);
    });
  }

  Promise.all([loadGeo(), clientHints()]).then(function (results) {
    var hints = results[1] || {};
    var place = locationFields(results[0]);
    var model = friendlyModel(hints.model) || friendlyModel(modelFromUa(navigator.userAgent || ""));
    var visit = {
      page: pagePath(),
      language: languages[document.documentElement.lang] ? document.documentElement.lang : "en",
      referrer: referrerHost(document.referrer),
      device: deviceClass(hints),
      browser: browserClass(),
      browser_version: hints.browser_version || "",
      browser_language: browserLanguage(),
      os: systems[hints.os] ? hints.os : "Other",
      os_version: hints.os_version || "",
      architecture: hints.architecture || "",
      model: model,
      screen: screenSize(),
      country: place.country,
      country_code: place.country_code,
      city: place.city,
      region: place.region,
      timezone: place.timezone,
      isp: place.isp,
      asn: place.asn,
      ip: place.ip,
      latitude: place.latitude,
      longitude: place.longitude,
      accuracy_km: place.accuracy_km,
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
