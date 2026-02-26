// ./js/app.js
// ✅ DEBUG-SAFE BOOTSTRAP: statik import yok.
// ✅ Hangi modül 404 / yüklenemedi => ekranda brandStatus içine yazar.

const $ = (id) => document.getElementById(id);

function showFatal(err, where = "") {
  const msg = String(err?.message || err || "Bilinmeyen hata");
  const url = err?.url ? `\nURL: ${err.url}` : "";
  const text = `JS Hatası${where ? ` (${where})` : ""}: ${msg}${url}`;

  const bs = $("brandStatus");
  if (bs) {
    bs.textContent = text;
    bs.title = String(err?.stack || text);
    bs.className = "chip bad";
    bs.style.display = "";
  }

  const st = $("stChip");
  if (st) {
    st.style.display = "";
    st.textContent = "Kritik hata";
    st.title = String(err?.stack || text);
    st.className = "chip bad";
  }

  console.error(err);
}

// global catcher (module yükleme hataları için)
addEventListener("error", (e) => showFatal(e?.error || e?.message || e, "window.error"));
addEventListener("unhandledrejection", (e) => showFatal(e?.reason || e, "unhandledrejection"));

async function mustImport(path) {
  try {
    return await import(path);
  } catch (e) {
    // Bazı tarayıcılar "Failed to fetch dynamically imported module" verir
    // burada hangi path patladı açık görünsün:
    e.url = new URL(path, location.href).toString();
    throw e;
  }
}

(async () => {
  try {
    // Hızlı “app başladı” göstergesi
    const bs = $("brandStatus");
    if (bs) {
      bs.textContent = "Başlatılıyor…";
      bs.title = bs.textContent;
    }

    const { TR } = await mustImport("./utils.js");
    const api = await mustImport("./api.js");
    const match = await mustImport("./match.js");
    const depotMod = await mustImport("./depot.js");
    const renderMod = await mustImport("./render.js");
    const seeds = await mustImport("./brands.seed.js");

    const chipsMod = await mustImport("./ui/chips.js");
    const guideMod = await mustImport("./ui/guide.js");
    const dailyMod = await mustImport("./ui/daily.js");
    const brandMod = await mustImport("./ui/brand.js");

    const compelMod = await mustImport("./modes/compel.js");
    const allMod = await mustImport("./modes/all.js");

    const textMod = await mustImport("./helpers/text.js");

    const {
      loadBrands,
      dailyMeta,
      dailyGet,
      dailySave,
      scanCompel,
    } = api;

    const { createMatcher, normBrand } = match;
    const { createDepot } = depotMod;
    const { createRenderer } = renderMod;

    const { AIDE_BRAND_SEED, TSOFT_BRAND_SEED } = seeds;

    const { createUIChips } = chipsMod;
    const { createGuide } = guideMod;
    const { createDaily } = dailyMod;
    const { createBrandUI } = brandMod;

    const { createCompelMode } = compelMod;
    const { createAllMode } = allMod;

    const { toTitleCaseTR, buildCanonicalBrandList } = textMod;

    const API_BASE = "https://robot-workstation.tvkapora.workers.dev";

    const SUPPLIERS = {
      COMPEL: "Compel",
      ALL: "Tüm Markalar",
      AKALIN: "Akalın",
    };

    let ACTIVE_SUPPLIER = SUPPLIERS.COMPEL;

    const ui = createUIChips({ $, TR });
    const guide = createGuide({ $, TR, getActiveSupplier: () => ACTIVE_SUPPLIER });

    const daily = createDaily({
      $,
      TR,
      apiBase: API_BASE,
      api: { dailyMeta, dailyGet, dailySave },
      ui,
      onAfterPick: () => guide.updateFromState(),
    });

    const depot = createDepot({
      ui,
      normBrand,
      onDepotLoaded: async () => {
        daily.clearSelection("aide");
        daily.paint();

        if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL && matcher.hasData()) {
          matcher.runMatch();
          compelMode.refresh();
        }

        applySupplierUi();

        await daily.trySaveIfChecked({
          kind: "aide",
          getRaw: () => depot.getLastRaw() || "",
        });

        guide.updateFromState();
      },
    });

    const matcher = createMatcher({
      getDepotAgg: () => depot.agg,
      isDepotReady: () => depot.isReady(),
    });

    const renderer = createRenderer({ ui });

    let COMPEL_BRANDS_CACHE = null;

    const brandUI = createBrandUI({
      $,
      TR,
      ui,
      guide,
      normBrand,
      toTitleCaseTR,
      suppliers: SUPPLIERS,
      getActiveSupplier: () => ACTIVE_SUPPLIER,
      setActiveSupplier: (x) => (ACTIVE_SUPPLIER = x),
      buildAllBrands: () =>
        buildCanonicalBrandList({
          normBrand,
          tsoftSeed: TSOFT_BRAND_SEED,
          aideSeed: AIDE_BRAND_SEED,
        }),
    });

    const compelMode = createCompelMode({
      $,
      TR,
      apiBase: API_BASE,
      api: { scanCompel, dailyGet, dailySave },
      ui,
      depot,
      matcher,
      renderer,
      brandUI,
      daily,
      guide,
      normBrand,
    });

    const allMode = createAllMode({
      $,
      TR,
      ui,
      depot,
      renderer,
      brandUI,
      daily,
      guide,
      normBrand,
      toTitleCaseTR,
    });

    guide.setStateResolver(() => {
      if (ACTIVE_SUPPLIER === SUPPLIERS.AKALIN) return "done";

      const selCount = brandUI.getSelectedIds().size;
      if (!selCount) return "brand";

      const sel = daily.getSelected();
      const hasTsoftFile = !!$("f2")?.files?.[0];
      const hasTsoftReady = hasTsoftFile || !!String(sel.tsoft || "").trim();
      if (!hasTsoftReady) return "tsoft";

      const hasAideReady = depot.isReady() || !!String(sel.aide || "").trim();
      if (!hasAideReady) return "aide";

      return "list";
    });

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

      if (ACTIVE_SUPPLIER === SUPPLIERS.AKALIN) {
        ui.setStatus(
          "Tedarikçi Akalın entegre edilmedi. Lütfen farklı bir tedarikçi seçin.",
          "bad"
        );
      } else {
        ui.setStatus("Hazır", "ok");
      }

      brandUI.applySupplierUi();
      guide.update();
    }

    async function initBrandsCompel() {
      brandUI.setBrandPrefix("Hazır");
      brandUI.setBrandStatusText("Markalar yükleniyor…");

      try {
        const data = await loadBrands(API_BASE);
        COMPEL_BRANDS_CACHE = data;
        if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL) brandUI.setBrands(data);
      } catch (e) {
        console.error(e);
        if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL) {
          brandUI.setBrandStatusText("Markalar yüklenemedi (API).");
        }
      } finally {
        brandUI.render();
        applySupplierUi();
        guide.updateFromState();
      }
    }

    function initSupplierDropdown() {
      const wrap = $("supplierWrap"),
        btn = $("supplierBtn"),
        menu = $("supplierMenu"),
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
        if (!name || name === ACTIVE_SUPPLIER) return close();

        ACTIVE_SUPPLIER = name;
        const lab = $("supplierLabel");
        lab && (lab.textContent = `1) Tedarikçi: ${name}`);

        brandUI.resetAllSelections();
        compelMode.reset();
        allMode.reset();
        depot.reset();
        matcher.resetAll();

        if (name === SUPPLIERS.AKALIN) {
          brandUI.setBrandPrefix("Akalın");
          brandUI.setBrands([]);
        } else if (name === SUPPLIERS.ALL) {
          brandUI.setBrandPrefix("Tüm Markalar");
          brandUI.setBrands(brandUI.buildAllBrandsWithIds());
        } else {
          brandUI.setBrandPrefix("Hazır");
          if (COMPEL_BRANDS_CACHE?.length) brandUI.setBrands(COMPEL_BRANDS_CACHE);
          else await initBrandsCompel();
        }

        paint();
        close();
        brandUI.render();
        applySupplierUi();
        guide.setStep("brand");
        guide.updateFromState();
      };

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        paint();
        menu.classList.contains("show") ? close() : open();
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

      document.addEventListener("click", (e) => !wrap.contains(e.target) && close());
      addEventListener("keydown", (e) => e.key === "Escape" && close());
      paint();
    }

    async function handleGo() {
      if (ACTIVE_SUPPLIER === SUPPLIERS.AKALIN) {
        applySupplierUi();
        return;
      }

      if (!brandUI.getSelectedIds().size) {
        alert("Lütfen bir marka seçin");
        return;
      }

      const ok =
        ACTIVE_SUPPLIER === SUPPLIERS.ALL
          ? await allMode.generate()
          : await compelMode.generate();

      if (ok) guide.setStep("done");
    }

    $("go") && ($("go").onclick = handleGo);

    // init
    initSupplierDropdown();
    brandUI.ensureListHeader();
    brandUI.ensureSearchBar();

    guide.setStep("brand");
    applySupplierUi();

    if (ACTIVE_SUPPLIER === SUPPLIERS.COMPEL) initBrandsCompel();
    else if (ACTIVE_SUPPLIER === SUPPLIERS.ALL) {
      brandUI.setBrandPrefix("Tüm Markalar");
      brandUI.setBrands(brandUI.buildAllBrandsWithIds());
      brandUI.render();
    } else {
      brandUI.render();
    }

    daily.refreshMeta();
    guide.updateFromState();
  } catch (e) {
    showFatal(e, "bootstrap");
  }
})();
