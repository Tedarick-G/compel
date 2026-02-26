// ./js/ui/guide.js
/**
 * Guide (pulse) modülü:
 * - brand/tsoft/aide/list adımlarına göre ilgili butonlara guidePulse class'ı uygular
 * - Akalın seçiliyse guide kapalı
 */
export function createGuide({ $, TR, getActiveSupplier } = {}) {
  let guideStep = "brand";

  const GUIDE_DUR = { brand: 1500, tsoft: 1250, aide: 1050, list: 900 };

  // css sadece 1 kez
  (function injectCssOnce() {
    if (document.getElementById("__guideCss")) return;
    const st = document.createElement("style");
    st.id = "__guideCss";
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

  const clearGuidePulse = () =>
    ["brandHintBtn", "sescBox", "depoBtn", "go", "tsoftDailyBtn", "aideDailyBtn"].forEach(
      (id) => {
        const el = $(id);
        el && (el.classList.remove("guidePulse"), el.style.removeProperty("--guideDur"));
      }
    );

  const update = () => {
    clearGuidePulse();

    const sup = String(getActiveSupplier?.() || "");
    if (sup === "Akalın" || guideStep === "done") return;

    const dur = GUIDE_DUR[guideStep] || 1200;
    const apply = (el) =>
      el && (el.style.setProperty("--guideDur", `${dur}ms`), el.classList.add("guidePulse"));

    guideStep === "brand"
      ? apply($("brandHintBtn"))
      : guideStep === "tsoft"
      ? apply($("sescBox"))
      : guideStep === "aide"
      ? apply($("depoBtn"))
      : guideStep === "list" && apply($("go"));
  };

  const setStep = (s) => {
    guideStep = s || "done";
    update();
  };

  /**
   * Dışarıdan state'e bakarak step güncellemek için hook.
   * app.js veya brand/daily/mode tarafı bu fonksiyonu çağırabilir.
   * Burada "hangi adım?" bilgisi dışarıdan hesaplanırsa daha iyi,
   * ama eski davranışı korumak için basit bir callback pattern'i kullanıyoruz.
   */
  let _stateFn = null;
  const setStateResolver = (fn) => {
    _stateFn = typeof fn === "function" ? fn : null;
  };

  const updateFromState = () => {
    if (_stateFn) {
      const s = _stateFn();
      if (s) guideStep = s;
    }
    update();
  };

  return { setStep, update, setStateResolver, updateFromState };
}
