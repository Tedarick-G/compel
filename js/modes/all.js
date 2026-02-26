// ./js/modes/all.js
import { TR, T, parseDelimited, pickColumn, readFileText, stockToNumber } from "../utils.js";

/**
 * ALL (Tüm Markalar) mode:
 * - T-Soft CSV (dosya veya daily) okur
 * - Aide depot (load/yapıştır veya daily) hazır olmalı
 * - brand+code map çıkarır ve karşılaştırma listesi + split unmatched üretir
 */
export function createAllMode({
  $,
  TR: _TR,
  ui,
  depot,
  renderer,
  brandUI,
  daily,
  guide,
  normBrand,
  toTitleCaseTR,
} = {}) {
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
    ui?.setChip?.("sum", "✓0 • ✕0", "muted");
  };

  const setScanState = (on) => {
    const goBtn = $("go");
    goBtn && (goBtn.disabled = on);
    $("f2") && ($("f2").disabled = on);
    $("depoBtn") && ($("depoBtn").disabled = on);

    const tBtn = $("tsoftDailyBtn");
    const aBtn = $("aideDailyBtn");
    tBtn && (tBtn.disabled = !!on || !!tBtn.disabled);
    aBtn && (aBtn.disabled = !!on || !!aBtn.disabled);
  };

  function codeNorm(s) {
    return (s ?? "")
      .toString()
      .replace(/\u00A0/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleUpperCase(TR);
  }
  function codeAlt(n) {
    const k = codeNorm(n);
    if (!k || !/^[0-9]+$/.test(k)) return "";
    return k.replace(/^0+(?=\d)/, "");
  }

  function buildSelectedBrandNormSet_AllMode() {
    const out = new Set();
    const selectedBrands = brandUI?.getSelectedBrands?.() || [];
    for (const b of selectedBrands) {
      const bn = normBrand(b?.name || "");
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

    // brandUI içindeki BRANDS objelerini güncelle
    brandUI?.updateCountsByBrandNormSetMap?.(countByBrandNorm);
  }

  function computeAllModeResult({ tsoftMap, aideMap, selectedBrandsNorm }) {
    const rows = [];
    const unmatchedTsoft = [];
    const unmatchedAide = [];

    const brandKeys = [
      ...new Set([...(tsoftMap?.keys?.() || []), ...(aideMap?.keys?.() || [])]),
    ];
    const filteredBrands = brandKeys.filter(
      (bn) => !selectedBrandsNorm || selectedBrandsNorm.has(bn)
    );

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

        rows.push({
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
        });

        if (t && !a) {
          unmatchedTsoft.push({
            Marka: brandDisp,
            "Ürün Kodu": t.code,
            "Ürün Adı": t.name || "",
            Stok: tStock,
            _bn: brNorm,
          });
        }
        if (a && !t) {
          unmatchedAide.push({
            Marka: brandDisp,
            "Ürün Kodu": a.code,
            "Ürün Adı": a.name || "",
            Stok: aStock,
            _bn: brNorm,
          });
        }
      }
    }

    const cmpTR = (x, y) =>
      String(x || "").localeCompare(String(y || ""), "tr", { sensitivity: "base" });

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

  async function generate() {
    const sel = daily?.getSelected?.() || { tsoft: "", aide: "" };
    const needDaily = !!(sel.tsoft || sel.aide);

    const file = $("f2")?.files?.[0];

    if (!file && !sel.tsoft) {
      alert("Lütfen T-Soft Stok CSV seç veya günlük veriyi seç.");
      return false;
    }
    if (!depot.isReady() && !sel.aide) {
      alert("Lütfen Aide verisi yükle/yapıştır veya günlük Aide verisini seç.");
      return false;
    }

    ui?.setStatus?.("Okunuyor…", "unk");
    setScanState(true);

    try {
      clearOnlyLists();

      // daily seçildiyse: tsoftText ve/veya depot'u daily'den al
      let tsoftText = "";
      if (needDaily) {
        const ymdSel = String(sel.tsoft || sel.aide || "").trim();
        if (!ymdSel) throw new Error("Seçilen tarih bulunamadı.");
        const pass = await daily.getReadPassOrPrompt(ymdSel);

        const want = [];
        sel.tsoft && want.push("tsoft");
        sel.aide && want.push("aide");

        ui?.setStatus?.("Seçilen gün verisi alınıyor…", "unk");
        const got = await daily.apiGet(ymdSel, pass, want); // daily modülü wrapper

        if (sel.tsoft) {
          const d = got?.tsoft;
          if (!d?.exists || !d?.data)
            throw new Error("Seçilen günün T-Soft verisi bulunamadı.");
          tsoftText = String(d.data || "");
        }

        if (sel.aide) {
          const d = got?.aide;
          if (!d?.exists || !d?.data)
            throw new Error("Seçilen günün Aide verisi bulunamadı.");
          depot.reset();
          depot.loadText(String(d.data || ""));
          ui?.setChip?.("l4Chip", `Aide:${depot.count()}`);
        }
      }

      const tsoftRaw = tsoftText ? tsoftText : await readFileText(file);
      const p = parseDelimited(tsoftRaw);
      if (!p.rows.length) throw new Error("T-Soft CSV boş görünüyor.");

      // daily save (T-Soft)
      await daily.trySaveIfChecked({
        kind: "tsoft",
        getRaw: () => tsoftRaw,
      });

      const tsoftMap = parseTsoftRowsToMap(p.rows);
      const aideMap = depot.getBrandItemMap();

      updateBrandCountsFromMaps({ tsoftMap, aideMap });
      brandUI?.render?.(); // count güncellendiği için UI tazele

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

      ui?.setStatus?.("Hazır", "ok");
      brandUI?.lockListTitleFromCurrentSelection?.();
      brandUI?.setListTitleVisible?.(true);

      guide?.updateFromState?.();
      return true;
    } catch (e) {
      const msg = String(e?.message || e || "");
      if (msg.toLowerCase().includes("unauthorized")) {
        daily?.resetReadCache?.();
      }
      console.error(e);
      ui?.setStatus?.(msg || "Hata (konsol)", "bad");
      alert(msg || String(e));
      return false;
    } finally {
      setScanState(false);
      daily?.paint?.();
    }
  }

  function reset() {
    setScanState(false);
    clearOnlyLists();
    ui?.setChip?.("sum", "✓0 • ✕0", "muted");
  }

  return { generate, reset };
}
