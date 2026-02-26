// ./js/ui/chips.js
/**
 * Chips/Status helper:
 * - setChip(id,text,cls)
 * - setStatus(text,cls)
 */
export function createUIChips({ $, TR } = {}) {
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

  return { setChip, setStatus };
}
