// ./js/ui/daily.js
import { TR } from "../utils.js";

/**
 * Daily UI modülü:
 * - /api/daily/meta çekip “Bugün … Tarihli Veri” butonlarını boyar
 * - seçilen günlük verileri (tsoft/aide) yönetir
 * - okuma şifresi cache’ini yönetir
 * - “Bugünün verisi olarak kaydet” checkbox’ları ile dailySave yapar
 */
export function createDaily({
  $,
  TR: _TR,
  apiBase,
  api, // {dailyMeta, dailyGet, dailySave}
  ui,
  onAfterPick,
} = {}) {
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
    const todayDate = pickDateFrom(DAILY_META?.today);
    const yestDate = pickDateFrom(DAILY_META?.yesterday);

    if (todayExists) {
      const hm = pickHMFrom(todayTsoft) || pickHMFrom(DAILY_META?.today) || "";
      return { exists: true, isToday: true, ymd: todayDate.ymd, dmy: todayDate.dmy, hm };
    }
    if (yestExists) return { exists: true, isToday: false, ymd: yestDate.ymd, dmy: yestDate.dmy, hm: "" };
    return { exists: false, isToday: false, ymd: "", dmy: "", hm: "" };
  }

  function paint() {
    const tBtn = $("tsoftDailyBtn");
    const aBtn = $("aideDailyBtn");

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

    // preview chip'leri (isteğe bağlı UI elemanları) temiz kalsın
    const tPrev = $("tsoftPrev");
    const aPrev = $("aidePrev");
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
  }

  async function refreshMeta() {
    try {
      DAILY_META = await api.dailyMeta(apiBase);
    } catch (e) {
      console.warn("daily meta fail", e);
      DAILY_META = null;
    }
    paint();
  }

  function toggleDaily(kind) {
    if (kind === "tsoft") {
      const pick = getTsoftDailyPick();
      if (!pick?.exists || !pick?.ymd) return;
      const was = DAILY_SELECTED.tsoft === pick.ymd;
      DAILY_SELECTED.tsoft = was ? "" : pick.ymd;
      paint();
      if (!was) {
        // seçilince modal kapansın (eski davranış)
        $("tsoftDismiss")?.click?.();
      }
    } else if (kind === "aide") {
      const pick = getAideDailyPick();
      if (!pick?.exists || !pick?.ymd) return;
      const was = DAILY_SELECTED.aide === pick.ymd;
      DAILY_SELECTED.aide = was ? "" : pick.ymd;
      paint();
      if (!was) {
        $("depoClose")?.click?.();
      }
    }

    onAfterPick?.();
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
    DAILY_READ_CACHE = { date: ymd, pass: p.trim() };
    return p.trim();
  }

  function resetReadCache() {
    DAILY_READ_CACHE = { date: "", pass: "" };
  }

  function getSelected() {
    return { ...DAILY_SELECTED };
  }

  function clearSelection(kind) {
    if (kind === "tsoft") DAILY_SELECTED.tsoft = "";
    if (kind === "aide") DAILY_SELECTED.aide = "";
  }

  async function apiGet(ymd, pass, want) {
    return await api.dailyGet(apiBase, { date: ymd, password: pass, want });
  }

  async function trySaveIfChecked({ kind, getRaw } = {}) {
    try {
      if (!kind) return;
      const cbId = kind === "tsoft" ? "tsoftSaveToday" : "aideSaveToday";
      const cb = $(cbId);
      if (!cb?.checked) return;

      if (!ensureSaveCredOrCancel()) {
        cb.checked = false;
        return;
      }

      const raw = String(getRaw?.() || "");
      if (!raw.trim()) {
        cb.checked = false;
        return;
      }

      ui?.setStatus?.(`${kind === "tsoft" ? "T-Soft" : "Aide"} kaydediliyor…`, "unk");
      await api.dailySave(apiBase, {
        kind,
        adminPassword: DAILY_SAVE_CRED.adminPassword,
        readPassword: DAILY_SAVE_CRED.readPassword,
        data: raw,
      });

      ui?.setStatus?.(`${kind === "tsoft" ? "T-Soft" : "Aide"} kaydedildi`, "ok");
      cb.checked = false;
      await refreshMeta();
    } catch (err) {
      console.error(err);
      ui?.setStatus?.(String(err?.message || err), "bad");
      alert(String(err?.message || err));
    }
  }

  // --------------------------
  // Bind events once
  // --------------------------
  function bindOnce() {
    if (bindOnce.__done) return;
    bindOnce.__done = true;

    $("tsoftDailyBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      toggleDaily("tsoft");
    });
    $("aideDailyBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      toggleDaily("aide");
    });

    // checkbox'lar şifre istemeli (eski davranış)
    $("tsoftSaveToday")?.addEventListener("change", (e) => {
      const cb = e.target;
      cb.checked && !ensureSaveCredOrCancel() && (cb.checked = false);
    });
    $("aideSaveToday")?.addEventListener("change", (e) => {
      const cb = e.target;
      cb.checked && !ensureSaveCredOrCancel() && (cb.checked = false);
    });

    // Dosya seçilince daily seçimi temizlensin (eski davranış)
    $("f2")?.addEventListener("change", () => {
      const f = $("f2")?.files?.[0];
      if (f) {
        DAILY_SELECTED.tsoft = "";
        paint();
        onAfterPick?.();
      }
    });
  }

  bindOnce();

  return {
    // ui
    paint,
    refreshMeta,

    // state
    getSelected,
    clearSelection,
    resetReadCache,

    // auth/prompt
    getReadPassOrPrompt,

    // api wrapper (all mode kolay kullansın)
    apiGet,

    // save
    trySaveIfChecked,
  };
}
