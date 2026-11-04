(function () {
  var analytics = window.PORTFOLIO_ANALYTICS || {};
  var sessionKey = "portfolio-admin-session";
  var setup = document.querySelector("#setup");
  var loginPanel = document.querySelector("#loginPanel");
  var dashboard = document.querySelector("#dashboard");
  var loginForm = document.querySelector("#loginForm");
  var loginError = document.querySelector("#loginError");
  var secretWarning = document.querySelector("#secretWarning");
  var ownerEmail = document.querySelector("#ownerEmail");
  var emailWarning = document.querySelector("#emailWarning");
  var visitRows = document.querySelector("#visitRows");
  var tableStatus = document.querySelector("#tableStatus");
  var schemaWarning = document.querySelector("#schemaWarning");
  var timeFormat = new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo"
  });
  var numberFormat = new Intl.NumberFormat("ar-EG");

  function show(section) {
    [setup, loginPanel, dashboard].forEach(function (panel) {
      panel.hidden = panel !== section;
    });
  }

  function setError(message) {
    loginError.hidden = !message;
    loginError.textContent = message || "";
  }

  function readSession() {
    try {
      var parsed = JSON.parse(sessionStorage.getItem(sessionKey) || "");
      if (!parsed || typeof parsed.access !== "string" || typeof parsed.refresh !== "string") {
        return null;
      }
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function writeSession(data) {
    sessionStorage.setItem(sessionKey, JSON.stringify({
      access: data.access_token,
      refresh: data.refresh_token,
      expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000
    }));
  }

  function clearSession() {
    sessionStorage.removeItem(sessionKey);
  }

  function tokenPayload(token) {
    try {
      var part = String(token || "").split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      while (part.length % 4) {
        part += "=";
      }
      return JSON.parse(atob(part));
    } catch (error) {
      return {};
    }
  }

  async function authorizedToken() {
    var session = readSession();
    if (!session) {
      return "";
    }
    if (Date.now() < session.expiresAt - 60000) {
      return session.access;
    }

    var response = await fetch(analytics.origin + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: {
        apikey: analytics.anonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token: session.refresh }),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store"
    });
    if (!response.ok) {
      clearSession();
      return "";
    }
    var data = await response.json();
    if (!data.access_token || !data.refresh_token) {
      clearSession();
      return "";
    }
    writeSession(data);
    return data.access_token;
  }

  function cell(value, className, sub, subDir, extraNode) {
    var item = document.createElement("td");
    if (className) {
      item.className = className;
    }
    if (className && className.split(" ").indexOf("ltr") !== -1) {
      item.dir = "ltr";
    }
    item.textContent = value;
    if (sub) {
      var extra = document.createElement("span");
      extra.className = "admin-sub";
      if (subDir) {
        extra.dir = subDir;
      }
      extra.textContent = sub;
      item.append(extra);
    }
    if (extraNode) {
      item.append(extraNode);
    }
    return item;
  }

  function placeLabel(row) {
    var parts = [row.city, row.region, row.country].filter(function (part, index, all) {
      return part && all.indexOf(part) === index;
    });
    return parts.join("، ") || "غير معروف";
  }

  function sourceLabel(referrer) {
    if (!referrer) {
      return "دخول مباشر";
    }
    try {
      return new URL(referrer).hostname.replace(/^www\./, "");
    } catch (error) {
      return "دخول مباشر";
    }
  }

  function pageLabel(page) {
    if (/\/cv\.html$/.test(page)) {
      return "السيرة الذاتية";
    }
    if (page === "/" || /\/$/.test(page) || /\/index\.html$/.test(page)) {
      return "الرئيسية";
    }
    return page || "الرئيسية";
  }

  function empty(value) {
    return value == null || value === "";
  }

  function coordinates(row) {
    if (empty(row.latitude) || empty(row.longitude)) {
      return null;
    }
    var latitude = Number(row.latitude);
    var longitude = Number(row.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return null;
    }
    return { latitude: latitude, longitude: longitude };
  }

  function mapHref(point) {
    var latitude = point.latitude.toFixed(4);
    var longitude = point.longitude.toFixed(4);
    return "https://www.openstreetmap.org/?mlat=" + encodeURIComponent(latitude) + "&mlon=" + encodeURIComponent(longitude) + "#map=11/" + encodeURIComponent(latitude) + "/" + encodeURIComponent(longitude);
  }

  function detailItem(label, value, href) {
    var item = document.createElement("div");
    var term = document.createElement("dt");
    var desc = document.createElement("dd");
    term.textContent = label;
    if (!empty(value) && href) {
      var link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = value;
      desc.append(link);
    } else {
      desc.textContent = empty(value) ? "—" : String(value);
    }
    item.append(term, desc);
    return item;
  }

  function detailsRow(row) {
    var point = coordinates(row);
    var line = document.createElement("tr");
    var holder = document.createElement("td");
    var list = document.createElement("dl");
    line.className = "visit-more";
    holder.colSpan = 8;
    list.className = "visit-details";
    list.append(
      detailItem("IP", row.ip || ""),
      detailItem("مزود الإنترنت", row.isp || ""),
      detailItem("رقم الشبكة", row.asn ? "AS" + row.asn : ""),
      detailItem("الإحداثيات", point ? point.latitude.toFixed(2) + ", " + point.longitude.toFixed(2) : "", point ? mapHref(point) : ""),
      detailItem("المنطقة الزمنية", row.timezone || ""),
      detailItem("دقة المكان", row.accuracy_km == null || row.accuracy_km === "" ? "" : "±" + row.accuracy_km + " كم"),
      detailItem("النظام", row.os || ""),
      detailItem("إصدار النظام", row.os_version || ""),
      detailItem("المعمارية", row.architecture || ""),
      detailItem("الموديل", row.model || ""),
      detailItem("الشاشة", row.screen ? String(row.screen).replace(/x/g, "×") : ""),
      detailItem("إصدار المتصفح", row.browser_version || ""),
      detailItem("لغة المتصفح", row.browser_language || "")
    );
    holder.append(list);
    line.append(holder);
    return line;
  }

  function browserLabel(row) {
    var name = row.browser || "";
    var major = String(row.browser_version || "").split(".")[0];
    if (name && /^[0-9]+$/.test(major)) {
      return name + " " + major;
    }
    return name;
  }

  function render(rows, total) {
    visitRows.replaceChildren();
    var countries = new Set();
    var todayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());
    var todayCount = 0;

    rows.forEach(function (row) {
      if (row.country) {
        countries.add(row.country);
      }
      var created = new Date(row.created_at);
      if (!Number.isNaN(created.valueOf())) {
        var rowKey = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Africa/Cairo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).format(created);
        if (rowKey === todayKey) {
          todayCount += 1;
        }
      }

      var line = document.createElement("tr");
      line.className = "visit-main";
      line.append(
        cell(Number.isNaN(created.valueOf()) ? "" : timeFormat.format(created)),
        cell(placeLabel(row), "place"),
        cell(sourceLabel(row.referrer), "source"),
        cell(pageLabel(row.page)),
        cell(row.device === "Mobile" ? "موبايل" : "كمبيوتر"),
        cell(browserLabel(row), "ltr"),
        cell(String(row.language || "").toUpperCase(), "ltr"),
        cell(row.visitor_key || "", "ltr")
      );
      visitRows.append(line, detailsRow(row));
    });

    document.querySelector("#legacyNote").hidden = !rows.some(function (row) {
      return !row.ip && !row.os;
    });
    document.querySelector("#statTotal").textContent = numberFormat.format(total);
    document.querySelector("#statToday").textContent = numberFormat.format(todayCount);
    document.querySelector("#statCountries").textContent = numberFormat.format(countries.size);
    tableStatus.hidden = rows.length > 0;
    tableStatus.textContent = rows.length ? "" : "لسه مفيش زيارات. افتح الصفحة الرئيسية من جهاز أو شبكة تانية بعد النشر.";
  }

  async function loadVisits() {
    tableStatus.hidden = false;
    tableStatus.textContent = "جاري تحميل الزيارات...";
    var token = await authorizedToken();
    if (!token) {
      show(loginPanel);
      return;
    }

    var email = String(tokenPayload(token).email || "").toLowerCase();
    if (analytics.ownerEmail && email && email !== analytics.ownerEmail) {
      emailWarning.hidden = false;
      emailWarning.textContent = "الحساب ده مختلف عن الإيميل المسموح له بالقراءة في قاعدة البيانات، فالسجل ممكن يفضل فاضي.";
    } else {
      emailWarning.hidden = true;
    }

    var baseSelect = "created_at,country,country_code,city,region,referrer,page,language,device,browser,visitor_key";
    var richSelect = baseSelect + ",ip,latitude,longitude,timezone,isp,asn,accuracy_km,os,os_version,architecture,model,screen,browser_version,browser_language";

    async function requestVisits(select) {
      return fetch(analytics.origin + "/rest/v1/visits?select=" + select + "&order=created_at.desc&limit=200", {
        headers: {
          apikey: analytics.anonKey,
          Authorization: "Bearer " + token,
          Accept: "application/json",
          Prefer: "count=exact"
        },
        credentials: "omit",
        referrerPolicy: "no-referrer",
        cache: "no-store"
      });
    }

    var response = await requestVisits(richSelect);
    var legacySchema = false;
    if (response.status === 400) {
      legacySchema = true;
      response = await requestVisits(baseSelect);
    }
    schemaWarning.hidden = !legacySchema;

    if (response.status === 401 || response.status === 403) {
      clearSession();
      setError("انتهت الجلسة. ادخل مرة تانية.");
      show(loginPanel);
      return;
    }
    if (!response.ok) {
      tableStatus.textContent = "تعذر قراءة السجل. تأكد من تشغيل ملف SQL ومن تسجيل الدخول بنفس إيميل السياسة.";
      return;
    }

    var rows = await response.json();
    var range = response.headers.get("content-range") || "";
    var totalText = range.split("/")[1];
    var total = Number(totalText);
    render(Array.isArray(rows) ? rows : [], Number.isFinite(total) ? total : (Array.isArray(rows) ? rows.length : 0));
  }

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    setError("");
    var submitButton = loginForm.querySelector("button");
    submitButton.disabled = true;

    try {
      var formData = new FormData(loginForm);
      var response = await fetch(analytics.origin + "/auth/v1/token?grant_type=password", {
        method: "POST",
        headers: {
          apikey: analytics.anonKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: String(formData.get("email") || "").trim(),
          password: String(formData.get("password") || "")
        }),
        credentials: "omit",
        referrerPolicy: "no-referrer",
        cache: "no-store"
      });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok || !data.access_token) {
        setError("البريد أو كلمة السر غير صحيحة.");
        return;
      }
      writeSession(data);
      loginForm.reset();
      show(dashboard);
      await loadVisits();
    } catch (error) {
      setError("تعذر الاتصال بخدمة السجل.");
    } finally {
      submitButton.disabled = false;
    }
  });

  document.querySelector("#refreshButton").addEventListener("click", function () {
    loadVisits().catch(function () {
      tableStatus.hidden = false;
      tableStatus.textContent = "تعذر تحديث السجل.";
    });
  });

  document.querySelector("#logoutButton").addEventListener("click", function () {
    clearSession();
    visitRows.replaceChildren();
    show(loginPanel);
  });

  ownerEmail.textContent = analytics.ownerEmail || "ismailofficialibrahim@gmail.com";
  secretWarning.hidden = !analytics.rejectedSecret;

  if (!analytics.configured) {
    show(setup);
    return;
  }

  var emailInput = document.querySelector("#email");
  if (analytics.ownerEmail) {
    emailInput.value = analytics.ownerEmail;
  }

  if (readSession()) {
    show(dashboard);
    loadVisits().catch(function () {
      tableStatus.textContent = "تعذر تحميل السجل.";
    });
    return;
  }

  show(loginPanel);
})();
