// ./js/app.js
import { TR, esc, parseDelimited, pickColumn, readFileText, T, stockToNumber } from "./utils.js";
import { loadBrands, scanCompel, dailyMeta, dailyGet, dailySave } from "./api.js";
import { createMatcher, normBrand } from "./match.js";
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

const AIDE_BRAND_SEED = [
  "ABLETON","ADAM","AKAI","AKÇELİK","AKG","ALPHATHETA","APPLE","ART","ARTURIA","ASIMETRIKPRO",
  "ASTONMICROPHONES","AUDIENT","AUDIO TECHNICA","B&W","BEHRINGER","BEYER","BEYERDYNAMIC","BİOLİTE","BO",
  "BOSE PRO","BROS&COMPANY","CAMELBAK","CORSAIR","CTT","DECKSAVER","DENON","DIVOOM","DJ TECHTOOLS","D-VOİCE",
  "EARTHWORKS","ECLER","EIKON","ENOVA","ERALP","ESI AUDIO","EUROCLUB","EVENTIDE AUDIO","FENDER","FLİGHT","FOCAL",
  "FOCUSRİTE","GARMİN","GATOR","GEÇİCİ","GENELEC","GOBY LABS","GRAVITY","GTRS","HEADRUSH","HİFİMAN","HOSA",
  "IK MULTIMEDIA","INSTAX","JBL","KANTON","KIRLIN","KLARKTEKNIK","KORG","KOSS","KÖNIG & MEYER","KRK","LDSYSTEMS",
  "LENCO","MACKIE","MAONO","MARK STRINGS","M-AUDIO","MAXON","MODAL ELECTRONICS","MOGAMİ","MOONDROP","MOTU","NEDIS",
  "NEUMANN","NOVATION","NUMARK","ONEODIO","OXID","OXOGEAR","OYAIDE","PALMER","PATONA","PEAK DESIGN","PIONEER",
  "PRESONUS","RCF","RELOOP","RODE","ROLAND","RS AUDIO","SE ELEKTRONICS","SENNHEISER","SESCİBABA","SHURE","SLATE",
  "SOUNDBOKS","SSL","STEINBERG","STI","SUDIO","TAMA","TANNOY","TANTRUM","TASCAM","TC ELECTRONIC","TC HELICON",
  "TEENAGE ENGINEERING","TEKNIK","TIE","TOPPING AUDIO","TRİTON","TRUTHEAR","UFUK ONEN","ULTIMATE","ULTİMATE",
  "UNIVERSAL","WARMAUDIO","WORLDE","YAMAHA"
];

const TSOFT_BRAND_SEED = [
  "Behringer","Peak Design","M-Audio","Rode","Ableton","Nedis","Arturia","Rcf","Universal Audio","Marantz","Numark",
  "Denon DJ","Presonus","Lindell Audio","Access Music","Genelec","Audio Technica","Rane","Avalon","Crane Song",
  "Rupert Neve","Native Instruments","Steinberg","Warm Audio","Audient","IsoAcoustics","Mxl","ADAM Audio","ESI Audio",
  "Radial Engineering","IK Multimedia","Focusrite","Novation","Mackie","Nektar","Apogee","Yamaha","Turbosound","Nord",
  "sE Electronics","Sennheiser","Dynaudio","Bowers & Wilkins","Neumann","Pioneer","König & Meyer","Hosa","M&K Sound",
  "Audix","Focal","Alesis","Boss","Shure","SesciBaba","TC Electronic","TC Helicon","CTT","Denon","Inter","Marshall",
  "I Light","AKG","CROWN","JBL","BSS","Aston Microphones","ENOVA","KRK Systems","KALI Audio","HEADRUSH","Neutrik",
  "Icon Pro Audio","Joué","AC Infinity","Disan","EVE AUDIO","Acme","Bosch","Christie","Impact","ITC","Arya","ASY",
  "Cosmo","ICA","LD System","Toa","SonarWorks","MOTU","DPA Microphones","MIDIPLUS","RME","SSL","Modal Electronics",
  "Martin Audio","Slate Digital","Stanton","Reloop","Lab Gruppen","Worlde","Beyerdynamic","Audeze","Cranborne Audio",
  "Tie Products","SoundSwitch","Maono","AKAI","KORG","Steven Slate Audio","M-Game","SOUNDBOKS","Monster Cable","NEO",
  "OneOdio","Polyend","Sudio","Mogami","AVMATRIX","Nedis Cable","Gator Frameworks","Reloop HiFi","PeakDesign","Truthear",
  "Decksaver","Procase","AlphaTheta","Maxon","Antelope Audio","Sheeran Loopers","Yellowtec","4THEWALL","Bose",
  "Ultimate Support","Studiologic by Fatar","Erica Synths","Soma Synths","Gravity","Technics","TECHNICS","Polk Audio",
  "DALI Audio","Relacart","D&R Electronica","Ecler","Telefunken","Harrison Audio","Triton Audio","LENCO","KANTO",
  "D-Voice","Allen Heath","DJ TechTools","Oxogear","Lake People","Topping Professional","Palmer","LD Systems","EIKON",
  "Moondrop","VOX","Sequenz","WAGON","SAKAE","Doto Design","Neo Created by OYAIDE Elec.","Eventide Audio","Barefoot",
  "Eve Audio","PSI Audio","Tantrum Audio","ATC Loudspeakers","Topping Audio","Teenage Engineering","Koss","Hifiman",
  "Phase","Odisei Music","MXL Microphones","Signex","Drawmer","Midiplus","Auratone","Sivga Audio","Sendy Audio",
  "Earthworks Audio","Telefunken Elektroakustik","Steven Slate | Audio","Embodme","CEntrance","Freqport","Evo By Audient",
  "Monster Audio","Rhodes","High Line","Fender Studio","Corsair"
];

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

function buildCanonicalBrandList() {
  const pref = new Map();
  const tsoftSet = new Set(TSOFT_BRAND_SEED.map((x) => String(x || "").trim()).filter(Boolean));

  const add = (name, pr) => {
    const nm = String(name || "").trim();
    if (!nm) return;
    const k = normBrand(nm);
    if (!k) return;
    if (!pref.has(k)) pref.set(k, nm);
    else {
      const cur = pref.get(k);
      const curPr = cur && tsoftSet.has(cur) ? 2 : 1;
      if (pr > curPr) pref.set(k, nm);
    }
  };

  for (const nm of AIDE_BRAND_SEED) add(nm, 1);
  for (const nm of TSOFT_BRAND_SEED) add(nm, 2);

  return [...pref.entries()]
    .map(([brNorm, name]) => ({ id: brNorm, slug: brNorm, name, count: "—" }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "tr", { sensitivity: "base" }));
}

let guideStep = "brand";
const GUIDE_DUR = { brand: 1500, tsoft: 1250, aide: 1050, list: 900 };
const clearGuidePulse = () =>
  ["brandHintBtn", "sescBox", "depoBtn", "go", "tsoftDailyBtn", "aideDailyBtn"].forEach((id) => {
    const el = $(id);
    el && (el.classList.remove("guidePulse"), el.style.removeProperty("--guideDur"));
  });
const setGuideStep = (s) => ((guideStep = s || "done"), updateGuideUI());
const updateGuideUI = () => {
  clearGuidePulse();
  if (ACTIVE_SUPPLIER === SUPPLIERS.AKALIN || guideStep === "done") return;
  const dur = GUIDE_DUR[guideStep] || 1200;
  const apply = (el) =>
    el && (el.style.setProperty("--guideDur", `${dur}ms`), el.classList.add("guidePulse"));
  if (guideStep === "brand") apply($("brandHintBtn"));
  else if (guideStep === "tsoft") apply($("sescBox"));
  else if (guideStep === "aide") apply($("depoBtn"));
  else if (guideStep === "list") apply($("go"));
};

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

const BRAND_SEARCH_PLACEHOLDER = "Marka Ara";
const BRAND_SEARCH_MIN_CH = Math.max(9, BRAND_SEARCH_PLACEHOLDER.length + 1);
const BRAND_SEARCH_MAX_CH = 48;
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

let brandSearchSlotEl = null;
let brandSearchInputEl = null;

function syncBrandSearchSize() {
  if (!brandSearchInputEl) return;
  const v = String(brandSearchInputEl.value || "");
  const want = v ? (v.length + 1) : BRAND_SEARCH_PLACEHOLDER.length;
  const sz = clamp(want, BRAND_SEARCH_MIN_CH, BRAND_SEARCH_MAX_CH);
  brandSearchInputEl.size = sz;
}

(() => {
  const st = document.createElement("style");
  st.textContent = `
    .brandSearchSlot{flex:1 1 auto;min-width:0;display:flex;align-items:center;justify-content:center}
    .brandSearchBox{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 10px;border:1px solid var(--border-2);border-radius:10px;background:var(--bg-panel);box-sizing:border-box;width:auto;max-width:min(520px,92vw)}
    .brandSearchBox .ic{opacity:.88;font-weight:1100;color:var(--text-2);white-space:nowrap;user-select:none;flex:0 0 auto}
    .brandSearchBox input{width:auto;background:transparent;border:0;outline:none;color:var(--text);font-weight:1100;font-size:14px;padding:0;margin:0;min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .brandSearchBox input::placeholder{color:var(--text-2);opacity:.85}
    .brandToggle{display:flex;justify-content:center;align-items:center;gap:8px;width:100%;padding:8px 0 2px;user-select:none;cursor:pointer;font-weight:1100;color:var(--text-2)}
    .brandToggle:hover{color:var(--text)}
    .brandToggle .arr{font-size:14px;opacity:.9}
    .guidePulse{animation-timing-function:ease-in!important}
  `;
  document.head.appendChild(st);
})();

let DAILY_META = null;
let DAILY_SELECTED = { tsoft: "", aide: "" };
let DAILY_READ_CACHE = { date: "", pass: "" };
let DAILY_SAVE_CRED = null;

const setBtnSel = (btn, sel) => { if (!btn) return; sel ? btn.classList.add("sel") : btn.classList.remove("sel"); };

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
  const todayAide = DAILY_META?.today?.aide || DAILY_META?.aide?.today || DAILY_META?.todayAide || DAILY_META?.aideToday || null;
  const yesterdayAide = DAILY_META?.yesterday?.aide || DAILY_META?.aide?.yesterday || DAILY_META?.yesterdayAide || DAILY_META?.aideYesterday || null;
  const todayExists = !!(todayAide?.exists || DAILY_META?.today?.aideExists || DAILY_META?.today?.aide?.exists);
  const yestExists = !!(yesterdayAide?.exists || DAILY_META?.yesterday?.aideExists || DAILY_META?.yesterday?.aide?.exists);
  const todayDate = pickDateFrom(DAILY_META?.today);
  const yestDate = pickDateFrom(DAILY_META?.yesterday);
  if (todayExists) {
    const hm = pickHMFrom(todayAide) || pickHMFrom(DAILY_META?.today) || "";
    return { exists: true, isToday: true, ymd: todayDate.ymd, dmy: todayDate.dmy, hm };
  }
  if (yestExists) return { exists: true, isToday: false, ymd: yestDate.ymd, dmy: yestDate.dmy, hm: "" };
  return { exists: false, isToday: false, ymd: "", dmy: "", hm: "" };
}
function getTsoftDailyPick() {
  const todayTsoft = DAILY_META?.today?.tsoft || DAILY_META?.tsoft?.today || DAILY_META?.todayTsoft || DAILY_META?.tsoftToday || null;
  const yesterdayTsoft = DAILY_META?.yesterday?.tsoft || DAILY_META?.tsoft?.yesterday || DAILY_META?.yesterdayTsoft || DAILY_META?.tsoftYesterday || null;
  const todayExists = !!(todayTsoft?.exists || DAILY_META?.today?.tsoftExists || DAILY_META?.today?.tsoft?.exists);
  const yestExists = !!(yesterdayTsoft?.exists || DAILY_META?.yesterday?.tsoftExists || DAILY_META?.yesterday?.tsoft?.exists);
  const todayDate = pickDateFrom(DAILY_META?.today);
  const yestDate = pickDateFrom(DAILY_META?.yesterday);
  if (todayExists) {
    const hm = pickHMFrom(todayTsoft) || pickHMFrom(DAILY_META?.today) || "";
    return { exists: true, isToday: true, ymd: todayDate.ymd, dmy: todayDate.dmy, hm };
  }
  if (yestExists) return { exists: true, isToday: false, ymd: yestDate.ymd, dmy: yestDate.dmy, hm: "" };
  return { exists: false, isToday: false, ymd: "", dmy: "", hm: "" };
}
function paintDailyUI() {
  const tBtn = $("tsoftDailyBtn"), aBtn = $("aideDailyBtn");

  const tPick = getTsoftDailyPick();
  const tLabel = tPick.exists
    ? tPick.isToday
      ? tPick.hm ? `Bugün ${tPick.hm} Tarihli Veri` : "Bugün — Tarihli Veri"
      : tPick.dmy ? `${tPick.dmy} Tarihli Veri` : "—"
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
      ? aPick.hm ? `Bugün ${aPick.hm} Tarihli Veri` : "Bugün — Tarihli Veri"
      : aPick.dmy ? `${aPick.dmy} Tarihli Veri` : "—"
    : "—";
  const aSel = !!(aPick.ymd && DAILY_SELECTED.aide && DAILY_SELECTED.aide === aPick.ymd);
  if (aBtn) {
    aBtn.disabled = !aPick.exists;
    aBtn.title = aPick.exists ? aLabel : "—";
    aBtn.textContent = aSel ? "Seçildi" : aLabel;
    setBtnSel(aBtn, aSel);
  }

  const tPrev = $("tsoftPrev"), aPrev = $("aidePrev");
  if (tPrev) (tPrev.style.display = "none"), (tPrev.textContent = ""), (tPrev.title = "");
  if (aPrev) (aPrev.style.display = "none"), (aPrev.textContent = ""), (aPrev.title = "");
}
async function refreshDailyMeta() {
  try { DAILY_META = await dailyMeta(API_BASE); }
  catch { DAILY_META = null; }
  paintDailyUI();
}
function closeModalByButton(btnId) { const b = $(btnId); b && b.click(); }

function toggleDaily(kind) {
  if (kind === "tsoft") {
    const pick = getTsoftDailyPick();
    if (!pick?.exists || !pick?.ymd) return;
    const was = DAILY_SELECTED.tsoft === pick.ymd;
    DAILY_SELECTED.tsoft = was ? "" : pick.ymd;
    paintDailyUI();
    if (!was) closeModalByButton("tsoftDismiss");
    if (!was && DAILY_SELECTED.tsoft) setGuideStep("aide");
  } else if (kind === "aide") {
    const pick = getAideDailyPick();
    if (!pick?.exists || !pick?.ymd) return;
    const was = DAILY_SELECTED.aide === pick.ymd;
    DAILY_SELECTED.aide = was ? "" : pick.ymd;
    paintDailyUI();
    if (!was) closeModalByButton("depoClose");
    if (!was && DAILY_SELECTED.aide) setGuideStep("list");
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

$("tsoftDailyBtn")?.addEventListener("click", (e) => { e.preventDefault(); toggleDaily("tsoft"); });
$("aideDailyBtn")?.addEventListener("click", (e) => { e.preventDefault(); toggleDaily("aide"); });

let BRANDS = [];
let SELECTED = new Set();
let brandPrefix = "Hazır";
let hasEverListed = false;

let brandFilterText = "";
let brandListExpanded = false;

const COMPEL_LIMIT = 25;
const ALL_LIMIT = 3;

function ensureBrandSearchSlot() {
  const goBtn = $("go");
  const infoBox = $("infoBox");
  const leftControls = $("leftControls");
  if (!goBtn || !leftControls) return;

  if (!brandSearchSlotEl) {
    brandSearchSlotEl = document.createElement("div");
    brandSearchSlotEl.className = "brandSearchSlot";
    brandSearchSlotEl.innerHTML = `
      <div class="brandSearchBox" role="search" aria-label="Marka Ara">
        <span class="ic">🔎</span>
        <input id="brandSearchTopInput" type="text" placeholder="${esc(BRAND_SEARCH_PLACEHOLDER)}" autocomplete="off" />
      </div>
    `;
    if (infoBox && infoBox.parentElement === leftControls) leftControls.insertBefore(brandSearchSlotEl, infoBox);
    else {
      if (goBtn.nextSibling) leftControls.insertBefore(brandSearchSlotEl, goBtn.nextSibling);
      else leftControls.appendChild(brandSearchSlotEl);
    }

    brandSearchInputEl = $("brandSearchTopInput");
    if (brandSearchInputEl) {
      syncBrandSearchSize();
      brandSearchInputEl.addEventListener("input", () => {
        brandFilterText = String(brandSearchInputEl.value || "");
        syncBrandSearchSize();
        renderBrands();
      });
      brandSearchInputEl.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          brandFilterText = "";
          brandSearchInputEl.value = "";
          syncBrandSearchSize();
          renderBrands();
        }
      });
      brandSearchInputEl.addEventListener("blur", () => {
        if (!String(brandSearchInputEl.value || "").trim()) syncBrandSearchSize();
      });
    }
  }

  if (brandSearchSlotEl) brandSearchSlotEl.style.display = ACTIVE_SUPPLIER === SUPPLIERS.AKALIN ? "none" : "";
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
function getLimitBySupplier() {
  if (ACTIVE_SUPPLIER === SUPPLIERS.ALL) return ALL_LIMIT;
  if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL) return COMPEL_LIMIT;
  return 9999;
}
function computeVisibleRowsLimit() {
  if (String(brandFilterText || "").trim()) return 9999;
  return brandListExpanded ? 9999 : getLimitBySupplier();
}

const renderBrands = () => {
  ensureBrandSearchSlot();

  if (brandSearchInputEl && brandSearchInputEl.value !== String(brandFilterText || "")) {
    brandSearchInputEl.value = String(brandFilterText || "");
    syncBrandSearchSize();
  }

  const list = $("brandList");
  if (!list) return;
  list.innerHTML = "";

  const searching = !!String(brandFilterText || "").trim();
  const visAll = getVisibleBrands();

  if (!searching) {
    const allVisSelected = visAll.length > 0 && visAll.every((b) => SELECTED.has(b.id));
    const allBtn = document.createElement("div");
    allBtn.className = "brand" + (allVisSelected ? " sel" : "");
    allBtn.tabIndex = 0;
    allBtn.dataset.kind = "all";
    const aTxt = allVisSelected ? "Tümünü Kaldır" : "Tümünü Seç";
    allBtn.innerHTML = `<div class="bRow"><span class="bNm" title="${esc(aTxt)}">${esc(aTxt)}</span><span class="bCt">(✓)</span></div>`;
    list.appendChild(allBtn);
  }

  const brandsWrap = document.createElement("div");
  brandsWrap.dataset.kind = "brandsWrap";
  brandsWrap.style.display = "contents";
  list.appendChild(brandsWrap);

  const vis = [...visAll].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "tr", { sensitivity: "base" }));
  const limit = computeVisibleRowsLimit();
  const sliced = vis.slice(0, limit);

  sliced.forEach((b) => {
    const d = document.createElement("div");
    d.className = "brand" + (SELECTED.has(b.id) ? " sel" : "");
    d.tabIndex = 0;
    d.dataset.id = String(b.id);
    d.dataset.kind = "brand";
    const nm = toTitleCaseTR(b.name);
    d.innerHTML = `<div class="bRow"><span class="bNm" title="${esc(nm)}">${esc(nm)}</span><span class="bCt">(${esc(b.count)})</span></div>`;
    brandsWrap.appendChild(d);
  });

  const limitBase = getLimitBySupplier();
  const shouldShowToggle = !searching && vis.length > limitBase;

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
  if (!hasEverListed) setGuideStep(SELECTED.size > 0 ? "tsoft" : "brand");
  applySupplierUi();
};

function toggleBrand(id, el) {
  SELECTED.has(id) ? (SELECTED.delete(id), el.classList.remove("sel")) : (SELECTED.add(id), el.classList.add("sel"));
  updateBrandChip();
  if (!hasEverListed) setGuideStep(SELECTED.size > 0 ? "tsoft" : "brand");
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
  if (kind === "all") return void toggleAllVisible();
  if (kind === "toggle") { brandListExpanded = !brandListExpanded; return void renderBrands(); }
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
  if (kind === "toggle") { e.preventDefault(); brandListExpanded = !brandListExpanded; return void renderBrands(); }
  if (kind === "all") { e.preventDefault(); return void toggleAllVisible(); }
  if (kind === "brand") {
    e.preventDefault();
    const id = el.dataset.id;
    const n = Number(id);
    Number.isFinite(n) && toggleBrand(n, el);
  }
});

const pulseBrands = () => {
  const list = $("brandList");
  if (!list) return;
  list.classList.remove("glow");
  void list.offsetWidth;
  list.classList.add("glow");
  setTimeout(() => list.classList.remove("glow"), 950);
};
$("brandHintBtn")?.addEventListener("click", pulseBrands);

let COMPEL_BRANDS_CACHE = null;

async function initBrands() {
  brandPrefix = "Hazır";
  const el = $("brandStatus");
  el && (el.textContent = "Markalar yükleniyor…", (el.title = el.textContent));
  try {
    const data = await loadBrands(API_BASE);
    COMPEL_BRANDS_CACHE = data;
    if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL) BRANDS = data;
  } catch {
    if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL) {
      const el2 = $("brandStatus");
      el2 && (el2.textContent = "Markalar yüklenemedi (API).", (el2.title = el2.textContent));
    }
  } finally {
    renderBrands();
    applySupplierUi();
  }
}

// Supplier dropdown
(() => {
  const wrap = $("supplierWrap"),
    btn = $("supplierBtn"),
    menu = $("supplierMenu"),
    addBtn = $("supplierAddBtn"),
    itC = $("supplierCompelItem"),
    itAll = $("supplierAllItem"),
    itA = $("supplierAkalinItem");
  if (!wrap || !btn || !menu || !itC || !itAll || !itA) return;

  const open = () => { menu.classList.add("show"); menu.setAttribute("aria-hidden", "false"); btn.setAttribute("aria-expanded", "true"); };
  const close = () => { menu.classList.remove("show"); menu.setAttribute("aria-hidden", "true"); btn.setAttribute("aria-expanded", "false"); };
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
    if (!name || name === ACTIVE_SUPPLIER) return void close();
    ACTIVE_SUPPLIER = name;

    const lab = $("supplierLabel");
    lab && (lab.textContent = `1) Tedarikçi: ${name}`);

    brandFilterText = "";
    brandListExpanded = false;
    if (brandSearchInputEl) { brandSearchInputEl.value = ""; syncBrandSearchSize(); }

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

  btn.addEventListener("click", (e) => { e.preventDefault(); paint(); toggle(); });
  itC.addEventListener("click", (e) => { e.preventDefault(); if (itC.getAttribute("aria-disabled") === "true") return; void setSupplier(SUPPLIERS.COMPEL); });
  itAll.addEventListener("click", (e) => { e.preventDefault(); if (itAll.getAttribute("aria-disabled") === "true") return; void setSupplier(SUPPLIERS.ALL); });
  itA.addEventListener("click", (e) => { e.preventDefault(); if (itA.getAttribute("aria-disabled") === "true") return; void setSupplier(SUPPLIERS.AKALIN); });
  addBtn?.addEventListener("click", (e) => { e.preventDefault(); close(); });

  document.addEventListener("click", (e) => !wrap.contains(e.target) && close());
  addEventListener("keydown", (e) => e.key === "Escape" && close());
  paint();
})();

function applySupplierUi() {
  ensureBrandSearchSlot();

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

  const l1 = $("l1Chip");
  if (l1) l1.style.display = ACTIVE_SUPPLIER === SUPPLIERS.ALL ? "none" : "";

  if (ACTIVE_SUPPLIER === SUPPLIERS.AKALIN) {
    INFO_HIDE_IDS.forEach((id) => { const el = $(id); el && (el.style.display = "none"); });
    setStatus("Tedarikçi Akalın entegre edilmedi. Lütfen farklı bir tedarikçi seçin.", "bad");
  } else {
    INFO_HIDE_IDS.forEach((id) => { const el = $(id); el && (el.style.display = ""); });
    setStatus("Hazır", "ok");
    updateBrandChip();
  }

  updateGuideUI();
}

const depot = createDepot({
  ui,
  normBrand,
  onDepotLoaded: async () => {
    DAILY_SELECTED.aide = "";
    paintDailyUI();
    if (!hasEverListed) setGuideStep("list");

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

let listTitleEl = null, listSepEl = null, lastListedTitle = "", goMode = "list";

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
  const sup = getSupplierName(), brands = getSelectedBrandNames();
  if (!brands.length) return `Tedarikçi ${sup} için marka seçilmedi.`;
  const brTxt = joinTrList(brands);
  if (ACTIVE_SUPPLIER === SUPPLIERS.ALL) {
    return `Tüm Markalar için ${brTxt} ${brands.length === 1 ? "markasında" : "markalarında"} yapılan T-Soft ve Aide karşılaştırma listesi`;
  }
  return `Tedarikçi ${sup} için ${brTxt} ${brands.length === 1 ? "markasında" : "markalarında"} yapılan T-Soft ve Aide karşılaştırma listesi`;
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
const setGoMode = (mode) => {
  goMode = mode;
  const b = $("go");
  if (!b) return;
  b.textContent = mode === "clear" ? "Temizle" : "Listele";
  b.title = b.textContent;
};

const clearOnlyLists = () => {
  const t1 = $("t1"), t2 = $("t2"), t2L = $("t2L"), t2R = $("t2R");
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

let abortCtrl = null;

const setScanState = (on) => {
  const goBtn = $("go");
  goBtn && (goBtn.disabled = on);
  $("f2") && ($("f2").disabled = on);
  $("depoBtn") && ($("depoBtn").disabled = on);
  const t = $("tsoftDailyBtn"), a = $("aideDailyBtn");
  t && (t.disabled = on || t.disabled);
  a && (a.disabled = on || a.disabled);
};

// ---- T-Soft modal wrapper (kullanıcı akışı korunur)
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

  const show = () => { modal.style.display = "block"; modal.setAttribute("aria-hidden", "false"); place(); setTimeout(() => pick.focus(), 0); };
  const hide = () => { modal.style.display = "none"; modal.setAttribute("aria-hidden", "true"); inner.style.position = ""; inner.style.left = ""; inner.style.top = ""; inner.style.visibility = ""; };

  const openPicker = () => {
    allow = true;
    hide();
    requestAnimationFrame(() => {
      try { inp.click(); }
      finally { setTimeout(() => { allow = false; }, 0); }
    });
  };

  box.addEventListener("click", (e) => {
    if (inp.disabled) return;
    if (allow) { allow = false; return; }
    e.preventDefault(); e.stopPropagation(); show();
  }, true);

  pick.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openPicker(); });
  dismiss.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); hide(); });

  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isOpen()) return;
    e.preventDefault(); e.stopPropagation(); openPicker();
  });

  addEventListener("resize", () => isOpen() && place());
  addEventListener("scroll", () => isOpen() && place(), true);

  const cb = $("tsoftSaveToday");
  cb && cb.addEventListener("change", () => { cb.checked && !ensureSaveCredOrCancel() && (cb.checked = false); });
})();

const bind = (inId, outId, empty) => {
  const inp = $(inId), out = $(outId);
  if (!inp || !out) return;
  const upd = () => {
    const f = inp.files?.[0];
    if (!f) { out.textContent = empty; out.title = empty; }
    else { out.textContent = "Seçildi"; out.title = f.name; }
    f && (DAILY_SELECTED.tsoft = "", paintDailyUI());
    if (!hasEverListed) {
      if (SELECTED.size === 0) setGuideStep("brand");
      else if (!f) setGuideStep("tsoft");
      else setGuideStep("aide");
    }
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

// --------------------
// STATE: T-Soft data (cached)
// --------------------
let TSOFT_ROWS = [];
let TSOFT_COLS = {};
let TSOFT_READY = false;

function resetTsoft() {
  TSOFT_ROWS = [];
  TSOFT_COLS = {};
  TSOFT_READY = false;
  setChip("l2Chip", "T-Soft:-");
}

function loadTsoftFromRows(rows) {
  const sample = rows?.[0] || {};
  const ws = pickColumn(sample, ["Web Servis Kodu", "WebServisKodu", "WS", "webservis", "web servis kodu"]);
  const urunAdi = pickColumn(sample, ["Ürün Adı", "Urun Adi", "Ürün Adi", "Product Name"]);
  const sup = pickColumn(sample, ["Tedarikçi Ürün Kodu", "Tedarikci Urun Kodu", "Supplier Product Code", "Sup Code"]);
  const barkod = pickColumn(sample, ["Barkod", "EAN", "Barcode"]);
  const stok = pickColumn(sample, ["Stok", "Stock", "Qty", "Quantity"]);
  const aktif = pickColumn(sample, ["Aktif", "Active"]);
  const marka = pickColumn(sample, ["Marka", "Brand"]);
  const seo = pickColumn(sample, ["SEO Link", "Seo", "SEO", "Link"]);

  if (!urunAdi || !sup) throw new Error("T-Soft CSV kolonları bulunamadı. (Ürün Adı / Tedarikçi Ürün Kodu)");
  TSOFT_ROWS = rows;
  TSOFT_COLS = { ws, urunAdi, sup, barkod, stok, aktif, marka, seo };
  TSOFT_READY = true;
  setChip("l2Chip", `T-Soft:${rows.length}`);
}

async function ensureTsoftLoadedForList() {
  if (DAILY_SELECTED.tsoft) {
    const pass = await getReadPassOrPrompt(DAILY_SELECTED.tsoft);
    setStatus("T-Soft günlük veri okunuyor…", "unk");
    const j = await dailyGet(API_BASE, { date: DAILY_SELECTED.tsoft, password: pass, want: "tsoft" });
    const raw = String(j?.data || j?.text || j?.raw || "");
    if (!raw.trim()) throw new Error("T-Soft günlük veri boş.");
    const p = parseDelimited(raw);
    const rows = p?.rows || [];
    if (!rows.length) throw new Error("T-Soft günlük veri çözümlenemedi.");
    loadTsoftFromRows(rows);
    DAILY_READ_CACHE = { date: DAILY_SELECTED.tsoft, pass };
    setStatus("T-Soft günlük veri yüklendi", "ok");
    return;
  }

  if (TSOFT_READY) return;

  const f = $("f2")?.files?.[0];
  if (!f) throw new Error("T-Soft CSV seçilmedi.");
  setStatus("T-Soft CSV okunuyor…", "unk");
  const txt = await readFileText(f);
  const p = parseDelimited(txt);
  const rows = p?.rows || [];
  if (!rows.length) throw new Error("T-Soft CSV boş.");
  loadTsoftFromRows(rows);
  setStatus("T-Soft yüklendi", "ok");
}

// --------------------
// Reset all (supplier switch / clean state)
// --------------------
function resetAll() {
  abortCtrl?.abort?.();
  abortCtrl = null;
  matcher.resetAll();
  resetTsoft();
  clearOnlyLists();
  setGoMode("list");
  hasEverListed = false;
  setStatus("Hazır", "ok");
  setChip("l1Chip", ACTIVE_SUPPLIER === SUPPLIERS.ALL ? "" : "Compel:-");
  setChip("l4Chip", depot.isReady() ? `Aide:${depot.count()}` : "Aide:-");
  updateBrandChip();
  applySupplierUi();
}

// --------------------
// Compel scan: stream collector (robust)
// --------------------
async function scanCompelToRows(brands) {
  const rows = [];
  const seen = new Set();
  abortCtrl = new AbortController();

  let lastMsg = "";
  const onMessage = (msg) => {
    if (!msg) return;
    const t = String(msg.status || msg.message || msg.msg || "").trim();
    if (t && t !== lastMsg) {
      lastMsg = t;
      setStatus(t, "unk");
    }

    // tolerate various shapes
    const arr =
      msg.rows ||
      msg.data?.rows ||
      msg.payload?.rows ||
      msg.items ||
      msg.data ||
      null;

    if (Array.isArray(arr)) {
      for (const r of arr) {
        if (!r || typeof r !== "object") continue;
        const k = JSON.stringify(r);
        if (seen.has(k)) continue;
        seen.add(k);
        rows.push(r);
      }
    }

    // single row
    if (msg.row && typeof msg.row === "object") {
      const k = JSON.stringify(msg.row);
      if (!seen.has(k)) {
        seen.add(k);
        rows.push(msg.row);
      }
    }
  };

  await scanCompel(API_BASE, brands, { signal: abortCtrl.signal, onMessage });
  abortCtrl = null;
  return rows;
}

// --------------------
// List: Compel mode
// --------------------
function buildC1(sample) {
  const siraNo = pickColumn(sample, ["Sıra No", "Sira No", "Sıra", "Sira", "No"]);
  const marka = pickColumn(sample, ["Marka", "Brand"]);
  const urunKodu = pickColumn(sample, ["Ürün Kodu", "Urun Kodu", "Kod", "Product Code", "Web Servis Kodu", "WebServisKodu"]);
  const urunAdi = pickColumn(sample, ["Ürün Adı", "Urun Adi", "Ad", "Product Name"]);
  const stok = pickColumn(sample, ["Stok", "Stock"]);
  const ean = pickColumn(sample, ["EAN", "Barkod", "Barcode"]);
  const link = pickColumn(sample, ["Link", "URL", "Url", "Ürün Link", "Product Link"]);
  return { siraNo, marka, urunKodu, urunAdi, stok, ean, link };
}

function buildC2(sample) {
  const ws = pickColumn(sample, ["Web Servis Kodu", "WebServisKodu", "WS"]);
  const urunAdi = pickColumn(sample, ["Ürün Adı", "Urun Adi", "Ürün Adi", "Product Name"]);
  const sup = pickColumn(sample, ["Tedarikçi Ürün Kodu", "Tedarikci Urun Kodu", "Supplier Product Code", "Sup Code"]);
  const barkod = pickColumn(sample, ["Barkod", "EAN", "Barcode"]);
  const stok = pickColumn(sample, ["Stok", "Stock", "Qty", "Quantity"]);
  const aktif = pickColumn(sample, ["Aktif", "Active"]);
  const marka = pickColumn(sample, ["Marka", "Brand"]);
  const seo = pickColumn(sample, ["SEO Link", "Seo", "SEO", "Link"]);
  return { ws, urunAdi, sup, barkod, stok, aktif, marka, seo };
}

async function listCompel() {
  const brands = getSelectedBrandNames();
  if (!brands.length) throw new Error("Marka seçilmedi.");

  await ensureTsoftLoadedForList();

  setScanState(true);
  setStatus("Compel taranıyor…", "unk");
  const l1 = await scanCompelToRows(brands);
  if (!l1.length) throw new Error("Compel verisi gelmedi.");

  const c1 = buildC1(l1[0]);
  if (!c1.marka || !c1.urunAdi) throw new Error("Compel verisi kolonları çözülemedi (Marka/Ürün Adı).");

  const l2 = TSOFT_ROWS;
  const c2 = TSOFT_COLS.ws ? TSOFT_COLS : buildC2(l2[0]);

  matcher.loadData({ l1, c1, l2, c2, l2All: l2 });
  matcher.runMatch();

  const { R } = matcher.getResults();
  renderer.render(R, [], depot.isReady());

  setChip("l1Chip", `Compel:${l1.length}`);
  setChip("l4Chip", depot.isReady() ? `Aide:${depot.count()}` : "Aide:-");

  lockListTitleFromCurrentSelection();
  setListTitleVisible(true);

  setGoMode("clear");
  hasEverListed = true;
  setStatus("Hazır", "ok");
  setScanState(false);
}

// --------------------
// List: ALL mode (T-Soft ↔ Aide)
// --------------------
function parseBoolAktif(v) {
  const s = String(v ?? "").trim().toLocaleLowerCase(TR);
  if (!s) return null;
  if (s === "true" || s === "1" || s === "yes" || s === "evet") return true;
  if (s === "false" || s === "0" || s === "no" || s === "hayir" || s === "hayır") return false;
  return null;
}

function buildAllCompareRows({ brandsNormSet }) {
  // Depot map: brNorm -> Map(code -> {code,name,num})
  const aideMapByBrand = depot.getBrandItemMap();
  const tsoftSupByBrand = new Map(); // brNorm -> Set(supCode)
  const tsoftItemsByBrand = new Map(); // brNorm -> Map(code -> item)

  // Build Tsoft per brand map
  const r2 = TSOFT_ROWS || [];
  const C2 = TSOFT_COLS.ws ? TSOFT_COLS : buildC2(r2[0] || {});
  const getBr = (row) => normBrand(row?.[C2.marka] ?? row?.["Marka"] ?? "");
  for (const row of r2) {
    const brNorm = getBr(row);
    if (!brNorm) continue;
    if (brandsNormSet && !brandsNormSet.has(brNorm)) continue;

    const sup = T(row?.[C2.sup] ?? "");
    if (!sup) continue;

    const supKey = sup.toString().trim();
    tsoftSupByBrand.has(brNorm) || tsoftSupByBrand.set(brNorm, new Set());
    tsoftSupByBrand.get(brNorm).add(supKey);

    const name = T(row?.[C2.urunAdi] ?? "");
    const stokRaw = row?.[C2.stok] ?? "";
    const stokNum = stockToNumber(stokRaw, { source: "products" });
    const aktif = C2.aktif ? parseBoolAktif(row?.[C2.aktif]) : null;

    tsoftItemsByBrand.has(brNorm) || tsoftItemsByBrand.set(brNorm, new Map());
    const m = tsoftItemsByBrand.get(brNorm);
    if (!m.has(supKey)) {
      m.set(supKey, { sup: supKey, name, stokNum, aktif });
    } else {
      const it = m.get(supKey);
      it.stokNum = (Number(it.stokNum) || 0) + (Number(stokNum) || 0);
      if (!it.name && name) it.name = name;
      if (it.aktif == null && aktif != null) it.aktif = aktif;
    }
  }

  const rows = [];
  const unmatchedTsoft = [];
  const unmatchedAide = [];

  for (const brNorm of (brandsNormSet ? [...brandsNormSet] : [...tsoftItemsByBrand.keys()])) {
    const tsoftMap = tsoftItemsByBrand.get(brNorm) || new Map();
    const aideMap = aideMapByBrand.get(brNorm) || new Map();

    // matched rows
    for (const [code, tIt] of tsoftMap.entries()) {
      if (aideMap.has(code)) {
        const aIt = aideMap.get(code);
        const pulse = ((Number(tIt.stokNum) || 0) > 0) !== ((Number(aIt.num) || 0) > 0);
        rows.push({
          _m: true,
          _pulse: pulse,
          _tpassive: tIt.aktif === false,
          "Marka": brNorm,
          "Ürün Kodu (T-Soft)": code,
          "Ürün Adı (T-Soft)": tIt.name || "",
          "Ürün Kodu (Aide)": code,
          "Ürün Adı (Aide)": aIt.name || "",
          "Stok (T-Soft)": Number(tIt.stokNum) || 0,
          "Stok (Aide)": Number(aIt.num) || 0,
        });
      }
    }

    // unmatched Tsoft
    for (const [code, tIt] of tsoftMap.entries()) {
      if (!aideMap.has(code)) {
        unmatchedTsoft.push({
          "Marka": brNorm,
          "Ürün Kodu": code,
          "Ürün Adı": tIt.name || "",
          "Stok": Number(tIt.stokNum) || 0
        });
      }
    }

    // unmatched Aide
    for (const [code, aIt] of aideMap.entries()) {
      if (!tsoftMap.has(code)) {
        unmatchedAide.push({
          "Marka": brNorm,
          "Ürün Kodu": code,
          "Ürün Adı": aIt.name || "",
          "Stok": Number(aIt.num) || 0
        });
      }
    }
  }

  // Make brand labels nicer (original seed casing): renderer uses "Marka" field; we can leave norm.
  return { rows, unmatchedTsoft, unmatchedAide, tsoftSupByBrand };
}

async function listAll() {
  const brands = getSelectedBrandNames();
  if (!brands.length) throw new Error("Marka seçilmedi.");

  await ensureTsoftLoadedForList();

  // Aide daily selected but depot not loaded -> load depot via dailyGet into depot
  if (DAILY_SELECTED.aide && !depot.isReady()) {
    const pass = await getReadPassOrPrompt(DAILY_SELECTED.aide);
    setStatus("Aide günlük veri okunuyor…", "unk");
    const j = await dailyGet(API_BASE, { date: DAILY_SELECTED.aide, password: pass, want: "aide" });
    const raw = String(j?.data || j?.text || j?.raw || "");
    if (!raw.trim()) throw new Error("Aide günlük veri boş.");
    depot.loadText(raw);
    DAILY_READ_CACHE = { date: DAILY_SELECTED.aide, pass };
    setStatus("Aide günlük veri yüklendi", "ok");
  }

  if (!depot.isReady()) throw new Error("Aide verisi yüklenmedi. (Depo yükle / günlük Aide seç)");

  // brandsNormSet from selected brand names
  const brandsNormSet = new Set(brands.map((x) => normBrand(x)).filter(Boolean));

  setScanState(true);
  setStatus("Karşılaştırma yapılıyor…", "unk");

  const { rows, unmatchedTsoft, unmatchedAide } = buildAllCompareRows({ brandsNormSet });

  // nicer display brand: use title-case on original selected name mapping
  const byNormToLabel = new Map();
  for (const nm of brands) byNormToLabel.set(normBrand(nm), toTitleCaseTR(nm));
  for (const r of rows) r["Marka"] = byNormToLabel.get(r["Marka"]) || r["Marka"];
  for (const u of unmatchedTsoft) u["Marka"] = byNormToLabel.get(u["Marka"]) || u["Marka"];
  for (const u of unmatchedAide) u["Marka"] = byNormToLabel.get(u["Marka"]) || u["Marka"];

  renderer.renderAll({ rows, unmatchedTsoft, unmatchedAide });

  lockListTitleFromCurrentSelection();
  setListTitleVisible(true);

  setGoMode("clear");
  hasEverListed = true;
  setStatus("Hazır", "ok");
  setScanState(false);
}

// --------------------
// GO button: FIX (Listele çalışır)
// --------------------
async function onGoClick() {
  if (ACTIVE_SUPPLIER === SUPPLIERS.AKALIN) return;

  if (goMode === "clear") {
    clearOnlyLists();
    setGoMode("list");
    hasEverListed = false;
    setGuideStep(SELECTED.size > 0 ? "tsoft" : "brand");
    setStatus("Hazır", "ok");
    return;
  }

  try {
    if (SELECTED.size === 0) {
      alert("Lütfen marka seçin.");
      setGuideStep("brand");
      return;
    }

    lockListTitleFromCurrentSelection();
    setListTitleVisible(true);

    if (ACTIVE_SUPPLIER === SUPPLIERS.ALL) await listAll();
    else await listCompel();
  } catch (err) {
    abortCtrl?.abort?.();
    abortCtrl = null;
    setScanState(false);
    setStatus(String(err?.message || err), "bad");
    alert(String(err?.message || err));
  }
}

$("go")?.addEventListener("click", (e) => { e.preventDefault(); onGoClick(); });

// --------------------
// Init
// --------------------
ensureListHeader();
setGoMode("list");
setGuideStep("brand");

if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL) initBrands();
else if (ACTIVE_SUPPLIER === SUPPLIERS.ALL) {
  BRANDS = buildCanonicalBrandList().map((b, i) => ({ ...b, id: i + 1 }));
  renderBrands();
} else renderBrands();

applySupplierUi();
refreshDailyMeta();
