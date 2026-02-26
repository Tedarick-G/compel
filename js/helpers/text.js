// ./js/helpers/text.js
/**
 * Bu dosya EKSİKTİ -> import patlarsa app.js hiç çalışmaz, markalar görünmez.
 * Burada:
 * - toTitleCaseTR
 * - buildCanonicalBrandList (ALL modunda kanonik marka listesi)
 * export ediliyor.
 */

export function toTitleCaseTR(s, TR = "tr-TR") {
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

/**
 * ALL modunda gösterilecek kanonik marka listesi.
 * T-Soft seed listesi “öncelikli” (görsel isim seçerken).
 *
 * return: [{ id: brNorm, slug: brNorm, name: displayName, count: "—" }, ...]
 */
export function buildCanonicalBrandList({
  normBrand,
  tsoftSeed = [],
  aideSeed = [],
} = {}) {
  const pref = new Map(); // brNorm -> displayName
  const tsoftSet = new Set(
    (tsoftSeed || []).map((x) => String(x || "").trim()).filter(Boolean)
  );

  const add = (name, priority) => {
    const nm = String(name || "").trim();
    if (!nm) return;
    const k = normBrand(nm);
    if (!k) return;

    if (!pref.has(k)) pref.set(k, nm);
    else {
      const cur = pref.get(k);
      const curPr = cur && tsoftSet.has(cur) ? 2 : 1;
      if (priority > curPr) pref.set(k, nm);
    }
  };

  for (const nm of aideSeed || []) add(nm, 1);
  for (const nm of tsoftSeed || []) add(nm, 2);

  const brands = [...pref.entries()]
    .map(([brNorm, name]) => ({
      id: brNorm,
      slug: brNorm,
      name,
      count: "—",
    }))
    .sort((a, b) =>
      String(a.name).localeCompare(String(b.name), "tr", { sensitivity: "base" })
    );

  return brands;
}
