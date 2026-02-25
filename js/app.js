// ./js/app.js
import {
  TR,
  esc,
  parseDelimited,
  pickColumn,
  readFileText,
  T,
  stockToNumber,
} from "./utils.js";
import { loadBrands, scanCompel, dailyMeta, dailyGet, dailySave } from "./api.js";
import { createMatcher, normBrand, COLS } from "./match.js";
import { createDepot } from "./depot.js";
import { createRenderer } from "./render.js";

const $ = (id) => document.getElementById(id);

const API_BASE = "https://robot-workstation.tvkapora.workers.dev";

const SUPPLIERS = {
  COMPEL: "Compel",
  ALL: "Tüm Markalar",
  AKALIN: "Akalın",
};

let ACTIVE_SUPPLIER = SUPPLIERS.COMPEL;

// =========================
// 0) “Seed” marka listeleri
// =========================
const AIDE_BRAND_SEED = [
  "ABLETON",
  "ADAM",
  "AKAI",
  "AKÇELİK",
  "AKG",
  "ALPHATHETA",
  "APPLE",
  "ART",
  "ARTURIA",
  "ASIMETRIKPRO",
  "ASTONMICROPHONES",
  "AUDIENT",
  "AUDIO TECHNICA",
  "B&W",
  "BEHRINGER",
  "BEYER",
  "BEYERDYNAMIC",
  "BİOLİTE",
  "BO",
  "BOSE PRO",
  "BROS&COMPANY",
  "CAMELBAK",
  "CORSAIR",
  "CTT",
  "DECKSAVER",
  "DENON",
  "DIVOOM",
  "DJ TECHTOOLS",
  "D-VOİCE",
  "EARTHWORKS",
  "ECLER",
  "EIKON",
  "ENOVA",
  "ERALP",
  "ESI AUDIO",
  "EUROCLUB",
  "EVENTIDE AUDIO",
  "FENDER",
  "FLİGHT",
  "FOCAL",
  "FOCUSRİTE",
  "GARMİN",
  "GATOR",
  "GEÇİCİ",
  "GENELEC",
  "GOBY LABS",
  "GRAVITY",
  "GTRS",
  "HEADRUSH",
  "HİFİMAN",
  "HOSA",
  "IK MULTIMEDIA",
  "INSTAX",
  "JBL",
  "KANTON",
  "KIRLIN",
  "KLARKTEKNIK",
  "KORG",
  "KOSS",
  "KÖNIG & MEYER",
  "KRK",
  "LDSYSTEMS",
  "LENCO",
  "MACKIE",
  "MAONO",
  "MARK STRINGS",
  "M-AUDIO",
  "MAXON",
  "MODAL ELECTRONICS",
  "MOGAMİ",
  "MOONDROP",
  "MOTU",
  "NEDIS",
  "NEUMANN",
  "NOVATION",
  "NUMARK",
  "ONEODIO",
  "OXID",
  "OXOGEAR",
  "OYAIDE",
  "PALMER",
  "PATONA",
  "PEAK DESIGN",
  "PIONEER",
  "PRESONUS",
  "RCF",
  "RELOOP",
  "RODE",
  "ROLAND",
  "RS AUDIO",
  "SE ELEKTRONICS",
  "SENNHEISER",
  "SESCİBABA",
  "SHURE",
  "SLATE",
  "SOUNDBOKS",
  "SSL",
  "STEINBERG",
  "STI",
  "SUDIO",
  "TAMA",
  "TANNOY",
  "TANTRUM",
  "TASCAM",
  "TC ELECTRONIC",
  "TC HELICON",
  "TEENAGE ENGINEERING",
  "TEKNIK",
  "TIE",
  "TOPPING AUDIO",
  "TRİTON",
  "TRUTHEAR",
  "UFUK ONEN",
  "ULTIMATE",
  "ULTİMATE",
  "UNIVERSAL",
  "WARMAUDIO",
  "WORLDE",
  "YAMAHA",
];

const TSOFT_BRAND_SEED = [
  "Behringer",
  "Peak Design",
  "M-Audio",
  "Rode",
  "Ableton",
  "Nedis",
  "Arturia",
  "Rcf",
  "Universal Audio",
  "Marantz",
  "Numark",
  "Denon DJ",
  "Presonus",
  "Lindell Audio",
  "Access Music",
  "Genelec",
  "Audio Technica",
  "Rane",
  "Avalon",
  "Crane Song",
  "Rupert Neve",
  "Native Instruments",
  "Steinberg",
  "Warm Audio",
  "Audient",
  "IsoAcoustics",
  "Mxl",
  "ADAM Audio",
  "ESI Audio",
  "Radial Engineering",
  "IK Multimedia",
  "Focusrite",
  "Novation",
  "Mackie",
  "Nektar",
  "Apogee",
  "Yamaha",
  "Turbosound",
  "Nord",
  "sE Electronics",
  "Sennheiser",
  "Dynaudio",
  "Bowers & Wilkins",
  "Neumann",
  "Pioneer",
  "König & Meyer",
  "Hosa",
  "M&K Sound",
  "Audix",
  "Focal",
  "Alesis",
  "Boss",
  "Shure",
  "SesciBaba",
  "TC Electronic",
  "TC Helicon",
  "CTT",
  "Denon",
  "Inter",
  "Marshall",
  "I Light",
  "AKG",
  "CROWN",
  "JBL",
  "BSS",
  "Aston Microphones",
  "ENOVA",
  "KRK Systems",
  "KALI Audio",
  "HEADRUSH",
  "Neutrik",
  "Icon Pro Audio",
  "Joué",
  "AC Infinity",
  "Disan",
  "EVE AUDIO",
  "Acme",
  "Bosch",
  "Christie",
  "Impact",
  "ITC",
  "Arya",
  "ASY",
  "Cosmo",
  "ICA",
  "LD System",
  "Toa",
  "SonarWorks",
  "MOTU",
  "DPA Microphones",
  "MIDIPLUS",
  "RME",
  "SSL",
  "Modal Electronics",
  "Martin Audio",
  "Slate Digital",
  "Stanton",
  "Reloop",
  "Lab Gruppen",
  "Worlde",
  "Beyerdynamic",
  "Audeze",
  "Cranborne Audio",
  "Tie Products",
  "SoundSwitch",
  "Maono",
  "AKAI",
  "KORG",
  "Steven Slate Audio",
  "M-Game",
  "SOUNDBOKS",
  "Monster Cable",
  "NEO",
  "OneOdio",
  "Polyend",
  "Sudio",
  "Mogami",
  "AVMATRIX",
  "Nedis Cable",
  "Gator Frameworks",
  "Reloop HiFi",
  "PeakDesign",
  "Truthear",
  "Decksaver",
  "Procase",
  "AlphaTheta",
  "Maxon",
  "Antelope Audio",
  "Sheeran Loopers",
  "Yellowtec",
  "4THEWALL",
  "Bose",
  "Ultimate Support",
  "Studiologic by Fatar",
  "Erica Synths",
  "Soma Synths",
  "Gravity",
  "Technics",
  "TECHNICS",
  "Polk Audio",
  "DALI Audio",
  "Relacart",
  "D&R Electronica",
  "Ecler",
  "Telefunken",
  "Harrison Audio",
  "Triton Audio",
  "LENCO",
  "KANTO",
  "D-Voice",
  "Allen Heath",
  "DJ TechTools",
  "Oxogear",
  "Lake People",
  "Topping Professional",
  "Palmer",
  "LD Systems",
  "EIKON",
  "Moondrop",
  "VOX",
  "Sequenz",
  "WAGON",
  "SAKAE",
  "Doto Design",
  "Neo Created by OYAIDE Elec.",
  "Eventide Audio",
  "Barefoot",
  "Eve Audio",
  "PSI Audio",
  "Tantrum Audio",
  "ATC Loudspeakers",
  "Topping Audio",
  "Teenage Engineering",
  "Koss",
  "Hifiman",
  "Phase",
  "Odisei Music",
  "MXL Microphones",
  "Signex",
  "Drawmer",
  "Midiplus",
  "Auratone",
  "Sivga Audio",
  "Sendy Audio",
  "Earthworks Audio",
  "Telefunken Elektroakustik",
  "Steven Slate | Audio",
  "Embodme",
  "CEntrance",
  "Freqport",
  "Evo By Audient",
  "Monster Audio",
  "Rhodes",
  "High Line",
  "Fender Studio",
  "Corsair",
];

// ✅ Görsel Title Case (TR uyumlu)
function toTitleCaseTR(s) {
  const t = String(s || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  return t
    .split(" ")
    .map((w) => {
      if (!w) return w;
      const lo = w.toLocaleLowerCase(TR);
      return lo.charAt(0).toLocaleUpperCase(TR) + lo.slice(1);
    })
    .join(" ");
}

// Tüm Markalar modunda gösterilecek kanonik liste (T-Soft tercih)
function buildCanonicalBrandList() {
  const pref = new Map(); // brNorm -> displayName
  const _tsoftSet = new Set(
    TSOFT_BRAND_SEED.map((x) => String(x || "").trim()).filter(Boolean)
  );

  const add = (name, priority) => {
    const nm = String(name || "").trim();
    if (!nm) return;
    const k = normBrand(nm);
    if (!k) return;
    if (!pref.has(k)) pref.set(k, nm);
    else {
      const cur = pref.get(k);
      const curPr = cur && _tsoftSet.has(cur) ? 2 : 1;
      if (priority > curPr) pref.set(k, nm);
    }
  };

  for (const nm of AIDE_BRAND_SEED) add(nm, 1);
  for (const nm of TSOFT_BRAND_SEED) add(nm, 2);

  const brands = [...pref.entries()]
    .map(([brNorm, name]) => ({ id: brNorm, slug: brNorm, name, count: "—" }))
    .sort((a, b) =>
      String(a.name).localeCompare(String(b.name), "tr", { sensitivity: "base" })
    );

  return brands;
}

// =========================
// Guide
// =========================
let guideStep = "brand";

(() => {
  const st = document.createElement("style");
  st.textContent = `
    @keyframes guidePulse{
      0%{box-shadow:0 0 0 rgba(232,60,97,0);border-color:var(--border-2)}
      55%{box-shadow:0 0 0 rgba(232,60,97,0);border-color:var(--border-2)}
      74%{box-shadow:0 0 10px rgba(232,60,97,.28);border-color:rgba(255,85,121,.55)}
      86%{box-shadow:0 0 16px rgba(232,60,97,.45);border-color:var(--accent-hover)}
      100%{box-shadow:0 0 0 rgba(232,60,97,0);border-color:var(--border-2)}
    }
  `;
  document.head.appendChild(st);
})();

const GUIDE_DUR = { brand: 1500, tsoft: 1250, aide: 1050, list: 900 };

const clearGuidePulse = () =>
  ["brandHintBtn", "sescBox", "depoBtn", "go", "tsoftDailyBtn", "aideDailyBtn"].forEach(
    (id) => {
      const el = $(id);
      el && (el.classList.remove("guidePulse"), el.style.removeProperty("--guideDur"));
    }
  );

const setGuideStep = (s) => ((guideStep = s || "done"), updateGuideUI());

const updateGuideUI = () => {
  clearGuidePulse();
  if (ACTIVE_SUPPLIER === SUPPLIERS.AKALIN || guideStep === "done") return;
  const dur = GUIDE_DUR[guideStep] || 1200;
  const apply = (el) =>
    el &&
    (el.style.setProperty("--guideDur", `${dur}ms`), el.classList.add("guidePulse"));

  guideStep === "brand"
    ? apply($("brandHintBtn"))
    : guideStep === "tsoft"
    ? apply($("sescBox"))
    : guideStep === "aide"
    ? apply($("depoBtn"))
    : guideStep === "list" && apply($("go"));
};

function hasTsoftReady() {
  const file = $("f2")?.files?.[0];
  return !!file || !!String(DAILY_SELECTED?.tsoft || "").trim();
}
function hasAideReady() {
  return depot?.isReady?.() || !!String(DAILY_SELECTED?.aide || "").trim();
}
function updateGuideFromState() {
  if (ACTIVE_SUPPLIER === SUPPLIERS.AKALIN) return;

  if (!SELECTED.size) {
    setGuideStep("brand");
    return;
  }
  if (!hasTsoftReady()) {
    setGuideStep("tsoft");
    return;
  }
  if (!hasAideReady()) {
    setGuideStep("aide");
    return;
  }
  setGuideStep("list");
}

// =========================
// UI helpers
// =========================
const setChip = (id, t, cls = "") => {
  const e = $(id);
  if (!e) return;
  const txt = String(t ?? "");
  e.textContent = txt;
  e.title = txt;
  e.className = "chip" + (cls ? ` ${cls}` : "");
};

const setStatus = (t, k = "ok") => {
  const st = $("stChip");
  if (!st) return;
  const msg = String(t ?? "").trim();
  if (!msg || msg.toLocaleLowerCase(TR) === "hazır") {
    st.style.display = "none";
    st.textContent = "";
    st.title = "";
    st.className = "chip ok";
    return;
  }
  st.style.display = "";
  setChip("stChip", msg, k);
};

const ui = { setChip, setStatus };

const INFO_HIDE_IDS = ["brandStatus", "l1Chip", "l2Chip", "l4Chip", "sum"];

// ✅ Marka Ara bar + CSS (ALL + COMPEL)
(() => {
  const st = document.createElement("style");
  st.textContent = `
    #brandSearchBar{
      height:36px;
      box-sizing:border-box;
      display:none;
      align-items:center;
      justify-content:center;
      border:1px solid var(--border-2);
      border-radius:10px;
      background:var(--bg-panel);
      padding:0 10px;

      flex:0 0 auto;
      width:auto;
      max-width:520px;
      min-width:0;
      margin-left:auto;
      margin-right:auto;
    }
    #brandSearchBar.show{display:flex}
    #brandSearchInputTop{
      width:100%;
      background:transparent;
      border:0;
      outline:none;
      color:var(--text);
      font-weight:1100;
      font-size:15px;
      padding:0;
      margin:0;
      text-align:center;
      min-width:0;
    }
    #brandSearchInputTop::placeholder{
      color:var(--text-2);
      opacity:.85;
    }
    .brandToggle{
      display:flex;
      justify-content:center;
      align-items:center;
      gap:8px;
      width:100%;
      padding:8px 0 2px;
      user-select:none;
      cursor:pointer;
      font-weight:1100;
      color:var(--text-2);
    }
    .brandToggle:hover{color:var(--text)}
    .brandToggle .arr{font-size:14px;opacity:.9}
  `;
  document.head.appendChild(st);
})();

// =========================
// daily
// =========================
let DAILY_META = null;
let DAILY_SELECTED = { tsoft: "", aide: "" };
let DAILY_READ_CACHE = { date: "", pass: "" };
let DAILY_SAVE_CRED = null;

const setBtnSel = (btn, sel) => {
  if (!btn) return;
  sel ? btn.classList.add("sel") : btn.classList.remove("sel");
};

function pickHMFrom(obj) {
  if (!obj) return "";
  const direct = String(obj.hm || obj.HM || obj.time || obj.saat || obj.hour || obj.hhmm || "").trim();
  if (direct) return direct;
  const iso = String(obj.iso || obj.ISO || obj.createdAt || obj.updatedAt || obj.at || obj.ts || obj.timestamp || "").trim();
  if (iso) {
    const m = iso.match(/T(\d{2}:\d{2})/);
    if (m) return m[1];
    const m2 = iso.match(/\b(\d{2}:\d{2})\b/);
    if (m2) return m2[1];
  }
  return "";
}

function pickDateFrom(obj) {
  if (!obj) return { ymd: "", dmy: "" };
  return {
    ymd: String(obj.ymd || obj.YMD || obj.date || obj.day || obj.gun || "").trim(),
    dmy: String(obj.dmy || obj.DMY || obj.dateText || obj.display || obj.tarih || "").trim(),
  };
}

function getAideDailyPick() {
  const todayAide =
    DAILY_META?.today?.aide || DAILY_META?.aide?.today || DAILY_META?.todayAide || DAILY_META?.aideToday || null;
  const yesterdayAide =
    DAILY_META?.yesterday?.aide || DAILY_META?.aide?.yesterday || DAILY_META?.yesterdayAide || DAILY_META?.aideYesterday || null;

  const todayExists = !!(todayAide?.exists || DAILY_META?.today?.aideExists || DAILY_META?.today?.aide?.exists);
  const yestExists = !!(yesterdayAide?.exists || DAILY_META?.yesterday?.aideExists || DAILY_META?.yesterday?.aide?.exists);
  const todayDate = pickDateFrom(DAILY_META?.today),
    yestDate = pickDateFrom(DAILY_META?.yesterday);

  if (todayExists) {
    const hm = pickHMFrom(todayAide) || pickHMFrom(DAILY_META?.today) || "";
    return { exists: true, isToday: true, ymd: todayDate.ymd, dmy: todayDate.dmy, hm };
  }
  if (yestExists) return { exists: true, isToday: false, ymd: yestDate.ymd, dmy: yestDate.dmy, hm: "" };
  return { exists: false, isToday: false, ymd: "", dmy: "", hm: "" };
}

function getTsoftDailyPick() {
  const todayTsoft =
    DAILY_META?.today?.tsoft || DAILY_META?.tsoft?.today || DAILY_META?.todayTsoft || DAILY_META?.tsoftToday || null;
  const yesterdayTsoft =
    DAILY_META?.yesterday?.tsoft ||
    DAILY_META?.tsoft?.yesterday ||
    DAILY_META?.yesterdayTsoft ||
    DAILY_META?.tsoftYesterday ||
    null;

  const todayExists = !!(todayTsoft?.exists || DAILY_META?.today?.tsoftExists || DAILY_META?.today?.tsoft?.exists);
  const yestExists = !!(yesterdayTsoft?.exists || DAILY_META?.yesterday?.tsoftExists || DAILY_META?.yesterday?.tsoft?.exists);
  const todayDate = pickDateFrom(DAILY_META?.today),
    yestDate = pickDateFrom(DAILY_META?.yesterday);

  if (todayExists) {
    const hm = pickHMFrom(todayTsoft) || pickHMFrom(DAILY_META?.today) || "";
    return { exists: true, isToday: true, ymd: todayDate.ymd, dmy: todayDate.dmy, hm };
  }
  if (yestExists) return { exists: true, isToday: false, ymd: yestDate.ymd, dmy: yestDate.dmy, hm: "" };
  return { exists: false, isToday: false, ymd: "", dmy: "", hm: "" };
}

function paintDailyUI() {
  const tBtn = $("tsoftDailyBtn"),
    aBtn = $("aideDailyBtn");

  const tPick = getTsoftDailyPick();
  const tLabel = tPick.exists
    ? tPick.isToday
      ? tPick.hm
        ? `Bugün ${tPick.hm} Tarihli Veri`
        : "Bugün — Tarihli Veri"
      : tPick.dmy
      ? `${tPick.dmy} Tarihli Veri`
      : "—"
    : "—";

  const tSel = !!(tPick.ymd && DAILY_SELECTED.tsoft && DAILY_SELECTED.tsoft === tPick.ymd);
  if (tBtn) {
    tBtn.disabled = !tPick.exists;
    tBtn.title = tPick.exists ? tLabel : "—";
    tBtn.textContent = tSel ? "Seçildi" : tLabel;
    setBtnSel(tBtn, tSel);
  }

  const aPick = getAideDailyPick();
  const aLabel = aPick.exists
    ? aPick.isToday
      ? aPick.hm
        ? `Bugün ${aPick.hm} Tarihli Veri`
        : "Bugün — Tarihli Veri"
      : aPick.dmy
      ? `${aPick.dmy} Tarihli Veri`
      : "—"
    : "—";

  const aSel = !!(aPick.ymd && DAILY_SELECTED.aide && DAILY_SELECTED.aide === aPick.ymd);
  if (aBtn) {
    aBtn.disabled = !aPick.exists;
    aBtn.title = aPick.exists ? aLabel : "—";
    aBtn.textContent = aSel ? "Seçildi" : aLabel;
    setBtnSel(aBtn, aSel);
  }

  const tPrev = $("tsoftPrev"),
    aPrev = $("aidePrev");
  if (tPrev) {
    tPrev.style.display = "none";
    tPrev.textContent = "";
    tPrev.title = "";
  }
  if (aPrev) {
    aPrev.style.display = "none";
    aPrev.textContent = "";
    aPrev.title = "";
  }

  updateGuideFromState();
}

async function refreshDailyMeta() {
  try {
    DAILY_META = await dailyMeta(API_BASE);
  } catch (e) {
    console.warn("daily meta fail", e);
    DAILY_META = null;
  }
  paintDailyUI();
}

const closeModalByButton = (btnId) => {
  const b = $(btnId);
  b && b.click();
};

function toggleDaily(kind) {
  if (kind === "tsoft") {
    const pick = getTsoftDailyPick();
    if (!pick?.exists || !pick?.ymd) return;
    const was = DAILY_SELECTED.tsoft === pick.ymd;
    DAILY_SELECTED.tsoft = was ? "" : pick.ymd;
    paintDailyUI();
    if (!was) closeModalByButton("tsoftDismiss");
  } else if (kind === "aide") {
    const pick = getAideDailyPick();
    if (!pick?.exists || !pick?.ymd) return;
    const was = DAILY_SELECTED.aide === pick.ymd;
    DAILY_SELECTED.aide = was ? "" : pick.ymd;
    paintDailyUI();
    if (!was) closeModalByButton("depoClose");
  }
}

function ensureSaveCredOrCancel() {
  if (DAILY_SAVE_CRED?.adminPassword && DAILY_SAVE_CRED?.readPassword) return true;
  const admin = prompt("Yetkili Şifre:");
  if (!admin) return false;
  const read = prompt("Bugün için okuma şifresi:");
  if (!read?.trim()) return false;
  DAILY_SAVE_CRED = { adminPassword: String(admin).trim(), readPassword: String(read).trim() };
  return true;
}

async function getReadPassOrPrompt(dateYmd) {
  const ymd = String(dateYmd || "").trim();
  if (!ymd) throw new Error("Tarih bulunamadı");
  if (DAILY_READ_CACHE.pass && DAILY_READ_CACHE.date === ymd) return DAILY_READ_CACHE.pass;
  const p = prompt("Seçilen günün verisini kullanmak için okuma şifresi:") || "";
  if (!p.trim()) throw new Error("Şifre girilmedi");
  return p.trim();
}

$("tsoftDailyBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  toggleDaily("tsoft");
});
$("aideDailyBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  toggleDaily("aide");
});

// =========================
// Brand UI + canlı arama + daralt/aç
// =========================
let BRANDS = [];
let SELECTED = new Set();
let brandPrefix = "Hazır";
let hasEverListed = false;
let brandFilterText = "";
let brandListExpanded = false;

// ✅ top search bar (ALL + COMPEL)
let brandSearchBarEl = null;
function ensureBrandSearchBar() {
  if (brandSearchBarEl) return brandSearchBarEl;

  const topRow = document.querySelector("aside .topRow");
  const goBtn = $("go");
  const infoBox = $("infoBox");
  if (!topRow || !goBtn || !infoBox) return null;

  const wrap = document.createElement("div");
  wrap.id = "brandSearchBar";

  try {
    const controls = $("leftControls");
    if (controls && controls.contains(goBtn)) {
      const nxt = goBtn.nextElementSibling;
      if (nxt) controls.insertBefore(wrap, nxt);
      else controls.appendChild(wrap);
    } else {
      topRow.insertBefore(wrap, infoBox);
    }
  } catch {
    topRow.insertBefore(wrap, infoBox);
  }

  wrap.innerHTML = `<input id="brandSearchInputTop" placeholder="Marka Ara" autocomplete="off" />`;

  const inp = wrap.querySelector("#brandSearchInputTop");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const getFont = () => {
    if (!inp) return "15px system-ui";
    const cs = getComputedStyle(inp);
    const fw = cs.fontWeight || "1100";
    const fs = cs.fontSize || "15px";
    const ff = cs.fontFamily || "system-ui";
    return `${fw} ${fs} ${ff}`;
  };

  const measureTextPx = (text) => {
    if (!ctx) return 0;
    ctx.font = getFont();
    const m = ctx.measureText(String(text || ""));
    return Math.ceil(m.width || 0);
  };

  const getHPaddingPx = () => {
    const wcs = getComputedStyle(wrap);
    const ics = inp ? getComputedStyle(inp) : null;
    const pWrap =
      (parseFloat(wcs.paddingLeft) || 0) + (parseFloat(wcs.paddingRight) || 0);
    const pInp = ics
      ? (parseFloat(ics.paddingLeft) || 0) + (parseFloat(ics.paddingRight) || 0)
      : 0;
    return Math.ceil(pWrap + pInp + 18);
  };

  let MIN_W = 0;

  const recomputeMin = () => {
    const ph = inp?.getAttribute("placeholder") || "Marka Ara";
    const pad = getHPaddingPx();
    MIN_W = Math.max(0, measureTextPx(ph) + pad);
    if (MIN_W) {
      wrap.style.minWidth = `${MIN_W}px`;
      if (!String(inp?.value || "").trim()) wrap.style.width = `${MIN_W}px`;
    }
  };

  const updateWidth = () => {
    if (!inp) return;
    const maxW = Math.min(520, Math.max(220, window.innerWidth - 40));
    const val = String(inp.value || "");
    const txt = val.trim() ? val : (inp.getAttribute("placeholder") || "Marka Ara");
    const pad = getHPaddingPx();
    const w = Math.max(MIN_W || 0, measureTextPx(txt) + pad);
    const finalW = Math.max(MIN_W || 0, Math.min(maxW, w));
    wrap.style.minWidth = `${MIN_W || 0}px`;
    wrap.style.maxWidth = `${maxW}px`;
    wrap.style.width = `${finalW}px`;
  };

  if (inp) {
    inp.addEventListener("input", () => {
      brandFilterText = String(inp.value || "");
      updateWidth();
      renderBrands();
    });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        brandFilterText = "";
        inp.value = "";
        updateWidth();
        renderBrands();
      }
    });
  }

  recomputeMin();
  updateWidth();

  addEventListener("resize", () => {
    recomputeMin();
    updateWidth();
  });

  brandSearchBarEl = wrap;
  return wrap;
}

function showHideBrandSearchBar() {
  const wrap = ensureBrandSearchBar();
  if (!wrap) return;

  const show = ACTIVE_SUPPLIER !== SUPPLIERS.AKALIN; // COMPEL + ALL açık
  wrap.classList.toggle("show", !!show);

  if (!show) {
    const inp = wrap.querySelector("#brandSearchInputTop");
    if (inp) {
      brandFilterText = "";
      inp.value = "";
      try {
        const ph = inp.getAttribute("placeholder") || "Marka Ara";
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const cs = getComputedStyle(inp);
        ctx.font = `${cs.fontWeight || "1100"} ${cs.fontSize || "15px"} ${cs.fontFamily || "system-ui"}`;
        const w = Math.ceil((ctx.measureText(ph).width || 0) + 10 + 10 + 18);
        wrap.style.width = `${w}px`;
        wrap.style.minWidth = `${w}px`;
      } catch {}
    }
  }
}

const updateBrandChip = () => {
  const el = $("brandStatus");
  if (!el || ACTIVE_SUPPLIER === SUPPLIERS.AKALIN) return;
  const total = BRANDS?.length ?? 0;
  const sel = SELECTED?.size ?? 0;
  el.textContent = `${brandPrefix} • Marka: ${total}/${sel}`;
  el.title = el.textContent;
};

function getVisibleBrands() {
  const q = String(brandFilterText || "").trim().toLocaleLowerCase(TR);
  if (!q) return BRANDS;
  return BRANDS.filter((b) => String(b.name || "").toLocaleLowerCase(TR).includes(q));
}

// ✅ COMPEL: full
// ✅ ALL: default 20 (arama yoksa), toggle ile aç
function computeVisibleRowsLimit() {
  if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL) return 9999;

  // ALL
  if (String(brandFilterText || "").trim()) return 9999; // arama varsa limit kalksın
  return brandListExpanded ? 9999 : 20; // ✅ 3 -> 20
}

const renderBrands = () => {
  const list = $("brandList");
  if (!list) return;

  list.innerHTML = "";

  const visAll = getVisibleBrands();

  const isSearching = !!String(brandFilterText || "").trim();
  if (!isSearching) {
    const allVisSelected = visAll.length > 0 && visAll.every((b) => SELECTED.has(b.id));
    const allBtn = document.createElement("div");
    allBtn.className = "brand" + (allVisSelected ? " sel" : "");
    allBtn.tabIndex = 0;
    allBtn.dataset.kind = "all";
    const aTxt = allVisSelected ? "Tümünü Kaldır" : "Tümünü Seç";
    allBtn.innerHTML = `<div class="bRow"><span class="bNm" title="${esc(aTxt)}">${esc(
      aTxt
    )}</span><span class="bCt">(✓)</span></div>`;
    list.appendChild(allBtn);
  }

  const brandsWrap = document.createElement("div");
  brandsWrap.dataset.kind = "brandsWrap";
  brandsWrap.style.display = "contents";
  list.appendChild(brandsWrap);

  const vis = [...visAll].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), "tr", { sensitivity: "base" })
  );

  const limit = computeVisibleRowsLimit();
  const sliced = vis.slice(0, limit);

  sliced.forEach((b) => {
    const d = document.createElement("div");
    d.className = "brand" + (SELECTED.has(b.id) ? " sel" : "");
    d.tabIndex = 0;
    d.dataset.id = String(b.id);
    d.dataset.kind = "brand";
    const nm = toTitleCaseTR(b.name);
    d.innerHTML = `<div class="bRow"><span class="bNm" title="${esc(nm)}">${esc(
      nm
    )}</span><span class="bCt">(${esc(b.count)})</span></div>`;
    brandsWrap.appendChild(d);
  });

  // ✅ Toggle: sadece ALL modunda, arama yoksa, 20’den fazlaysa
  const shouldShowToggle =
    ACTIVE_SUPPLIER === SUPPLIERS.ALL && !isSearching && vis.length > 20;

  if (shouldShowToggle) {
    const tgl = document.createElement("div");
    tgl.className = "brandToggle";
    tgl.dataset.kind = "toggle";
    tgl.tabIndex = 0;
    const txt = brandListExpanded ? "Listeyi Daralt" : "Listeyi Genişlet";
    const arr = brandListExpanded ? "▲" : "▼";
    tgl.innerHTML = `<span class="arr">${esc(arr)}</span><span>${esc(txt)}</span>`;
    list.appendChild(tgl);
  }

  updateBrandChip();
  updateGuideFromState();
  applySupplierUi();

  if (ACTIVE_SUPPLIER !== SUPPLIERS.AKALIN) {
    const bar = ensureBrandSearchBar();
    const inp = bar?.querySelector?.("#brandSearchInputTop");
    if (bar && inp) {
      try {
        inp.dispatchEvent(new Event("input", { bubbles: false }));
      } catch {}
    }
  }
};

function toggleBrand(id, el) {
  SELECTED.has(id)
    ? (SELECTED.delete(id), el.classList.remove("sel"))
    : (SELECTED.add(id), el.classList.add("sel"));
  updateBrandChip();
  updateGuideFromState();
  applySupplierUi();
}

function toggleAllVisible() {
  const vis = getVisibleBrands();
  if (!vis.length) return;
  const allSelected = vis.every((b) => SELECTED.has(b.id));
  if (allSelected) vis.forEach((b) => SELECTED.delete(b.id));
  else vis.forEach((b) => SELECTED.add(b.id));
  renderBrands();
}

$("brandList")?.addEventListener("click", (e) => {
  const el = e.target.closest(".brand, .brandToggle");
  if (!el) return;
  const kind = el.dataset.kind || "brand";
  if (kind === "all") {
    toggleAllVisible();
    return;
  }
  if (kind === "toggle") {
    brandListExpanded = !brandListExpanded;
    renderBrands();
    return;
  }
  if (kind === "brand") {
    const id = el.dataset.id;
    const n = Number(id);
    Number.isFinite(n) && toggleBrand(n, el);
  }
});
$("brandList")?.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const el = e.target.closest(".brand, .brandToggle");
  if (!el) return;
  const kind = el.dataset.kind || "brand";
  if (kind === "toggle") {
    e.preventDefault();
    brandListExpanded = !brandListExpanded;
    renderBrands();
    return;
  }
  if (kind === "all") {
    e.preventDefault();
    toggleAllVisible();
    return;
  }
  if (kind === "brand") {
    e.preventDefault();
    const id = el.dataset.id;
    const n = Number(id);
    Number.isFinite(n) && toggleBrand(n, el);
  }
});

// =========================
// Supplier dropdown
// =========================
let COMPEL_BRANDS_CACHE = null;

async function initBrands() {
  brandPrefix = "Hazır";
  const el = $("brandStatus");
  el && (el.textContent = "Markalar yükleniyor…", (el.title = el.textContent));
  try {
    const data = await loadBrands(API_BASE);
    COMPEL_BRANDS_CACHE = data;
    if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL) BRANDS = data;
  } catch (e) {
    console.error(e);
    if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL) {
      const el2 = $("brandStatus");
      el2 && (el2.textContent = "Markalar yüklenemedi (API).", (el2.title = el2.textContent));
    }
  } finally {
    renderBrands();
    applySupplierUi();
  }
}

(() => {
  const wrap = $("supplierWrap"),
    btn = $("supplierBtn"),
    menu = $("supplierMenu"),
    addBtn = $("supplierAddBtn"),
    itC = $("supplierCompelItem"),
    itAll = $("supplierAllItem"),
    itA = $("supplierAkalinItem");

  if (!wrap || !btn || !menu || !itC || !itAll || !itA) return;

  const open = () => {
    menu.classList.add("show");
    menu.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    menu.classList.remove("show");
    menu.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");
  };
  const toggle = () => (menu.classList.contains("show") ? close() : open());

  const paint = () => {
    const mk = (el, name) => {
      const sel = ACTIVE_SUPPLIER === name;
      el.setAttribute("aria-disabled", sel ? "true" : "false");
      el.textContent = sel ? `${name} (seçili)` : name;
    };
    mk(itC, SUPPLIERS.COMPEL);
    mk(itAll, SUPPLIERS.ALL);
    mk(itA, SUPPLIERS.AKALIN);
  };

  const setSupplier = async (name) => {
    if (!name || name === ACTIVE_SUPPLIER) {
      close();
      return;
    }

    ACTIVE_SUPPLIER = name;

    const lab = $("supplierLabel");
    lab && (lab.textContent = `1) Tedarikçi: ${name}`);

    if (name === SUPPLIERS.AKALIN) {
      brandPrefix = "Akalın";
      BRANDS = [];
    } else if (name === SUPPLIERS.ALL) {
      brandPrefix = "Tüm Markalar";
      BRANDS = buildCanonicalBrandList().map((b, i) => ({ ...b, id: i + 1 }));
    } else {
      brandPrefix = "Hazır";
      if (COMPEL_BRANDS_CACHE?.length) BRANDS = COMPEL_BRANDS_CACHE;
      else await initBrands();
    }

    resetAll();
    paint();
    close();
  };

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    paint();
    toggle();
  });

  itC.addEventListener("click", (e) => {
    e.preventDefault();
    if (itC.getAttribute("aria-disabled") === "true") return;
    void setSupplier(SUPPLIERS.COMPEL);
  });

  itAll.addEventListener("click", (e) => {
    e.preventDefault();
    if (itAll.getAttribute("aria-disabled") === "true") return;
    void setSupplier(SUPPLIERS.ALL);
  });

  itA.addEventListener("click", (e) => {
    e.preventDefault();
    if (itA.getAttribute("aria-disabled") === "true") return;
    void setSupplier(SUPPLIERS.AKALIN);
  });

  addBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    close();
  });

  document.addEventListener("click", (e) => !wrap.contains(e.target) && close());
  addEventListener("keydown", (e) => e.key === "Escape" && close());
  paint();
})();

// =========================
// Supplier UI behavior
// =========================
function applySupplierUi() {
  const go = $("go");
  if (go) {
    if (ACTIVE_SUPPLIER === SUPPLIERS.AKALIN) {
      go.classList.add("wip");
      go.title = "Yapım Aşamasında";
    } else {
      go.classList.remove("wip");
      go.title = "Listele";
    }
  }

  const dl1 = $("dl1");
  dl1 && (dl1.style.display = "none");

  const l1 = $("l1Chip");
  if (l1) l1.style.display = ACTIVE_SUPPLIER === SUPPLIERS.ALL ? "none" : "";

  showHideBrandSearchBar();

  if (ACTIVE_SUPPLIER === SUPPLIERS.AKALIN) {
    INFO_HIDE_IDS.forEach((id) => {
      const el = $(id);
      el && (el.style.display = "none");
    });
    setStatus("Tedarikçi Akalın entegre edilmedi. Lütfen farklı bir tedarikçi seçin.", "bad");
  } else {
    INFO_HIDE_IDS.forEach((id) => {
      const el = $(id);
      el && (el.style.display = "");
    });
    setStatus("Hazır", "ok");
    updateBrandChip();
  }

  updateGuideUI();
}

// =========================
// Depot + Matcher + Renderer
// =========================
const depot = createDepot({
  ui,
  normBrand,
  onDepotLoaded: async () => {
    updateGuideFromState();

    DAILY_SELECTED.aide = "";
    paintDailyUI();

    if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL && matcher.hasData()) {
      matcher.runMatch();
      refreshCompel();
    }

    applySupplierUi();

    try {
      const cb = $("aideSaveToday");
      if (cb?.checked) {
        if (!ensureSaveCredOrCancel()) {
          cb.checked = false;
          return;
        }
        const raw = depot.getLastRaw() || "";
        if (raw.trim()) {
          setStatus("Aide kaydediliyor…", "unk");
          await dailySave(API_BASE, {
            kind: "aide",
            adminPassword: DAILY_SAVE_CRED.adminPassword,
            readPassword: DAILY_SAVE_CRED.readPassword,
            data: raw,
          });
          setStatus("Aide kaydedildi", "ok");
          cb.checked = false;
          await refreshDailyMeta();
        }
      }
    } catch (err) {
      console.error(err);
      setStatus(String(err?.message || err), "bad");
      alert(String(err?.message || err));
    }
  },
});

const matcher = createMatcher({
  getDepotAgg: () => depot.agg,
  isDepotReady: () => depot.isReady(),
});

const renderer = createRenderer({ ui });

// =========================
// List title
// =========================
let listTitleEl = null,
  listSepEl = null,
  lastListedTitle = "",
  goMode = "list";

const joinTrList = (arr) => {
  const a = (arr || []).filter(Boolean);
  if (!a.length) return "";
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} ve ${a[1]}`;
  return `${a.slice(0, -1).join(", ")} ve ${a[a.length - 1]}`;
};

const getSupplierName = () => {
  const t = (($("supplierLabel")?.textContent || $("supplierBtn")?.textContent) || "").trim();
  const m = t.match(/:\s*(.+)\s*$/);
  return (m ? (m[1] || "") : t.replace(/^1\)\s*/i, "").replace(/^Tedarikçi\s*/i, "")).trim() || "—";
};

const getSelectedBrandNames = () => {
  const out = [];
  for (const id of SELECTED) {
    const b = BRANDS.find((x) => x.id === id);
    b?.name && out.push(toTitleCaseTR(String(b.name)));
  }
  out.sort((a, b) => a.localeCompare(b, "tr", { sensitivity: "base" }));
  return out;
};

const buildListTitle = () => {
  const sup = getSupplierName(),
    brands = getSelectedBrandNames();
  if (!brands.length) return `Tedarikçi ${sup} için marka seçilmedi.`;
  const brTxt = joinTrList(brands);

  if (ACTIVE_SUPPLIER === SUPPLIERS.ALL) {
    return `Tüm Markalar için ${brTxt} ${(brands.length === 1 ? "markasında" : "markalarında")} yapılan T-Soft ve Aide karşılaştırma listesi`;
  }
  return `Tedarikçi ${sup} için ${brTxt} ${(brands.length === 1 ? "markasında" : "markalarında")} yapılan T-Soft ve Aide karşılaştırma listesi`;
};

const ensureListHeader = () => {
  const main = document.querySelector("section.maincol");
  if (!main || listTitleEl) return;
  const sep = document.createElement("div");
  sep.className = "rowSep";
  sep.setAttribute("aria-hidden", "true");

  listTitleEl = document.createElement("div");
  listTitleEl.id = "listTitle";
  listTitleEl.className = "listTitleBar";

  const first = main.firstElementChild;
  main.insertBefore(sep, first);
  main.insertBefore(listTitleEl, first);

  listSepEl = sep;
  listTitleEl.style.display = "none";
  listSepEl.style.display = "none";
};

const setListTitleVisible = (show) => {
  ensureListHeader();
  listTitleEl && (listTitleEl.style.display = show ? "" : "none");
  listSepEl && (listSepEl.style.display = show ? "" : "none");
};

const lockListTitleFromCurrentSelection = () => {
  ensureListHeader();
  lastListedTitle = buildListTitle();
  listTitleEl && (listTitleEl.textContent = lastListedTitle);
};

// =========================
// Common helpers
// =========================
const setGoMode = (mode) => {
  goMode = mode;
  const b = $("go");
  if (!b) return;
  b.textContent = mode === "clear" ? "Temizle" : "Listele";
  b.title = b.textContent;
};

const clearOnlyLists = () => {
  const t1 = $("t1"),
    t2 = $("t2"),
    t2L = $("t2L"),
    t2R = $("t2R");
  t1 && (t1.innerHTML = "");
  t2 && (t2.innerHTML = "");
  t2L && (t2L.innerHTML = "");
  t2R && (t2R.innerHTML = "");
  const sec = $("unmatchedSection");
  sec && (sec.style.display = "none");
  const split = $("unmatchedSplitSection");
  split && (split.style.display = "none");
  setListTitleVisible(false);
  setChip("sum", "✓0 • ✕0", "muted");
};

// =========================
// Scan state
// =========================
let abortCtrl = null;

const setScanState = (on) => {
  const goBtn = $("go");
  goBtn && (goBtn.disabled = on);
  $("f2") && ($("f2").disabled = on);
  $("depoBtn") && ($("depoBtn").disabled = on);

  $("tsoftDailyBtn") && ($("tsoftDailyBtn").disabled = on || $("tsoftDailyBtn").disabled);
  $("aideDailyBtn") && ($("aideDailyBtn").disabled = on || $("aideDailyBtn").disabled);
};

// =========================
// T-Soft popover
// =========================
(() => {
  const box = $("sescBox"),
    inp = $("f2"),
    modal = $("tsoftModal"),
    inner = $("tsoftInner"),
    pick = $("tsoftClose"),
    dismiss = $("tsoftDismiss");
  if (!box || !inp || !modal || !inner || !pick || !dismiss) return;

  let allow = false;
  const isOpen = () => modal.style.display === "block";

  const place = () => {
    inner.style.position = "fixed";
    inner.style.left = "12px";
    inner.style.top = "12px";
    inner.style.visibility = "hidden";
    requestAnimationFrame(() => {
      const a = box.getBoundingClientRect(),
        r = inner.getBoundingClientRect(),
        root = getComputedStyle(document.documentElement);
      const M = parseFloat(root.getPropertyValue("--popM")) || 12,
        G = parseFloat(root.getPropertyValue("--popGap")) || 10;
      let left = a.left;
      left = Math.max(M, Math.min(left, window.innerWidth - r.width - M));
      let top = a.top - r.height - G;
      if (top < M) top = a.bottom + G;
      top = Math.max(M, Math.min(top, window.innerHeight - r.height - M));
      inner.style.left = left + "px";
      inner.style.top = top + "px";
      inner.style.visibility = "visible";
    });
  };

  const show = () => {
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");
    place();
    setTimeout(() => pick.focus(), 0);
  };

  const hide = () => {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    inner.style.position = "";
    inner.style.left = "";
    inner.style.top = "";
    inner.style.visibility = "";
  };

  const openPicker = () => {
    allow = true;
    hide();
    requestAnimationFrame(() => {
      try {
        inp.click();
      } finally {
        setTimeout(() => {
          allow = false;
        }, 0);
      }
    });
  };

  box.addEventListener(
    "click",
    (e) => {
      if (inp.disabled) return;
      if (allow) {
        allow = false;
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      show();
    },
    true
  );

  pick.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openPicker();
  });

  dismiss.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    hide();
  });

  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isOpen()) return;
    e.preventDefault();
    e.stopPropagation();
    openPicker();
  });

  addEventListener("resize", () => isOpen() && place());
  addEventListener("scroll", () => isOpen() && place(), true);

  const cb = $("tsoftSaveToday");
  cb &&
    cb.addEventListener("change", () => {
      cb.checked && !ensureSaveCredOrCancel() && (cb.checked = false);
    });
})();

// file label
const bind = (inId, outId, empty) => {
  const inp = $(inId),
    out = $(outId);
  if (!inp || !out) return;
  const upd = () => {
    const f = inp.files?.[0];
    if (!f) {
      out.textContent = empty;
      out.title = empty;
    } else {
      out.textContent = "Seçildi";
      out.title = f.name;
    }

    f && (DAILY_SELECTED.tsoft = "", paintDailyUI());
    updateGuideFromState();
    applySupplierUi();
  };
  inp.addEventListener("change", upd);
  upd();
};
bind("f2", "n2", "Yükle");

$("aideSaveToday")?.addEventListener("change", (e) => {
  const cb = e.target;
  cb.checked && !ensureSaveCredOrCancel() && (cb.checked = false);
});

// =========================
// 1) COMPEL MODE
// =========================
function refreshCompel() {
  const { R } = matcher.getResults();
  const Ux = [];
  renderer.render(R, Ux, depot.isReady());
  applySupplierUi();
}

async function generateCompel() {
  const needDaily = !!(DAILY_SELECTED.tsoft || DAILY_SELECTED.aide);
  const file = $("f2")?.files?.[0];
  if (!file && !DAILY_SELECTED.tsoft) {
    alert("Lütfen T-Soft Stok CSV seç veya dünkü veriyi seç.");
    return false;
  }

  setStatus("Okunuyor…", "unk");
  setChip("l1Chip", "Compel:—");
  setChip("l2Chip", "T-Soft:—");

  abortCtrl = new AbortController();
  setScanState(true);

  try {
    clearOnlyLists();
    matcher.resetAll();

    const selected = BRANDS.filter((x) => SELECTED.has(x.id));
    if (selected.length === BRANDS.length && !confirm("Tüm markaları taramak üzeresiniz. Emin misiniz?"))
      throw new Error("İptal edildi.");

    let t2txt = "";
    if (needDaily) {
      const ymdSel = String(DAILY_SELECTED.tsoft || DAILY_SELECTED.aide || "").trim();
      if (!ymdSel) throw new Error("Seçilen tarih bulunamadı.");
      const pass = await getReadPassOrPrompt(ymdSel);
      const want = [];
      DAILY_SELECTED.tsoft && want.push("tsoft");
      DAILY_SELECTED.aide && want.push("aide");
      setStatus("Seçilen gün verisi alınıyor…", "unk");
      const got = await dailyGet(API_BASE, { date: ymdSel, password: pass, want });
      DAILY_READ_CACHE = { date: ymdSel, pass };

      if (DAILY_SELECTED.tsoft) {
        const d = got?.tsoft;
        if (!d?.exists || !d?.data) throw new Error("Seçilen günün T-Soft verisi bulunamadı.");
        t2txt = String(d.data || "");
      }

      if (DAILY_SELECTED.aide) {
        const d = got?.aide;
        if (!d?.exists || !d?.data) throw new Error("Seçilen günün Aide verisi bulunamadı.");
        depot.reset();
        depot.loadText(String(d.data || ""));
        setChip("l4Chip", `Aide:${depot.count()}`);
      }
    }

    const t2Promise = t2txt ? Promise.resolve(t2txt) : readFileText(file);
    let seq = 0;

    const chosen = selected.map((b) => ({ id: b.id, slug: b.slug, name: b.name, count: b.count }));

    const scanPromise = (async () => {
      const rows = [];
      await scanCompel(API_BASE, chosen, {
        signal: abortCtrl.signal,
        onMessage: (m) => {
          if (!m) return;
          if (m.type === "brandStart" || m.type === "page")
            setStatus(`Taranıyor: ${m.brand || ""} (${m.page || 0}/${m.pages || 0})`, "unk");
          else if (m.type === "product") {
            const p = m.data || {};
            seq++;
            rows.push({
              "Sıra No": String(seq),
              Marka: String(p.brand || ""),
              "Ürün Adı": String(p.title || "Ürün"),
              "Ürün Kodu": String(p.productCode || ""),
              Stok: String(p.stock || ""),
              EAN: String(p.ean || ""),
              Link: String(p.url || ""),
            });
            seq % 250 === 0 && setChip("l1Chip", `Compel:${rows.length}`);
          }
        },
      });
      return rows;
    })();

    const [t2txtFinal, L1] = await Promise.all([t2Promise, scanPromise]);
    setChip("l1Chip", `Compel:${L1.length}`);

    const p2 = parseDelimited(t2txtFinal);
    if (!p2.rows.length) {
      alert("T-Soft CSV boş görünüyor.");
      return false;
    }

    const s2 = p2.rows[0];
    const C1 = { siraNo: "Sıra No", marka: "Marka", urunAdi: "Ürün Adı", urunKodu: "Ürün Kodu", stok: "Stok", ean: "EAN", link: "Link" };

    const C2 = {
      ws: pickColumn(s2, ["Web Servis Kodu", "WebServis Kodu", "WebServisKodu"]),
      urunAdi: pickColumn(s2, ["Ürün Adı", "Urun Adi", "Ürün Adi"]),
      sup: pickColumn(s2, ["Tedarikçi Ürün Kodu", "Tedarikci Urun Kodu", "Tedarikçi Urun Kodu"]),
      barkod: pickColumn(s2, ["Barkod", "BARKOD"]),
      stok: pickColumn(s2, ["Stok"]),
      marka: pickColumn(s2, ["Marka"]),
      seo: pickColumn(s2, ["SEO Link", "Seo Link", "SEO", "Seo"]),
      aktif: pickColumn(s2, ["Aktif", "AKTIF", "Active", "ACTIVE"]),
    };

    const miss = ["ws", "sup", "barkod", "stok", "marka", "urunAdi", "seo"].filter((k) => !C2[k]);
    if (miss.length) {
      setStatus("Sütun eksik", "bad");
      alert("T-Soft CSV sütunları eksik. Konsola bak.");
      console.warn("L2 missing", miss);
      return false;
    }

    const L2all = p2.rows;

    try {
      const cb = $("tsoftSaveToday");
      if (cb?.checked) {
        if (!ensureSaveCredOrCancel()) cb.checked = false;
        else {
          setStatus("T-Soft kaydediliyor…", "unk");
          await dailySave(API_BASE, {
            kind: "tsoft",
            adminPassword: DAILY_SAVE_CRED.adminPassword,
            readPassword: DAILY_SAVE_CRED.readPassword,
            data: t2txtFinal,
          });
          setStatus("T-Soft kaydedildi", "ok");
          cb.checked = false;
          await refreshDailyMeta();
        }
      }
    } catch (err) {
      console.error(err);
      setStatus(String(err?.message || err), "bad");
      alert(String(err?.message || err));
    }

    const compelBrandsNorm = new Set(L1.map((r) => normBrand(r[C1.marka] || "")).filter(Boolean));
    const L2 = L2all.filter((r) => compelBrandsNorm.has(normBrand(r[C2.marka] || "")));

    matcher.loadData({ l1: L1, c1: C1, l2: L2, c2: C2, l2All: L2all });
    matcher.runMatch();
    refreshCompel();

    setStatus("Hazır", "ok");
    setChip("l2Chip", `T-Soft:${L2.length}/${L2all.length}`);

    lockListTitleFromCurrentSelection();
    setListTitleVisible(true);

    updateGuideFromState();

    return true;
  } catch (e) {
    String(e?.message || "").toLowerCase().includes("unauthorized") && (DAILY_READ_CACHE = { date: "", pass: "" });
    console.error(e);
    setStatus(String(e?.message || "Hata (konsol)"), "bad");
    alert(e?.message || String(e));
    return false;
  } finally {
    abortCtrl = null;
    setScanState(false);
    applySupplierUi();
    paintDailyUI();
  }
}

// =========================
// 2) TÜM MARKALAR MODE
// =========================
function codeNorm(s) {
  return (s ?? "").toString().replace(/\u00A0/g, " ").trim().replace(/\s+/g, " ").toLocaleUpperCase(TR);
}
function codeAlt(n) {
  const k = codeNorm(n);
  if (!k || !/^[0-9]+$/.test(k)) return "";
  return k.replace(/^0+(?=\d)/, "");
}

function buildSelectedBrandNormSet_AllMode() {
  const out = new Set();
  for (const id of SELECTED) {
    const b = BRANDS.find((x) => x.id === id);
    if (!b?.name) continue;
    const bn = normBrand(b.name);
    bn && out.add(bn);
  }
  return out;
}

function parseTsoftRowsToMap(rows) {
  const out = new Map();
  if (!rows?.length) return out;

  const sample = rows[0];
  const C = {
    sup: pickColumn(sample, ["Tedarikçi Ürün Kodu", "Tedarikci Urun Kodu", "Tedarikçi Urun Kodu"]),
    marka: pickColumn(sample, ["Marka"]),
    urunAdi: pickColumn(sample, ["Ürün Adı", "Urun Adi", "Ürün Adi", "Product Name", "Product"]),
    stok: pickColumn(sample, ["Stok"]),
    aktif: pickColumn(sample, ["Aktif", "AKTIF", "Active", "ACTIVE"]),
    seo: pickColumn(sample, ["SEO Link", "Seo Link", "SEO", "Seo"]),
  };

  const miss = ["sup", "marka", "urunAdi", "stok"].filter((k) => !C[k]);
  if (miss.length) throw new Error("T-Soft CSV sütunları eksik: " + miss.join(", "));

  const parseAktif = (v) => {
    const s = (v ?? "").toString().trim().toLowerCase();
    if (!s) return null;
    if (s === "true" || s === "1" || s === "yes" || s === "evet") return true;
    if (s === "false" || s === "0" || s === "no" || s === "hayir" || s === "hayır") return false;
    return null;
  };

  for (const r of rows) {
    const brDispRaw = T(r[C.marka] ?? "");
    const brNorm = normBrand(brDispRaw);
    if (!brNorm) continue;

    const supRaw = T(r[C.sup] ?? "");
    if (!supRaw) continue;
    const k1 = codeNorm(supRaw);
    const k2 = codeAlt(k1);
    const key = k2 || k1;

    const nm = T(r[C.urunAdi] ?? "");
    const stokRaw = T(r[C.stok] ?? "");
    const stokNum = stockToNumber(stokRaw, { source: "products" });
    const aktif = C.aktif ? parseAktif(r[C.aktif]) : null;

    out.has(brNorm) || out.set(brNorm, new Map());
    const m = out.get(brNorm);

    if (!m.has(key)) {
      m.set(key, {
        brandNorm: brNorm,
        brandDisp: toTitleCaseTR(brDispRaw),
        code: key,
        name: nm,
        stokNum,
        aktif,
      });
    } else {
      const it = m.get(key);
      if (!it.name && nm) it.name = nm;
      if (!Number.isFinite(it.stokNum)) it.stokNum = stokNum;
    }
  }
  return out;
}

function updateBrandCountsFromMaps({ tsoftMap, aideMap }) {
  const countByBrandNorm = new Map();
  const addCodes = (brNorm, codes) => {
    if (!brNorm) return;
    countByBrandNorm.has(brNorm) || countByBrandNorm.set(brNorm, new Set());
    const s = countByBrandNorm.get(brNorm);
    for (const c of codes) s.add(c);
  };

  for (const [br, m] of tsoftMap?.entries?.() || []) addCodes(br, m.keys());
  for (const [br, m] of aideMap?.entries?.() || []) addCodes(br, m.keys());

  for (const b of BRANDS) {
    const bn = normBrand(b.name);
    const set = bn ? countByBrandNorm.get(bn) : null;
    b.count = set ? String(set.size) : "0";
  }
}

function computeAllModeResult({ tsoftMap, aideMap, selectedBrandsNorm }) {
  const rows = [];
  const unmatchedTsoft = [];
  const unmatchedAide = [];

  const brandKeys = [...new Set([...(tsoftMap?.keys?.() || []), ...(aideMap?.keys?.() || [])])];
  const filteredBrands = brandKeys.filter((bn) => !selectedBrandsNorm || selectedBrandsNorm.has(bn));

  for (const brNorm of filteredBrands) {
    const tM = tsoftMap.get(brNorm) || new Map();
    const aM = aideMap.get(brNorm) || new Map();

    const codeSet = new Set([...tM.keys(), ...aM.keys()]);
    for (const code of codeSet) {
      const t = tM.get(code) || null;
      const a = aM.get(code) || null;

      const matched = !!(t && a);
      const tStock = t ? (Number.isFinite(t.stokNum) ? t.stokNum : 0) : 0;
      const aStock = a ? (Number.isFinite(a.num) ? a.num : 0) : 0;

      const stockOk = !matched ? true : (aStock > 0) === (tStock > 0);
      const pulse = matched && !stockOk;
      const tPassive = t?.aktif === false;

      const brandDisp = toTitleCaseTR((t?.brandDisp || "").trim() || brNorm);

      const r = {
        Marka: brandDisp,
        "Ürün Kodu (T-Soft)": t ? t.code : "",
        "Ürün Adı (T-Soft)": t ? t.name || "" : "",
        "Ürün Kodu (Aide)": a ? a.code : "",
        "Ürün Adı (Aide)": a ? a.name || "" : "",
        "Stok (T-Soft)": t ? tStock : 0,
        "Stok (Aide)": a ? aStock : 0,
        _m: matched,
        _stockOk: stockOk,
        _pulse: pulse,
        _tpassive: tPassive,
        _bn: brNorm,
      };

      rows.push(r);

      if (t && !a) {
        unmatchedTsoft.push({ Marka: brandDisp, "Ürün Kodu": t.code, "Ürün Adı": t.name || "", Stok: tStock, _bn: brNorm });
      }
      if (a && !t) {
        unmatchedAide.push({ Marka: brandDisp, "Ürün Kodu": a.code, "Ürün Adı": a.name || "", Stok: aStock, _bn: brNorm });
      }
    }
  }

  const cmpTR = (x, y) => String(x || "").localeCompare(String(y || ""), "tr", { sensitivity: "base" });

  const sortKey = (r) => {
    const b = r["Marka"] || "";
    const n = r["Ürün Adı (T-Soft)"] || r["Ürün Adı (Aide)"] || "";
    const c = r["Ürün Kodu (T-Soft)"] || r["Ürün Kodu (Aide)"] || "";
    return { b, n, c };
  };

  rows.sort((A, B) => {
    const aG = A._m ? (A._stockOk ? 1 : 2) : 3;
    const bG = B._m ? (B._stockOk ? 1 : 2) : 3;
    if (aG !== bG) return aG - bG;
    const ak = sortKey(A),
      bk = sortKey(B);
    const br = cmpTR(ak.b, bk.b);
    if (br) return br;
    const nm = cmpTR(ak.n, bk.n);
    if (nm) return nm;
    return cmpTR(ak.c, bk.c);
  });

  const sortUnm = (arr) =>
    arr.sort((a, b) => {
      const br = cmpTR(a["Marka"], b["Marka"]);
      if (br) return br;
      const nm = cmpTR(a["Ürün Adı"], b["Ürün Adı"]);
      if (nm) return nm;
      return cmpTR(a["Ürün Kodu"], b["Ürün Kodu"]);
    });

  sortUnm(unmatchedTsoft);
  sortUnm(unmatchedAide);

  return { rows, unmatchedTsoft, unmatchedAide };
}

async function generateAll() {
  const needDaily = !!(DAILY_SELECTED.tsoft || DAILY_SELECTED.aide);
  const file = $("f2")?.files?.[0];

  if (!file && !DAILY_SELECTED.tsoft) {
    alert("Lütfen T-Soft Stok CSV seç veya günlük veriyi seç.");
    return false;
  }
  if (!depot.isReady() && !DAILY_SELECTED.aide) {
    alert("Lütfen Aide verisi yükle/yapıştır veya günlük Aide verisini seç.");
    return false;
  }

  setStatus("Okunuyor…", "unk");
  setScanState(true);

  try {
    clearOnlyLists();

    let tsoftText = "";
    if (needDaily) {
      const ymdSel = String(DAILY_SELECTED.tsoft || DAILY_SELECTED.aide || "").trim();
      if (!ymdSel) throw new Error("Seçilen tarih bulunamadı.");
      const pass = await getReadPassOrPrompt(ymdSel);
      const want = [];
      DAILY_SELECTED.tsoft && want.push("tsoft");
      DAILY_SELECTED.aide && want.push("aide");
      setStatus("Seçilen gün verisi alınıyor…", "unk");
      const got = await dailyGet(API_BASE, { date: ymdSel, password: pass, want });
      DAILY_READ_CACHE = { date: ymdSel, pass };

      if (DAILY_SELECTED.tsoft) {
        const d = got?.tsoft;
        if (!d?.exists || !d?.data) throw new Error("Seçilen günün T-Soft verisi bulunamadı.");
        tsoftText = String(d.data || "");
      }

      if (DAILY_SELECTED.aide) {
        const d = got?.aide;
        if (!d?.exists || !d?.data) throw new Error("Seçilen günün Aide verisi bulunamadı.");
        depot.reset();
        depot.loadText(String(d.data || ""));
        setChip("l4Chip", `Aide:${depot.count()}`);
      }
    }

    const tsoftRaw = tsoftText ? tsoftText : await readFileText(file);

    const p = parseDelimited(tsoftRaw);
    if (!p.rows.length) throw new Error("T-Soft CSV boş görünüyor.");

    const tsoftMap = parseTsoftRowsToMap(p.rows);
    const aideMap = depot.getBrandItemMap();

    updateBrandCountsFromMaps({ tsoftMap, aideMap });
    renderBrands();

    const selectedBrandsNorm = buildSelectedBrandNormSet_AllMode();
    if (!selectedBrandsNorm.size) {
      alert("Lütfen en az 1 marka seçin.");
      return false;
    }

    const { rows, unmatchedTsoft, unmatchedAide } = computeAllModeResult({
      tsoftMap,
      aideMap,
      selectedBrandsNorm,
    });

    renderer.renderAll({ rows, unmatchedTsoft, unmatchedAide });

    setStatus("Hazır", "ok");
    lockListTitleFromCurrentSelection();
    setListTitleVisible(true);

    updateGuideFromState();

    return true;
  } catch (e) {
    String(e?.message || "").toLowerCase().includes("unauthorized") && (DAILY_READ_CACHE = { date: "", pass: "" });
    console.error(e);
    setStatus(String(e?.message || "Hata (konsol)"), "bad");
    alert(e?.message || String(e));
    return false;
  } finally {
    setScanState(false);
    applySupplierUi();
    paintDailyUI();
  }
}

// =========================
// reset all
// =========================
function resetAll() {
  try {
    abortCtrl?.abort?.();
  } catch {}
  abortCtrl = null;
  setScanState(false);

  hasEverListed = false;
  setGoMode("list");
  lastListedTitle = "";
  setListTitleVisible(false);

  SELECTED.clear();

  brandFilterText = "";
  brandListExpanded = false;

  const bar = ensureBrandSearchBar();
  const inp = bar?.querySelector?.("#brandSearchInputTop");
  if (inp) inp.value = "";

  renderBrands();

  const f2 = $("f2");
  f2 && (f2.value = "");
  const n2 = $("n2");
  n2 && (n2.textContent = "Yükle", (n2.title = "Yükle"));

  DAILY_SELECTED = { tsoft: "", aide: "" };
  DAILY_READ_CACHE = { date: "", pass: "" };
  DAILY_SAVE_CRED = null;

  $("tsoftSaveToday") && ($("tsoftSaveToday").checked = false);
  $("aideSaveToday") && ($("aideSaveToday").checked = false);

  paintDailyUI();

  depot.reset();
  matcher.resetAll();

  clearOnlyLists();

  setChip("l1Chip", "Compel:-");
  setChip("l2Chip", "T-Soft:-");
  setChip("l4Chip", "Aide:-");
  setChip("sum", "✓0 • ✕0", "muted");

  setGuideStep("brand");
  applySupplierUi();
}

// =========================
// go button
// =========================
async function handleGo() {
  if (ACTIVE_SUPPLIER === SUPPLIERS.AKALIN) {
    applySupplierUi();
    return;
  }

  if (goMode === "clear") {
    resetAll();
    return;
  }

  if (!hasEverListed && !SELECTED.size) {
    alert("Lütfen bir marka seçin");
    return;
  }

  if (!SELECTED.size) {
    clearOnlyLists();
    setGoMode("clear");
    return;
  }

  let ok = false;
  if (ACTIVE_SUPPLIER === SUPPLIERS.ALL) ok = await generateAll();
  else ok = await generateCompel();

  if (ok) {
    hasEverListed = true;
    setGoMode("list");
    setGuideStep("done");
  }
}

$("go") && ($("go").onclick = handleGo);

// =========================
// init
// =========================
ensureListHeader();
setGoMode("list");
setGuideStep("brand");

ensureBrandSearchBar();

if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL) initBrands();
else if (ACTIVE_SUPPLIER === SUPPLIERS.ALL) {
  BRANDS = buildCanonicalBrandList().map((b, i) => ({ ...b, id: i + 1 }));
  renderBrands();
} else renderBrands();

applySupplierUi();
refreshDailyMeta();
updateGuideFromState();
