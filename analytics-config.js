(function () {
  var config = {
    // Project Settings → API → Project URL
    supabaseUrl: "https://odmlnbwxppvaplnwbrwd.supabase.co",
    // anon JWT or sb_publishable key only. Never put service_role or sb_secret here.
    supabaseAnonKey: "sb_publishable_lWKMylvcTP19mZ_GFohaMQ_MQMMQcaQ",
    ownerEmail: "ismailofficialibrahim@gmail.com"
  };

  function decodePart(part) {
    try {
      var text = String(part).replace(/-/g, "+").replace(/_/g, "/");
      while (text.length % 4) {
        text += "=";
      }
      return JSON.parse(atob(text));
    } catch (error) {
      return null;
    }
  }

  function keyRole(key) {
    var parts = String(key || "").split(".");
    if (parts.length !== 3) {
      return "";
    }
    var payload = decodePart(parts[1]);
    return payload && typeof payload.role === "string" ? payload.role : "";
  }

  function isSecretKey(key) {
    var value = String(key || "").trim();
    return value.startsWith("sb_secret_") || keyRole(value) === "service_role";
  }

  function isAnonKey(key) {
    var value = String(key || "").trim();
    if (!value || isSecretKey(value)) {
      return false;
    }
    if (value.startsWith("sb_publishable_")) {
      return value.length > 24;
    }
    return keyRole(value) === "anon";
  }

  function originOf(url) {
    try {
      var parsed = new URL(String(url || "").trim());
      if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) {
        return "";
      }
      if (!/^[a-z0-9]{8,40}\.supabase\.co$/.test(parsed.hostname)) {
        return "";
      }
      return parsed.origin;
    } catch (error) {
      return "";
    }
  }

  var origin = originOf(config.supabaseUrl);
  var anonKey = String(config.supabaseAnonKey || "").trim();

  window.PORTFOLIO_ANALYTICS = {
    origin: origin,
    anonKey: isAnonKey(anonKey) ? anonKey : "",
    ownerEmail: String(config.ownerEmail || "").trim().toLowerCase(),
    configured: Boolean(origin && isAnonKey(anonKey)),
    rejectedSecret: isSecretKey(anonKey)
  };
})();
