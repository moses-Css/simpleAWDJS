  // server.js (fixed)
  const express = require("express");
  const cookieParser = require("cookie-parser");
  const path = require("path");

  const app = express();

  // make views/static path explicit (helps in some deploy envs)
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");
  app.use(express.static(path.join(__dirname, "public")));
  app.use(cookieParser());
  

  function detectDevice(uaString = "") {
    try {
      // Handle null, undefined, or non-string inputs
      if (!uaString || typeof uaString !== "string") {
        return "desktop";
      }

      const ua = uaString.toLowerCase();

      const tabletKeys = [
        "tablet","ipad","playbook","silk","kindle",
        "nexus 7","nexus 9","sm-t","tab","galaxy tab",
        "xoom","transformer","sch-i800"
      ];

      const mobileKeys = [
        /mobile/, /iphone/, /ipod/, /windows phone/, /blackberry/,
        /bb10/, /opera mini/, /phone/, /android.*mobile/
      ];

      // Check for tablet first
      for (const k of tabletKeys) {
        if (ua.includes(k)) return "tablet";
      }

      // Check for mobile
      for (const k of mobileKeys) {
        try {
          if (k.test ? k.test(ua) : ua.includes(k)) return "mobile";
        } catch (regexError) {
          // If regex fails, try string match
          if (typeof k === "string" && ua.includes(k)) return "mobile";
        }
      }

      // Special case: Android without mobile flag is tablet
      if (ua.includes("android") && !/mobile/.test(ua)) return "tablet";

      return "desktop";
    } catch (error) {
      console.error("[ERROR] detectDevice function failed:", error);
      return "desktop"; // Always return a valid device type
    }
  }

  app.get("/", (req, res) => {
  let device = "desktop";
  // Default theme to prevent ReferenceError
  let theme = { bodyBg: "from-blue-50 to-blue-100", accentClass: "text-blue-600", accentDot: "bg-blue-600", avatarGradient: "from-blue-600 to-blue-300" };
  try {
    // 1) Read UA + query param (dev/test helper)
    const ua = req.get("User-Agent") || "";
    const uaLower = ua.toLowerCase();
    const qSource = (req.query.source || "").toLowerCase(); // ?source=flutterflow

    // 2) Detect if request likely comes from a WebView (heuristic)
    const isLikelyWebView = /webview|wv|crosswalk|cordova|reactnative|flutter|flutterflow|flutter_webview/i.test(uaLower);

    // 3) Consider explicit query param OR UA tokens as "from FlutterFlow"
    const isFromFlutterFlow = qSource === "flutterflow" || uaLower.includes("flutterflow") || uaLower.includes("flutter") || uaLower.includes("flutter_webview") || isLikelyWebView;

    // 4) Primary device detection (pure UA-based)
    device = detectDevice(ua); // must return "mobile"|"tablet"|"desktop"

    // 5) Build page content based on device
    let pageInfo;
    if (device === "desktop") {
      pageInfo = { title: "AdaptiveSite — Ecommerce", headline: "Sell anything. Fast.", sub: "A modern ecommerce demo layout for desktop shoppers.", bullets: ["Product grid", "Checkout flow", "Admin dashboard"] };
    } else if (device === "tablet") {
      pageInfo = { title: "AdaptiveSite — Studio", headline: "Create. Showcase. Inspire.", sub: "A clean studio portfolio layout tuned for tablets.", bullets: ["Gallery", "Services", "Contact form"] };
    } else {
      pageInfo = { title: "AdaptiveSite — Chatan App", headline: "Chat with your people.", sub: "Compact chat UI and quick actions, optimized for phones.", bullets: ["Recent chats", "Quick replies", "Notifications"] };
    }

    // 6) Default theme by device (full Tailwind class fragments)
    if (device === "desktop") theme = { bodyBg: "from-blue-50 to-blue-100", accentClass: "text-blue-600", accentDot: "bg-blue-600", avatarGradient: "from-blue-600 to-blue-300" };
    else if (device === "tablet") theme = { bodyBg: "from-pink-50 to-pink-100", accentClass: "text-pink-600", accentDot: "bg-pink-600", avatarGradient: "from-pink-600 to-pink-300" };
    else theme = { bodyBg: "from-emerald-50 to-emerald-100", accentClass: "text-emerald-600", accentDot: "bg-emerald-600", avatarGradient: "from-emerald-600 to-emerald-300" };

    // 7) OVERRIDE: if request likely from FlutterFlow WebView, force purple theme
    if (isFromFlutterFlow) {
      theme = { bodyBg: "from-purple-200 to-purple-400", accentClass: "text-purple-700", accentDot: "bg-purple-600", avatarGradient: "from-purple-700 to-purple-400" };
      console.log("[FLUTTERFLOW DETECTED] Using FlutterFlow-purple theme. ua:", ua.substring(0, 120));
    }
console.log("[TEMPLATE DATA] device:", device);
console.log("[TEMPLATE DATA] ua:", ua && ua.substring(0,120));
console.log("[TEMPLATE DATA] theme:", theme);
console.log("[TEMPLATE DATA] page.title:", pageInfo && pageInfo.title);
    // 8) render
    return res.render("index", { device, ua, page: pageInfo, theme });
  } catch (err) {
    console.error("[ERROR] / handler", err);
    return res.status(500).render("index", {
      device: "desktop",
      ua: "",
      page: { title: "Error", headline: "Something went wrong", sub: "Try again later", bullets: [] },
      theme: { bodyBg: "from-red-50 to-red-100", accentClass: "text-red-600", accentDot: "bg-red-600", avatarGradient: "from-red-600 to-red-300" }
    });
  }
});

  // Health check endpoint for debugging
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // clear cookie: redirect to / so root handles render (safer)
  app.get("/clear-device-cookie", (req, res) => {
    res.clearCookie("detected_device", { path: "/" });
    res.redirect("/");
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
