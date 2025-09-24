(function () {
  function detectClientDevice(ua) {
    ua = (ua || navigator.userAgent || "").toLowerCase();
    const tabletKeys = ["tablet","ipad","playbook","silk","kindle","nexus 7","nexus 9","sm-t","tab","galaxy tab","xoom","transformer","sch-i800"];
    const mobileRegex = /mobile|iphone|ipod|windows phone|blackberry|bb10|opera mini|phone|android.*mobile/;

    for (const k of tabletKeys) {
      if (ua.indexOf(k) !== -1) return "tablet";
    }
    if (mobileRegex.test(ua)) return "mobile";
    if (ua.indexOf("android") !== -1 && !/mobile/.test(ua)) return "tablet";
    return "desktop";
  }
  function setCookie(name, value, days) {
    let expires = "";
    if (typeof days === "number") {
      const d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + d.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
  }
  const detected = detectClientDevice();
  setCookie("detected_device", detected, 7);

  window.DeviceOverride = {
    detectClientDevice,
    setCookie,
    clear: function () { setCookie("detected_device", "", -1); }
  };
})();
