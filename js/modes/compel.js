// ./js/modes/compel.js
import { TR, T, parseDelimited, pickColumn, readFileText, stockToNumber } from "../utils.js";

export function createCompelMode({
  $,
  TR: _TR,
  apiBase,
  api,
  ui,
  depot,
  matcher,
  renderer,
  brandUI,
  daily,
  guide,
  normBrand,
} = {}) {
  let abortCtrl = null;

  const HASARLI_RE = /Kutusu\s*Hasarlı/i;

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

  const codeNorm = (s) =>
    (s ?? "")
      .toString()
      .replace(/\u00A0/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleUpperCase(TR);
  const codeAlt = (n) => {
    const k = codeNorm(n);
    if (!k || !/^[0-9]+$/.test(k)) return "";
    return k.replace(/^0+(?=\d)/, "");
  };

  function buildSelectedBrandsNormSet() {
    const out = new Set();
    const selected = brandUI?.getSelectedBrands?.() || [];
    for (const b of selected) {
      const bn = normBrand(b?.name || "");
      bn && out.add(bn);
    }
    return out;
  }

  function buildTsoftSupByBrandFromResults(R) {
    const out = new Map();
    for (const row of R || []) {
      if (!row?._m) continue;
      const brNorm = normBrand(row["Marka"] || "");
      if (!brNorm) continue;
      const sup = T(row["Ürün Kodu (T-Soft)"] || "");
      if (!sup) continue;
      const c1 = codeNorm(sup);
      const c2 = codeAlt(c1);
      out.has(brNorm) || out.set(brNorm, new Set());
      const set = out.get(brNorm);
      c1 && set.add(c1);
      c2 && set.add(c2);
    }
    return out;
  }

  function buildUnmatchedListForCompel({ R = [], U = [], UT = [] } = {}) {
    const byBrand = new Map();
    const brandOrder = [];

    const brandKeyOf = (markaRaw) => {
      const m = T(markaRaw || "");
      const bn = typeof normBrand === "function" ? normBrand(m) : "";
      return bn || (m ? m.toLocaleUpperCase(TR).trim() : "");
    };

    const ensure = (markaRaw) => {
      const key = brandKeyOf(markaRaw);
      if (!key) return null;

      if (!byBrand.has(key)) {
        byBrand.set(key, {
          markaDisp: T(markaRaw) || key,
          C: [],
          A: [],
          T0: [],
          T1: [],
          T2: [],
          T3: [],
        });
        brandOrder.push(key);
      } else {
        const g = byBrand.get(key);
        const disp = T(markaRaw);
        if (disp && (!g.markaDisp || g.markaDisp === key)) g.markaDisp = disp;
      }
      return byBrand.get(key);
    };

    // 1) Compel-only
    for (const r of U || []) {
      const marka = r["Marka"] || "";
      const g = ensure(marka);
      if (!g) continue;

      const cCode = T(r["Ürün Kodu (Compel)"] || "");
      const cNm = T(r["Ürün Adı (Compel)"] || "");
      if (!cCode && !cNm) continue;

      g.C.push({
        "Compel Ürün Kodu": cCode,
        "Compel Ürün Adı": cNm,
        _clink: r._clink || "",
        _pulseC: true,
        _cstokraw: r._s1raw || "",
      });
    }

    // 2) T-Soft-only
    for (const r of UT || []) {
      const marka = r["Marka"] || "";
      const g = ensure(marka);
      if (!g) continue;

      const tCode = T(r._sup || "") || T(r._ws || "");
      const tNm = T(r["T-Soft Ürün Adı"] || "");
      if (!tCode && !tNm) continue;

      const tAct = r._aktif;
      const tStock = r._stokraw ? stockToNumber(r._stokraw, { source: "products" }) : 0;

      const item = {
        "T-Soft Ürün Kodu": tCode,
        "T-Soft Ürün Adı": tNm,
        _seo: r._seo || "",
        _taktif: tAct,
        _tstok: tStock,
        _tstokraw: r._stokraw || "",
      };

      if (tAct === true) (Number(tStock) > 0 ? g.T0 : g.T1).push(item);
      else if (tAct === false) g.T3.push(item);
      else g.T2.push(item);
    }

    // 3) Aide-only
    try {
      if (depot?.isReady?.()) {
        const brandsNormSet = buildSelectedBrandsNormSet();
        const tsoftSupByBrand = buildTsoftSupByBrandFromResults(R);
        const depUnm = depot.unmatchedRows({ brandsNormSet, tsoftSupByBrand }) || [];

        for (const r of depUnm) {
          const marka = r["Marka"] || "";
          const g = ensure(marka);
          if (!g) continue;

          const aCode = T(r["Aide Ürün Kodu"] || "");
          const aNm = T(r["Aide Ürün Adı"] || r["Depo Ürün Adı"] || "");
          if (!aCode && !aNm) continue;

          const dnum = Number(r._dnum || 0);
          g.A.push({
            "Aide Ürün Kodu": aCode,
            "Aide Ürün Adı": aNm,
            _dstok: dnum,
            _pulseD: dnum > 0,
          });
        }
      }
    } catch (e) {
      console.warn("depot unmatched build fail", e);
    }

    // ✅ Aide sıralaması: stok çok -> az; en sonda Stok Yok (0 ve altı)
    for (const brKey of brandOrder) {
      const g = byBrand.get(brKey);
      if (!g?.A?.length) continue;

      const pos = [];
      const zero = [];
      for (const it of g.A) {
        const n = Number(it?._dstok ?? 0);
        (n > 0 ? pos : zero).push(it);
      }

      const cmpName = (x, y) =>
        String(x?.["Aide Ürün Adı"] || "").localeCompare(String(y?.["Aide Ürün Adı"] || ""), "tr", { sensitivity: "base" });

      pos.sort((a, b) => (Number(b?._dstok ?? 0) - Number(a?._dstok ?? 0)) || cmpName(a, b));
      zero.sort(cmpName);

      g.A = [...pos, ...zero];
    }

    // ✅ Compel stok sırası: Stok Var önce, Stok Yok en sona
    for (const brKey of brandOrder) {
      const g = byBrand.get(brKey);
      if (!g?.C?.length) continue;
      const cin = [], cout = [];
      for (const it of g.C) {
        const n = stockToNumber(it?._cstokraw ?? '', { source: 'compel' });
        (n > 0 ? cin : cout).push(it);
      }
      g.C = [...cin, ...cout];
    }

    const mkRow = (brandDisp, c, t, a) => {
      const row = {
        Marka: brandDisp || "",
        "Compel Ürün Kodu": "",
        "Compel Ürün Adı": "",
        "T-Soft Ürün Kodu": "",
        "T-Soft Ürün Adı": "",
        "Aide Ürün Kodu": "",
        "Aide Ürün Adı": "",
      };
      c && Object.assign(row, c);
      t && Object.assign(row, t);
      a && Object.assign(row, a);
      return row;
    };

    const out = [];

    const emitTBucket = (bucketKey) => {
      for (const brKey of brandOrder) {
        const g = byBrand.get(brKey);
        if (!g) continue;
        const brandDisp = g.markaDisp || brKey;

        const bucket = g[bucketKey] || [];
        while (bucket.length) {
          const t = bucket.shift();
          const c = g.C.length ? g.C.shift() : null;
          const a = g.A.length ? g.A.shift() : null; // ✅ Aide yüksek stoklar yukarı taşınır
          out.push(mkRow(brandDisp, c, t, a));
        }
      }
    };

    // T-Soft durum fazları
    emitTBucket("T0");
    emitTBucket("T1");
    emitTBucket("T2");

    // C/A-only fazı (pasif için az da olsa ayır)
    for (const brKey of brandOrder) {
      const g = byBrand.get(brKey);
      if (!g) continue;

      const reserveC = Math.min(g.C.length, g.T3.length);
      const reserveA = Math.min(g.A.length, g.T3.length);

      const brandDisp = g.markaDisp || brKey;

      while (g.C.length > reserveC || g.A.length > reserveA) {
        const c = (g.C.length > reserveC) ? g.C.shift() : null;
        const a = (g.A.length > reserveA) ? g.A.shift() : null; // ✅ Aide-only satırlarda da yüksek stoklar önce gelir
        out.push(mkRow(brandDisp, c, null, a));
      }
    }

    // Pasif en alt
    emitTBucket("T3");

    out.forEach((r, i) => (r["Sıra"] = String(i + 1)));
    return out;
  }

  function refresh() {
    const { R, U, UT } = matcher.getResults();
    const Ux = buildUnmatchedListForCompel({ R, U, UT });
    renderer.render(R, Ux, depot.isReady());
  }

  function reset() {
    try { abortCtrl?.abort?.(); } catch {}
    abortCtrl = null;
    setScanState(false);
    clearOnlyLists();
    ui?.setChip?.("l1Chip", "Compel:-");
    ui?.setChip?.("l2Chip", "T-Soft:-");
    ui?.setChip?.("sum", "✓0 • ✕0", "muted");
  }

  async function generate() {
    const sel = daily?.getSelected?.() || { tsoft: "", aide: "" };
    const needDaily = !!(sel.tsoft || sel.aide);

    const file = $("f2")?.files?.[0];
    if (!file && !sel.tsoft) {
      alert("Lütfen T-Soft Stok CSV seç veya günlük veriyi seç.");
      return false;
    }

    ui?.setStatus?.("Okunuyor…", "unk");
    ui?.setChip?.("l1Chip", "Compel:—");
    ui?.setChip?.("l2Chip", "T-Soft:—");

    abortCtrl = new AbortController();
    setScanState(true);

    try {
      clearOnlyLists();
      matcher.resetAll();

      const selectedBrands = brandUI?.getSelectedBrands?.() || [];
      const allBrands = brandUI?.getBrands?.() || [];
      if (selectedBrands.length && allBrands.length && selectedBrands.length === allBrands.length) {
        if (!confirm("Tüm markaları taramak üzeresiniz. Emin misiniz?")) throw new Error("İptal edildi.");
      }

      let t2txt = "";
      if (needDaily) {
        const ymdSel = String(sel.tsoft || sel.aide || "").trim();
        if (!ymdSel) throw new Error("Seçilen tarih bulunamadı.");

        const pass = await daily.getReadPassOrPrompt(ymdSel);
        const want = [];
        sel.tsoft && want.push("tsoft");
        sel.aide && want.push("aide");

        ui?.setStatus?.("Seçilen gün verisi alınıyor…", "unk");
        const got = await api.dailyGet(apiBase, { date: ymdSel, password: pass, want });

        if (sel.tsoft) {
          const d = got?.tsoft;
          if (!d?.exists || !d?.data) throw new Error("Seçilen günün T-Soft verisi bulunamadı.");
          t2txt = String(d.data || "");
        }

        if (sel.aide) {
          const d = got?.aide;
          if (!d?.exists || !d?.data) throw new Error("Seçilen günün Aide verisi bulunamadı.");
          depot.reset();
          depot.loadText(String(d.data || ""));
          ui?.setChip?.("l4Chip", `Aide:${depot.count()}`);
        }
      }

      let seq = 0;
      const chosen = selectedBrands.map((b) => ({ id: b.id, slug: b.slug, name: b.name, count: b.count }));

      const scanPromise = (async () => {
        const rows = [];
        await api.scanCompel(apiBase, chosen, {
          signal: abortCtrl.signal,
          onMessage: (m) => {
            if (!m) return;
            if (m.type === "brandStart" || m.type === "page") {
              ui?.setStatus?.(`Taranıyor: ${m.brand || ""} (${m.page || 0}/${m.pages || 0})`, "unk");
            } else if (m.type === "product") {
              const p = m.data || {};
              const title = String(p.title || "Ürün");
              if (HASARLI_RE.test(title)) return;

              seq++;
              rows.push({
                "Sıra No": String(seq),
                Marka: String(p.brand || ""),
                "Ürün Adı": title,
                "Ürün Kodu": String(p.productCode || ""),
                Stok: String(p.stock || ""),
                EAN: String(p.ean || ""),
                Link: String(p.url || ""),
              });
              if (seq % 250 === 0) ui?.setChip?.("l1Chip", `Compel:${rows.length}`);
            }
          },
        });
        return rows;
      })();

      const t2Promise = t2txt ? Promise.resolve(t2txt) : readFileText(file);
      const [t2txtFinal, L1] = await Promise.all([t2Promise, scanPromise]);
      ui?.setChip?.("l1Chip", `Compel:${L1.length}`);

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
        ui?.setStatus?.("Sütun eksik", "bad");
        alert("T-Soft CSV sütunları eksik. Konsola bak.");
        console.warn("L2 missing", miss);
        return false;
      }

      const L2all = p2.rows;

      await daily.trySaveIfChecked({ kind: "tsoft", getRaw: () => t2txtFinal });

      const compelBrandsNorm = new Set(L1.map((r) => normBrand(r[C1.marka] || "")).filter(Boolean));
      const L2 = L2all.filter((r) => compelBrandsNorm.has(normBrand(r[C2.marka] || "")));

      matcher.loadData({ l1: L1, c1: C1, l2: L2, c2: C2, l2All: L2all });
      matcher.runMatch();
      refresh();

      ui?.setStatus?.("Hazır", "ok");
      ui?.setChip?.("l2Chip", `T-Soft:${L2.length}/${L2all.length}`);

      brandUI?.lockListTitleFromCurrentSelection?.();
      brandUI?.setListTitleVisible?.(true);

      guide?.updateFromState?.();
      return true;
    } catch (e) {
      const msg = String(e?.message || e || "");
      if (msg.toLowerCase().includes("unauthorized")) daily?.resetReadCache?.();
      console.error(e);
      ui?.setStatus?.(msg || "Hata (konsol)", "bad");
      alert(msg || String(e));
      return false;
    } finally {
      abortCtrl = null;
      setScanState(false);
      daily?.paint?.();
    }
  }

  return { generate, refresh, reset };
}
