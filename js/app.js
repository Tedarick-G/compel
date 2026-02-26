// ./js/app.js
// ✅ Bootstrap: asıl uygulamayı dinamik import eder.
// ✅ Herhangi bir import/JS hatasında ekrana (brandStatus + stChip) yazar.

(function () {
  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = String(txt || "");
    el.title = el.textContent;
  };

  const showFatal = (err) => {
    const msg = String(err?.message || err || "Bilinmeyen hata");
    const stack = String(err?.stack || "");
    setText("brandStatus", `JS Hatası: ${msg}`);
    const st = document.getElementById("stChip");
    if (st) {
      st.style.display = "";
      st.textContent = "Kritik hata";
      st.title = stack ? stack : msg;
      st.className = "chip bad";
    }
    // detayları title’a basıyoruz
    const bs = document.getElementById("brandStatus");
    if (bs && stack) bs.title = stack;
  };

  // global yakalayıcılar
  addEventListener("error", (e) => showFatal(e?.error || e?.message || e));
  addEventListener("unhandledrejection", (e) => showFatal(e?.reason || e));

  // Asıl uygulama
  import("./app.main.js").catch(showFatal);
})();
