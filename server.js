const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(cookieParser());

function detectDevice(uaString = "") {
  const ua = uaString.toLowerCase();

  const tabletKeys = [
    "tablet", "ipad", "playbook", "silk", "kindle",
    "nexus 7", "nexus 9", "sm-t", "tab", "galaxy tab",
    "xoom", "transformer", "sch-i800"
  ];

  const mobileKeys = [
    /mobile/, /iphone/, /ipod/, /windows phone/, /blackberry/,
    /bb10/, /opera mini/, /phone/, /android.*mobile/
  ];

  for (const k of tabletKeys) {
    if (ua.includes(k)) return "tablet";
  }

  for (const k of mobileKeys) {
    if (k.test ? k.test(ua) : ua.includes(k)) return "mobile";
  }

  // special-case: android present but not mobile -> tablet
  if (ua.includes("android") && !/mobile/.test(ua)) return "tablet";

  // fallback
  return "desktop";
}

app.get("/", (req, res) => {
  const cookieDev = req.cookies.detected_device; // cookie override
  const ua = req.get("User-Agent") || "";


  //Cookie override (Matikan kalau misal server trust user agent bukan cookie pertama) kalau gunakan logic dibawah lebih strict
  let device;
  if (["mobile", "tablet", "desktop"].includes(cookieDev)) {
    device = cookieDev;
  } else {
    device = detectDevice(ua);
  }

  // per-device content
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
  } else { // mobile
    pageInfo = {
      title: "AdaptiveSite — Chatan App",
      headline: "Chat with your people.",
      sub: "Compact chat UI and quick actions, optimized for phones.",
      bullets: ["Recent chats", "Quick replies", "Notifications"]
    };
  }

  // render template (EJS)
  res.render("index", { device, ua, page: pageInfo });
});


//warna
app.get("/", (req, res) => {
  const ua = req.headers["user-agent"] || "";
  const device = detectDevice(ua); // "mobile" | "tablet" | "desktop"

  let theme;
  if (device === "desktop") {
    theme = { bg: "from-blue-50 to-blue-100", accent: "blue-600" };
  } else if (device === "tablet") {
    theme = { bg: "from-pink-50 to-pink-100", accent: "pink-600" };
  } else {
    theme = { bg: "from-emerald-50 to-emerald-100", accent: "emerald-100" };
  }

  res.render("index", { device, ua, page: pageInfo, theme });
});


app.get("/clear-device-cookie", (req, res) => {
  // clears cookie and renders a helpful page
  res.clearCookie("detected_device", { path: "/" });
  const page = {
    title: "AdaptiveSite — Demo",
    headline: "Cleared device cookie",
    sub: "Cookie removed; reload to let server detect UA again.",
    bullets: []
  };
  res.render("index", { device: "desktop", ua: req.get("User-Agent") || "", page });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
