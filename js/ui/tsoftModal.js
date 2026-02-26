// ./js/ui/tsoftModal.js
/**
 * T-Soft yükleme bilgi penceresi (popover/modal)
 * - "3) T-Soft Stok" (sescBox) tıklanınca modal açılır
 * - "CSV Yükle" (tsoftClose) tıklanınca file picker açılır
 * - "Kapat" (tsoftDismiss) kapatır
 * - ESC basınca: modal açıkken CSV picker açar (eski davranış)
 *
 * Not: index.html içinde bu id’ler zaten var:
 * sescBox, f2, tsoftModal, tsoftInner, tsoftClose, tsoftDismiss
 */
export function createTsoftModal({ $ } = {}) {
  const box = $("sescBox");
  const inp = $("f2");
  const modal = $("tsoftModal");
  const inner = $("tsoftInner");
  const pick = $("tsoftClose");     // "CSV Yükle" butonu
  const dismiss = $("tsoftDismiss"); // "Kapat" butonu

  if (!box || !inp || !modal || !inner || !pick || !dismiss) return;

  // double bind önle
  if (box.__tsoftBound) return;
  box.__tsoftBound = true;

  let allow = false;
  const isOpen = () => modal.style.display === "block";

  const place = () => {
    inner.style.position = "fixed";
    inner.style.left = "12px";
    inner.style.top = "12px";
    inner.style.visibility = "hidden";

    requestAnimationFrame(() => {
      const a = box.getBoundingClientRect();
      const r = inner.getBoundingClientRect();
      const root = getComputedStyle(document.documentElement);
      const M = parseFloat(root.getPropertyValue("--popM")) || 12;
      const G = parseFloat(root.getPropertyValue("--popGap")) || 10;

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

  // sescBox tıklanınca modal aç
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

  // "CSV Yükle"
  pick.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openPicker();
  });

  // "Kapat"
  dismiss.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    hide();
  });

  // ESC -> picker
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isOpen()) return;
    e.preventDefault();
    e.stopPropagation();
    openPicker();
  });

  addEventListener("resize", () => isOpen() && place());
  addEventListener("scroll", () => isOpen() && place(), true);
}
