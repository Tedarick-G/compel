// ./js/ui/brand.js
import { esc } from "../utils.js";

/**
 * Brand UI modülü:
 * - Marka listesini render eder (COMPEL + ALL)
 * - Marka arama barını yönetir
 * - Liste başlığını (listTitle) üretir/gösterir
 *
 * app.js bu modülün üzerinden:
 * - BRANDS/SELECTED yönetimini
 * - search bar + toggle (ALL modunda 20 limit)
 * - list header (maincol üstündeki başlık)
 * işlemlerini yürütür.
 */
export function createBrandUI({
  $,
  TR,
  ui,
  guide,
  normBrand,
  toTitleCaseTR,
  suppliers,
  getActiveSupplier,
  setActiveSupplier, // (şimdilik kullanılmıyor ama ileride lazım olabilir)
  buildAllBrands, // () => [{id: brNorm, slug: brNorm, name, count:"—"}...]
} = {}) {
  let BRANDS = [];
  let SELECTED = new Set();

  let brandPrefix = "Hazır";
  let brandFilterText = "";
  let brandListExpanded = false;

  // list header
  let listTitleEl = null;
  let listSepEl = null;
  let lastListedTitle = "";

  // search bar
  let brandSearchBarEl = null;

  const INFO_HIDE_IDS = ["brandStatus", "l1Chip", "l2Chip", "l4Chip", "sum"];

  // --------------------------
  // Brand chip
  // --------------------------
  const updateBrandChip = () => {
    const el = $("brandStatus");
    if (!el) return;
    if (getActiveSupplier() === suppliers.AKALIN) return;

    const total = BRANDS?.length ?? 0;
    const sel = SELECTED?.size ?? 0;
    el.textContent = `${brandPrefix} • Marka: ${total}/${sel}`;
    el.title = el.textContent;
  };

  const setBrandStatusText = (t) => {
    const el = $("brandStatus");
    if (!el) return;
    el.textContent = String(t ?? "");
    el.title = el.textContent;
  };

  // --------------------------
  // Search bar (top)
  // --------------------------
  function injectSearchBarCssOnce() {
    if (document.getElementById("__brandSearchCss")) return;
    const st = document.createElement("style");
    st.id = "__brandSearchCss";
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
      #brandSearchInputTop::placeholder{color:var(--text-2);opacity:.85;}

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
  }

  function ensureSearchBar() {
    injectSearchBarCssOnce();
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

    // dinamik width ölçümü (eski davranış)
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
      const pWrap = (parseFloat(wcs.paddingLeft) || 0) + (parseFloat(wcs.paddingRight) || 0);
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
        render();
      });
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          brandFilterText = "";
          inp.value = "";
          updateWidth();
          render();
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
    const wrap = ensureSearchBar();
    if (!wrap) return;

    const show = getActiveSupplier() !== suppliers.AKALIN; // COMPEL + ALL açık
    wrap.classList.toggle("show", !!show);

    if (!show) {
      const inp = wrap.querySelector("#brandSearchInputTop");
      if (inp) {
        brandFilterText = "";
        inp.value = "";
      }
    }
  }

  // --------------------------
  // Visible brands + rendering
  // --------------------------
  function getVisibleBrands() {
    const q = String(brandFilterText || "").trim().toLocaleLowerCase(TR);
    if (!q) return BRANDS;
    return BRANDS.filter((b) => String(b.name || "").toLocaleLowerCase(TR).includes(q));
  }

  function computeVisibleRowsLimit() {
    if (getActiveSupplier() === suppliers.COMPEL) return 9999;

    // ALL
    if (String(brandFilterText || "").trim()) return 9999;
    return brandListExpanded ? 9999 : 20;
  }

  function toggleBrand(id, el) {
    SELECTED.has(id)
      ? (SELECTED.delete(id), el.classList.remove("sel"))
      : (SELECTED.add(id), el.classList.add("sel"));
    updateBrandChip();
    guide?.updateFromState?.();
    applySupplierUi(); // chip hide/show gibi
  }

  function toggleAllVisible() {
    const vis = getVisibleBrands();
    if (!vis.length) return;
    const allSelected = vis.every((b) => SELECTED.has(b.id));
    if (allSelected) vis.forEach((b) => SELECTED.delete(b.id));
    else vis.forEach((b) => SELECTED.add(b.id));
    render();
  }

  function bindBrandListEventsOnce() {
    const list = $("brandList");
    if (!list || list.__bound) return;
    list.__bound = true;

    list.addEventListener("click", (e) => {
      const el = e.target.closest(".brand, .brandToggle");
      if (!el) return;
      const kind = el.dataset.kind || "brand";
      if (kind === "all") return void toggleAllVisible();
      if (kind === "toggle") {
        brandListExpanded = !brandListExpanded;
        return void render();
      }
      if (kind === "brand") {
        const id = el.dataset.id;
        const n = Number(id);
        if (Number.isFinite(n)) toggleBrand(n, el);
      }
    });

    list.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = e.target.closest(".brand, .brandToggle");
      if (!el) return;
      const kind = el.dataset.kind || "brand";
      if (kind === "toggle") {
        e.preventDefault();
        brandListExpanded = !brandListExpanded;
        return void render();
      }
      if (kind === "all") {
        e.preventDefault();
        return void toggleAllVisible();
      }
      if (kind === "brand") {
        e.preventDefault();
        const id = el.dataset.id;
        const n = Number(id);
        if (Number.isFinite(n)) toggleBrand(n, el);
      }
    });
  }

  function render() {
    bindBrandListEventsOnce();

    const list = $("brandList");
    if (!list) return;

    list.innerHTML = "";

    const visAll = getVisibleBrands();
    const isSearching = !!String(brandFilterText || "").trim();

    // “Tümünü Seç/Kaldır” sadece arama yokken
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

    // Toggle: sadece ALL modunda, arama yoksa, 20’den fazlaysa
    const shouldShowToggle =
      getActiveSupplier() === suppliers.ALL && !isSearching && vis.length > 20;

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
    guide?.updateFromState?.();
    applySupplierUi();

    // search input width refresh
    if (getActiveSupplier() !== suppliers.AKALIN) {
      const bar = ensureSearchBar();
      const inp = bar?.querySelector?.("#brandSearchInputTop");
      if (bar && inp) {
        try {
          inp.dispatchEvent(new Event("input", { bubbles: false }));
        } catch {}
      }
    }
  }

  // --------------------------
  // Supplier UI behavior (hide/show chips)
  // --------------------------
  function applySupplierUi() {
    // dl1 gizleme (eski app.js davranışı)
    const dl1 = $("dl1");
    dl1 && (dl1.style.display = "none");

    // Compel chip'i ALL'da gizli
    const l1 = $("l1Chip");
    if (l1) l1.style.display = getActiveSupplier() === suppliers.ALL ? "none" : "";

    showHideBrandSearchBar();

    if (getActiveSupplier() === suppliers.AKALIN) {
      INFO_HIDE_IDS.forEach((id) => {
        const el = $(id);
        el && (el.style.display = "none");
      });
    } else {
      INFO_HIDE_IDS.forEach((id) => {
        const el = $(id);
        el && (el.style.display = "");
      });
      updateBrandChip();
    }

    guide?.update?.();
  }

  // --------------------------
  // List header title logic
  // --------------------------
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
    const sup = getSupplierName();
    const brands = getSelectedBrandNames();
    if (!brands.length) return `Tedarikçi ${sup} için marka seçilmedi.`;
    const brTxt = joinTrList(brands);

    if (getActiveSupplier() === suppliers.ALL) {
      return `Tüm Markalar için ${brTxt} ${(brands.length === 1 ? "markasında" : "markalarında")} yapılan T-Soft ve Aide karşılaştırma listesi`;
    }
    return `Tedarikçi ${sup} için ${brTxt} ${(brands.length === 1 ? "markasında" : "markalarında")} yapılan T-Soft ve Aide karşılaştırma listesi`;
  };

  function ensureListHeader() {
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
  }

  function setListTitleVisible(show) {
    ensureListHeader();
    listTitleEl && (listTitleEl.style.display = show ? "" : "none");
    listSepEl && (listSepEl.style.display = show ? "" : "none");
  }

  function lockListTitleFromCurrentSelection() {
    ensureListHeader();
    lastListedTitle = buildListTitle();
    listTitleEl && (listTitleEl.textContent = lastListedTitle);
  }

  // --------------------------
  // External helpers for modes
  // --------------------------
  function setBrands(arr) {
    BRANDS = Array.isArray(arr) ? arr : [];
  }
  function getBrands() {
    return BRANDS;
  }
  function setBrandPrefix(p) {
    brandPrefix = String(p || "Hazır");
  }
  function setLoading(on) {
    if (!on) return;
    setBrandStatusText("Markalar yükleniyor…");
  }

  function resetAllSelections() {
    SELECTED.clear();
    brandFilterText = "";
    brandListExpanded = false;

    const bar = ensureSearchBar();
    const inp = bar?.querySelector?.("#brandSearchInputTop");
    if (inp) inp.value = "";

    render();
  }

  function getSelectedIds() {
    return new Set(SELECTED);
  }

  function getSelectedBrands() {
    const out = [];
    for (const id of SELECTED) {
      const b = BRANDS.find((x) => x.id === id);
      if (b) out.push(b);
    }
    return out;
  }

  function buildAllBrandsWithIds() {
    const arr = buildAllBrands?.() || [];
    // app.js: id=1..N olmalı (UI toggleBrand Number() ile çalışıyor)
    return arr.map((b, i) => ({ ...b, id: i + 1 }));
  }

  // ALL mode counts update helper
  function updateCountsByBrandNormSetMap(countByBrandNorm) {
    // countByBrandNorm: Map(brNorm -> Set(code))
    for (const b of BRANDS) {
      const bn = normBrand(b.name);
      const set = bn ? countByBrandNorm.get(bn) : null;
      b.count = set ? String(set.size) : "0";
    }
  }

  // --------------------------
  // init
  // --------------------------
  ensureSearchBar(); // oluştur (varsa)
  ensureListHeader();

  return {
    // brands
    setBrands,
    getBrands,
    setBrandPrefix,
    setBrandStatusText,
    setLoading,

    // selection
    resetAllSelections,
    getSelectedIds,
    getSelectedBrands,

    // rendering & supplier UI
    render,
    applySupplierUi,

    // search/list header
    ensureSearchBar,
    ensureListHeader,
    lockListTitleFromCurrentSelection,
    setListTitleVisible,

    // ALL mode helper
    buildAllBrandsWithIds,
    updateCountsByBrandNormSetMap,
  };
}
