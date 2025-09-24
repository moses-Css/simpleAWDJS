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
    // CRITICAL: Initialize device variable immediately to prevent undefined errors
    let device = "desktop"; // Default fallback - MUST be defined before any logic

    try {
      // 1) get UA + optional cookie override with proper validation
      const ua = req.get("User-Agent") || "";
      const cookieDev = req.cookies ? req.cookies.detected_device : undefined;
      const USE_COOKIE_OVERRIDE = true; // set false if you always trust UA - enabled for dynamic updates

      // 2) determine device with error handling and fallback
      try {
        const detectedDevice = detectDevice(ua);
        // Validate device value
        if (detectedDevice && ["mobile", "tablet", "desktop"].includes(detectedDevice)) {
          device = detectedDevice;
        } else {
          device = "desktop"; // fallback to desktop if detection fails
        }
      } catch (error) {
        console.error("[ERROR] Device detection failed:", error);
        device = "desktop"; // fallback to desktop on error
      }

    // 3) apply cookie override if valid (always update cookie with current detection)
    if (USE_COOKIE_OVERRIDE && cookieDev && ["mobile","tablet","desktop"].includes(cookieDev)) {
      device = cookieDev;
    }

    // Always update cookie with current device detection for consistency
    res.cookie("detected_device", device, {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: false, // Allow client-side access for testing
      path: "/"
    });

      // 4) CRITICAL SAFETY CHECK - ensure device is always defined
      if (!device || typeof device !== "string") {
        device = "desktop";
      }

      // 5) page content per device
      let pageInfo;
      if (device === "desktop") {
        pageInfo = {
          title: "AdaptiveSite — Ecommerce",
          headline: "Sell anything. Fast.",
          sub: "A modern ecommerce demo layout for desktop shoppers.",
          bullets: ["Product grid", "Checkout flow", "Admin dashboard"]
        };
      } else if (device === "tablet") {
        pageInfo = {
          title: "AdaptiveSite — Studio",
          headline: "Create. Showcase. Inspire.",
          sub: "A clean studio portfolio layout tuned for tablets.",
          bullets: ["Gallery", "Services", "Contact form"]
        };
      } else {
        pageInfo = {
          title: "AdaptiveSite — Chatan App",
          headline: "Chat with your people.",
          sub: "Compact chat UI and quick actions, optimized for phones.",
          bullets: ["Recent chats", "Quick replies", "Notifications"]
        };
      }

      // 6) theme per-device (send full Tailwind utility fragments)
      let theme;
      if (device === "desktop") {
        theme = { bodyBg: "from-blue-50 to-blue-100", accentClass: "text-blue-600", accentDot: "bg-blue-600", avatarGradient: "from-blue-600 to-blue-300" };
      } else if (device === "tablet") {
        theme = { bodyBg: "from-pink-50 to-pink-100", accentClass: "text-pink-600", accentDot: "bg-pink-600", avatarGradient: "from-pink-600 to-pink-300" };
      } else {
        theme = { bodyBg: "from-emerald-50 to-emerald-100", accentClass: "text-emerald-600", accentDot: "bg-emerald-600", avatarGradient: "from-emerald-600 to-emerald-300" };
      }

      // 7) debug log (optional) - remove if noisy
      console.log("[render] device=", device, "ua=", ua.substring(0, 100));

      // 8) CRITICAL: Ensure all template variables are defined before rendering
      const templateData = {
        device: device || "desktop", // Double-check device
        ua: ua || "",
        page: pageInfo,
        theme: theme
      };

      // 9) single render call with guaranteed data
      return res.render("index", templateData);
    } catch (error) {
      console.error("[ERROR] Route handler failed:", error);
      // Fallback response in case of any error
      return res.status(500).render("index", {
        device: "desktop",
        ua: "",
        page: {
          title: "AdaptiveSite — Error",
          headline: "Something went wrong",
          sub: "Please try again later",
          bullets: ["Error occurred", "Using fallback", "Check logs"]
        },
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
