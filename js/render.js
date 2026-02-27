// ./js/render.js
import { esc, stockToNumber } from './utils.js';
import { COLS } from './match.js';

const $ = id => document.getElementById(id);
const colGrp = w => `<colgroup>${w.map(x => `<col style="width:${x}%">`).join('')}</colgroup>`;

const HDR1 = {
  "Sıra No": "Sıra", "Marka": "Marka",
  "Ürün Kodu (Compel)": "Compel Ürün Kodu", "Ürün Adı (Compel)": "Compel Ürün Adı",
  "Ürün Kodu (T-Soft)": "T-Soft Ürün Kodu", "Ürün Adı (T-Soft)": "Tsoft Ürün Adı",
  "Stok (Compel)": "Compel", "Stok (Depo)": "Aide", "Stok (T-Soft)": "T-Soft",
  "EAN (Compel)": "Compel EAN", "EAN (T-Soft)": "T-Soft EAN"
};
const disp = c => HDR1[c] || c;
const fmtHdr = s => {
  s = (s ?? '').toString();
  const m = s.match(/^(.*?)(\s*\([^)]*\))\s*$/);
  return m
    ? `<span class="hMain">${esc(m[1].trimEnd())}</span> <span class="hParen">${esc(m[2].trim())}</span>`
    : esc(s);
};

let _css = false;
function css() {
  if (_css) return; _css = true;
  const st = document.createElement('style');
  st.textContent = `
@keyframes namePulse{0%{text-shadow:0 0 0 rgba(134,239,172,0)}55%{text-shadow:0 0 14px rgba(134,239,172,.75)}100%{text-shadow:0 0 0 rgba(134,239,172,0)}}
.namePulse{animation:namePulse 1000ms ease-in-out infinite;will-change:text-shadow}
.tagFlex{display:flex;gap:10px;align-items:center;justify-content:space-between}
.tagLeft{min-width:0;flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tagRight{flex:0 0 auto;text-align:right;white-space:nowrap;opacity:.92;font-weight:1100}
.tagLeft .nm,.tagLeft .cellTxt{display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sepL{border-left:1px solid rgba(232,60,97,.28)!important;box-shadow:inset 1px 0 0 rgba(0,0,0,.35)}
#listTitle,#unmatchedTitle,#unmatchedSplitTitle{font-weight:1300!important;font-size:20px!important;letter-spacing:.02em}
#t1 thead th .hTxt,#t2 thead th .hTxt,#t2L thead th .hTxt,#t2R thead th .hTxt{display:inline-block;transform-origin:left center}
th.hdrThin{font-weight:700!important}
th.hdrTight .hTxt{letter-spacing:-.02em;font-size:12px}
#t1 thead th,#t2 thead th,#t2L thead th,#t2R thead th{position:sticky!important;top:var(--theadTop,0px)!important;z-index:120!important;background:#1b1b1b!important;box-shadow:0 1px 0 rgba(31,36,48,.9)}
.warnHalo{
  text-shadow:
    -0.8px 0 #000,
     0.8px 0 #000,
     0 -0.8px #000,
     0  0.8px #000,
     0 0 2px var(--warn-halo-2, rgba(245,245,245,.20)),
     0 0 10px var(--warn-halo-1, rgba(245,245,245,.38));
}
th.tightCol,td.tightCol{padding-left:4px!important;padding-right:4px!important}
td.eanCell{white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important}
td.eanCell .cellTxt{white-space:nowrap!important}

/* ✅ SAYFAYA SIĞDIRMA */
.tableWrap{overflow-x:hidden!important}
#t1,#t2,#t2L,#t2R{
  width:100%!important;
  table-layout:fixed!important;
  transform-origin:left top;
}
#t1 th,#t1 td,#t2 th,#t2 td,#t2L th,#t2L td,#t2R th,#t2R td{white-space:nowrap}
#t1 td.nameCell,#t2 td.nameCell,#t2L td.nameCell,#t2R td.nameCell{min-width:0}

/* ✅ Tüm Markalar: pasif T-Soft adı */
.tsoftPassive{
  text-decoration-line:line-through;
  text-decoration-thickness:1px;
  text-decoration-color:rgba(160,160,160,.85);
}

/* ✅ Tüm Markalar: stok tutarsız satır soft pulse */
@keyframes softStockPulse{
  0%{box-shadow:0 0 0 rgba(232,60,97,0); background:transparent}
  55%{box-shadow:0 0 14px rgba(232,60,97,.26); background:rgba(232,60,97,.06)}
  100%{box-shadow:0 0 0 rgba(232,60,97,0); background:transparent}
}
tr.stockPulse{animation:softStockPulse 1000ms ease-in-out infinite}

/* ✅ Split unmatched başlıkları ortalı */
.unmHead{font-weight:1300; text-align:center!important; letter-spacing:.01em;}

/* =========================================================
   ✅ ALL modunda:
   - Dar kolonlar içerik kadar dar kalsın (kırpma yok, alt satır yok)
   - Ürün Adı (T-Soft/Aide) kolonları sayfaya sığana kadar genişlesin
   ========================================================= */
#t1.allAuto, #t2L.allAuto, #t2R.allAuto{
  table-layout:auto!important;
  width:100%!important; /* ✅ boş alan varsa tablo %100'e yayılır */
}
#t1.allAuto .allNarrowCol, #t2L.allAuto .allNarrowCol, #t2R.allAuto .allNarrowCol{
  width:1%!important;
  overflow:visible!important;
  text-overflow:clip!important;
  white-space:nowrap!important;
}
#t1.allAuto .allNameCol, #t2L.allAuto .allNameCol, #t2R.allAuto .allNameCol{
  width:49%!important;
  min-width:240px;
}
#t1.allAuto td, #t1.allAuto th,
#t2L.allAuto td, #t2L.allAuto th,
#t2R.allAuto td, #t2R.allAuto th{
  overflow:visible!important;
  text-overflow:clip!important;
}

/* =========================================================
   ✅ COMPEL unmatched (t2): boş kolonları kaldıran 2'li kart görünümü
   ========================================================= */
.unmGroupCell{
  font-weight:1300;
  letter-spacing:.01em;
  text-align:left!important;
  padding:10px 10px!important;
  background:rgba(232,60,97,.06);
  border-bottom:1px solid var(--border)!important;
}
.uCard{
  display:flex;
  flex-direction:column;
  gap:6px;
  padding:8px 10px;
  border:1px solid var(--border);
  border-radius:10px;
  background:var(--bg-main);
  min-height:58px;
}
.uTop{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
}
.uSeq{
  font-weight:1200;
  opacity:.85;
  color:var(--text-2);
}
.uSrc{
  padding:2px 8px;
  border:1px solid var(--border-2);
  border-radius:999px;
  font-weight:1200;
  font-size:12px;
  line-height:1.2;
}
.uSrc.compel{color:var(--ok)}
.uSrc.tsoft{color:var(--link)}
.uSrc.aide{color:var(--unk)}
.uBrand{
  font-weight:1100;
  opacity:.95;
}
.uCode{
  font-weight:1200;
  letter-spacing:.01em;
}
.uTag{
  margin-left:auto;
  font-weight:1100;
  font-size:12px;
  opacity:.92;
  color:var(--text-2);
  white-space:nowrap;
}
.uNameLine{min-width:0}
.uNameLine .nm{display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;
  document.head.appendChild(st);
}
css();

const cellName = (txt, href, pulse = false, extraCls = '') => {
  const v = (txt ?? '').toString(), u = href || '', cls = `nm${pulse ? ' namePulse' : ''}${extraCls ? ` ${extraCls}` : ''}`;
  return u
    ? `<a class="${cls}" href="${esc(u)}" target="_blank" rel="noopener" title="${esc(v)}">${esc(v)}</a>`
    : `<span class="${cls}" title="${esc(v)}">${esc(v)}</span>`;
};

let _raf = 0, _bound = false;
const sched = () => { _raf && cancelAnimationFrame(_raf); _raf = requestAnimationFrame(adjust); };
const firstEl = td => td?.querySelector('.cellTxt,.nm,input,button,select,div') || null;

function enforceSticky() {
  document.querySelectorAll('.tableWrap').forEach(w => {
    w.style.overflowX = 'hidden';
    w.style.overflowY = 'auto';
    w.style.overflow = 'hidden auto';
  });
  document.documentElement.style.setProperty('--theadTop', '0px');
}

function fitHeader(tableId) {
  const t = $(tableId); if (!t) return;
  t.querySelectorAll('thead th').forEach(th => {
    const sp = th.querySelector('.hTxt'); if (!sp) return;
    sp.style.transform = 'scaleX(1)';
    const avail = Math.max(10, th.clientWidth - 2), need = sp.scrollWidth || 0, s = need > avail ? (avail / need) : 1;
    sp.style.transform = `scaleX(${s})`;
  });
}

/**
 * ✅ Tablonun gerçek genişliğini ölçüp wrap'e sığdır (scaleX).
 */
function fitTableToWrap(tableId) {
  const t = $(tableId);
  if (!t) return;
  const wrap = t.closest('.tableWrap') || t.parentElement;
  if (!wrap) return;

  t.style.transform = 'scaleX(1)';

  const wrapW = wrap.clientWidth || 0;
  if (wrapW <= 0) return;

  const clone = t.cloneNode(true);
  clone.style.visibility = 'hidden';
  clone.style.position = 'absolute';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.transform = 'scaleX(1)';
  clone.style.width = 'auto';
  clone.style.tableLayout = 'auto';
  document.body.appendChild(clone);
  const naturalW = clone.scrollWidth || clone.getBoundingClientRect().width || 0;
  clone.remove();

  if (!naturalW) return;
  const s = Math.min(1, wrapW / naturalW);
  if (s < 0.999) t.style.transform = `scaleX(${s})`;
}

function adjust() {
  _raf = 0; enforceSticky();
  ['t1', 't2', 't2L', 't2R'].forEach(id => { fitHeader(id); fitTableToWrap(id); });

  const nameFit = tableId => {
    const t = $(tableId); if (!t) return;
    const rows = t.querySelectorAll('tbody tr'), G = 6;
    for (const tr of rows) {
      const tds = tr.querySelectorAll('td.nameCell'); if (!tds.length) continue;
      for (let i = tds.length - 1; i >= 0; i--) {
        const td = tds[i], nm = td.querySelector('.nm'); if (!nm) continue;
        const next = td.nextElementSibling, tdR = td.getBoundingClientRect(), nmR = nm.getBoundingClientRect();
        let maxRight = tdR.right - G;
        if (next) {
          const el = firstEl(next);
          if (el) { const r = el.getBoundingClientRect(); maxRight = Math.min(tdR.right + next.getBoundingClientRect().width, r.left - G); }
          else maxRight = next.getBoundingClientRect().right - G;
        }
        nm.style.maxWidth = Math.max(40, maxRight - nmR.left) + 'px';
      }
    }
  };
  ['t1', 't2', 't2L', 't2R'].forEach(nameFit);
  if (!_bound) { _bound = true; addEventListener('resize', sched); }
}

const fmtNum = n => { const x = Number(n); return Number.isFinite(x) ? (Math.round(x) === x ? String(x) : String(x)) : '0'; };

// ✅ Tüm Markalar stok label
const fmtStockLabel = n => {
  const x = Number(n);
  const v = Number.isFinite(x) ? x : 0;
  return (v > 0) ? `Stok Var (${fmtNum(v)})` : `Stok Yok (${fmtNum(v)})`;
};

export function createRenderer({ ui } = {}) {
  return {
    render(R, Ux, depotReady) {
      // Compel modu -> ALL auto class'larını temizle
      const t1 = $('t1'); t1 && t1.classList.remove('allAuto');
      const t2L = $('t2L'); t2L && t2L.classList.remove('allAuto');
      const t2R = $('t2R'); t2R && t2R.classList.remove('allAuto');

      const splitSec = $('unmatchedSplitSection'); splitSec && (splitSec.style.display = 'none');
      const _t2L = $('t2L'); _t2L && (_t2L.innerHTML = '');
      const _t2R = $('t2R'); _t2R && (_t2R.innerHTML = '');

      const T1_SEP_LEFT = new Set(["Ürün Kodu (Compel)", "Ürün Kodu (T-Soft)", "Stok (Compel)", "EAN (Compel)"]);
      const tight = c => (c === "Ürün Kodu (Compel)" || c === "Ürün Kodu (T-Soft)");
      const NARROW_ONLY = new Set(["Sıra No", "Marka", "Ürün Kodu (Compel)", "Ürün Kodu (T-Soft)"]);

      const W1 = [4, 8, 10, 20, 10, 20, 8, 8, 8, 7, 7];

      const head = COLS.map(c => {
        const l = disp(c);
        const cls = [
          T1_SEP_LEFT.has(c) ? 'sepL' : '',
          tight(c) ? 'hdrThin hdrTight' : '',
          NARROW_ONLY.has(c) ? 'tightCol' : ''
        ].filter(Boolean).join(' ');
        return `<th class="${cls}" title="${esc(l)}"><span class="hTxt">${fmtHdr(l)}</span></th>`;
      }).join('');

      const normS = s => String(s ?? '').trim();
      const cmpTR = (a, b) => normS(a).localeCompare(normS(b), 'tr', { sensitivity: 'base' });
      const Rview = (R || [])
        .filter(r => !!r?._m)
        .map((row, idx) => ({ row, idx }))
        .sort((A, B) => {
          const a = A.row, b = B.row;
          const ab = cmpTR(a?.["Marka"], b?.["Marka"]); if (ab) return ab;
          const an = cmpTR(a?.["Ürün Adı (Compel)"], b?.["Ürün Adı (Compel)"]); if (an) return an;
          const ac = cmpTR(a?.["Ürün Kodu (Compel)"], b?.["Ürün Kodu (Compel)"]); if (ac) return ac;
          const tn = cmpTR(a?.["Ürün Adı (T-Soft)"], b?.["Ürün Adı (T-Soft)"]); if (tn) return tn;
          return A.idx - B.idx;
        })
        .map(x => x.row);

      const body = (Rview || []).map((r, rowIdx) => `<tr>${COLS.map((c, idx) => {
        let v = r[c] ?? '';
        if (c === "Sıra No") v = String(rowIdx + 1);

        if (c === "Ürün Adı (Compel)") return `<td class="left nameCell">${cellName(v, r._clink || '')}</td>`;
        if (c === "Ürün Adı (T-Soft)") {
          const txt = (v ?? '').toString().trim();
          return `<td class="left nameCell">${cellName(txt, r._seo || '')}</td>`;
        }

        const seq = idx === 0;
        const ean = (c === "EAN (Compel)" || c === "EAN (T-Soft)");
        const eanBad = (c === "EAN (T-Soft)" && r?._eanBad === true);
        const stokBad = (c === "Stok (T-Soft)" && r?._stokBad === true);
        const bad = eanBad || stokBad;

        const cls = [
          T1_SEP_LEFT.has(c) ? 'sepL' : '',
          seq ? 'seqCell' : '',
          ean ? 'eanCell' : '',
          bad ? 'flagBad' : '',
          NARROW_ONLY.has(c) ? 'tightCol' : ''
        ].filter(Boolean).join(' ');

        const title = (c === "Stok (Depo)" && depotReady) ? `${v} (Depo Toplam: ${r._draw ?? '0'})` : v;
        return `<td class="${cls}" title="${esc(title)}"><span class="cellTxt">${esc(v)}</span></td>`;
      }).join('')}</tr>`).join('');

      $('t1').innerHTML = colGrp(W1) + `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;

      const sec = $('unmatchedSection'), ut = $('unmatchedTitle');
      ut && (ut.textContent = 'T-Soft ve Aide Eşleşmeyenler');

      const U = Array.isArray(Ux) ? Ux : [];
      if (!U.length) { sec && (sec.style.display = 'none'); }
      else {
        sec && (sec.style.display = '');

        const t = s => String(s ?? '').trim();

        // Ux içinden "kaynak" tespiti
        const detectType = r => {
          const cCode = t(r["Compel Ürün Kodu"] ?? r["Ürün Kodu (Compel)"] ?? '');
          const cNm = t(r["Compel Ürün Adı"] ?? r["Ürün Adı (Compel)"] ?? '');
          if (cCode || cNm) return 'compel';

          const tCode = t(r["T-Soft Ürün Kodu"] ?? r["Ürün Kodu (T-Soft)"] ?? '');
          const tNm = t(r["T-Soft Ürün Adı"] ?? r["Ürün Adı (T-Soft)"] ?? '');
          if (tCode || tNm) return 'tsoft';

          const aCode = t(r["Aide Ürün Kodu"] ?? r["Ürün Kodu (Aide)"] ?? '');
          const aNm = t(r["Aide Ürün Adı"] ?? r["Depo Ürün Adı"] ?? r["Ürün Adı (Aide)"] ?? '');
          if (aCode || aNm) return 'aide';

          return 'other';
        };

        const mkItem = (r, i) => {
          const type = detectType(r);
          const seq = t(r["Sıra"] ?? '') || String(i + 1);
          const brand = t(r["Marka"] ?? '');

          if (type === 'compel') {
            const code = t(r["Compel Ürün Kodu"] ?? r["Ürün Kodu (Compel)"] ?? '');
            const name = t(r["Compel Ürün Adı"] ?? r["Ürün Adı (Compel)"] ?? '');
            const href = r._clink || '';
            const pulse = !!r._pulseC;
            const cNum = stockToNumber(r._cstokraw ?? '', { source: 'compel' });
            const tag = name ? (cNum <= 0 ? 'Stok Yok' : 'Stok Var') : '';
            return { type, seq, brand, code, name, href, pulse, tag, extraCls: '' };
          }

          if (type === 'tsoft') {
            const code = t(r["T-Soft Ürün Kodu"] ?? r["Ürün Kodu (T-Soft)"] ?? '');
            const name = t(r["T-Soft Ürün Adı"] ?? r["Ürün Adı (T-Soft)"] ?? '');
            const href = r._seo || '';
            const tAct = r._taktif;
            const tStock = Number(r._tstok ?? 0);
            const tag = name
              ? (tAct === true ? `Aktif • Stok: ${fmtNum(tStock)}` : (tAct === false ? 'Pasif' : ''))
              : '';
            const extraCls = (tAct === false) ? 'tsoftPassive' : '';
            return { type, seq, brand, code, name, href, pulse: false, tag, extraCls };
          }

          if (type === 'aide') {
            const code = t(r["Aide Ürün Kodu"] ?? r["Ürün Kodu (Aide)"] ?? '');
            const name = t(r["Aide Ürün Adı"] ?? r["Depo Ürün Adı"] ?? r["Ürün Adı (Aide)"] ?? '');
            const aNum = Number(r._dstok ?? 0);
            const pulse = !!r._pulseD || aNum > 0;
            const tag = name ? (aNum <= 0 ? 'Stok Yok' : `Stok: ${fmtNum(aNum)}`) : '';
            return { type, seq, brand, code, name, href: '', pulse, tag, extraCls: '' };
          }

          return {
            type: 'other',
            seq, brand,
            code: t(r["Ürün Kodu"] ?? ''),
            name: t(r["Ürün Adı"] ?? ''),
            href: '', pulse: false, tag: '', extraCls: ''
          };
        };

        const card = (it) => {
          const srcLbl = it.type === 'compel' ? 'Compel' : it.type === 'tsoft' ? 'T-Soft' : it.type === 'aide' ? 'Aide' : '—';
          const srcCls = it.type === 'compel' ? 'compel' : it.type === 'tsoft' ? 'tsoft' : it.type === 'aide' ? 'aide' : '';
          const nmHtml = it.name
            ? cellName(it.name, it.href, it.pulse, it.extraCls)
            : `<span class="cellTxt">—</span>`;

          const br = it.brand ? `<span class="uBrand" title="${esc(it.brand)}">${esc(it.brand)}</span>` : '';
          const code = it.code ? `<span class="uCode" title="${esc(it.code)}">${esc(it.code)}</span>` : `<span class="uCode">—</span>`;
          const tag = it.tag ? `<span class="uTag" title="${esc(it.tag)}">${esc(it.tag)}</span>` : `<span class="uTag"></span>`;

          return `<div class="uCard uCard--${esc(it.type)}" title="${esc(srcLbl)}">
            <div class="uTop">
              <span class="uSeq">#${esc(it.seq)}</span>
              <span class="uSrc ${esc(srcCls)}">${esc(srcLbl)}</span>
              ${br}
              ${code}
              ${tag}
            </div>
            <div class="uNameLine">${nmHtml}</div>
          </div>`;
        };

        // ✅ grupları sırayla yaz (Compel -> T-Soft -> Aide)
        const items = U.map(mkItem);
        const groups = {
          compel: items.filter(x => x.type === 'compel'),
          tsoft: items.filter(x => x.type === 'tsoft'),
          aide: items.filter(x => x.type === 'aide'),
          other: items.filter(x => x.type === 'other'),
        };

        const groupLabel = {
          compel: 'Compel Ürün Kodu • Compel Ürün Adı',
          tsoft: 'T-Soft Ürün Kodu • T-Soft Ürün Adı',
          aide: 'Aide Ürün Kodu • Aide Ürün Adı',
          other: 'Diğer',
        };

        const mkPairsRows = (arr) => {
          let out = '';
          for (let i = 0; i < arr.length; i += 2) {
            const a = arr[i];
            const b = arr[i + 1] || null;
            out += `<tr>
              <td class="left nameCell">${a ? card(a) : ''}</td>
              <td class="left nameCell sepL">${b ? card(b) : ''}</td>
            </tr>`;
          }
          return out;
        };

        let body2 = '';
        (['compel', 'tsoft', 'aide', 'other']).forEach(k => {
          const arr = groups[k] || [];
          if (!arr.length) return;
          body2 += `<tr><td class="unmGroupCell" colspan="2" title="${esc(groupLabel[k])}">${esc(groupLabel[k])}</td></tr>`;
          body2 += mkPairsRows(arr);
        });

        const W2 = [50, 50];
        const head2 = `<th class="left" title="Kayıt 1"><span class="hTxt">${fmtHdr('Kayıt 1')}</span></th>` +
                      `<th class="left sepL" title="Kayıt 2"><span class="hTxt">${fmtHdr('Kayıt 2')}</span></th>`;

        $('t2').innerHTML = colGrp(W2) + `<thead><tr>${head2}</tr></thead><tbody>${body2}</tbody>`;
      }

      const matched = (R || []).filter(x => x._m).length;
      ui?.setChip?.('sum', `✓${matched} • ✕${(R || []).length - matched}`, 'muted');
      const dl1 = $('dl1'); dl1 && (dl1.disabled = !(R || []).length);
      enforceSticky(); sched();
    },

    renderAll({ rows = [], unmatchedTsoft = [], unmatchedAide = [] } = {}, opts = {}) {
      // ✅ ALL modunda: auto layout class’larını aktif et
      const t1 = $('t1'); t1 && t1.classList.add('allAuto');
      const t2L = $('t2L'); t2L && t2L.classList.add('allAuto');
      const t2R = $('t2R'); t2R && t2R.classList.add('allAuto');

      const secOld = $('unmatchedSection'); secOld && (secOld.style.display = 'none');
      const t2 = $('t2'); t2 && (t2.innerHTML = '');

      const viewRows = (rows || []).filter(r => r?._m);

      const COLS_ALL = [
        "Sıra", "Marka",
        "Ürün Kodu (T-Soft)", "Ürün Adı (T-Soft)",
        "Ürün Kodu (Aide)", "Ürün Adı (Aide)",
        "Stok (T-Soft)", "Stok (Aide)"
      ];

      const SEP_LEFT = new Set(["Ürün Kodu (T-Soft)", "Ürün Kodu (Aide)", "Stok (T-Soft)"]);

      const isNameCol = c => (c === "Ürün Adı (T-Soft)" || c === "Ürün Adı (Aide)");
      const isNarrowCol = c => (
        c === "Sıra" || c === "Marka" ||
        c === "Ürün Kodu (T-Soft)" || c === "Ürün Kodu (Aide)" ||
        c === "Stok (T-Soft)" || c === "Stok (Aide)"
      );

      const head = COLS_ALL.map(c => {
        const cls = [
          SEP_LEFT.has(c) ? 'sepL' : '',
          isNameCol(c) ? 'allNameCol' : '',
          isNarrowCol(c) ? 'allNarrowCol tightCol' : ''
        ].filter(Boolean).join(' ');
        return `<th class="${cls}" title="${esc(c)}"><span class="hTxt">${fmtHdr(c)}</span></th>`;
      }).join('');

      const body = (viewRows || []).map((r, i) => {
        const trCls = [r?._pulse ? 'stockPulse' : ''].filter(Boolean).join(' ');
        const tNameCls = r?._tpassive ? 'tsoftPassive' : '';
        return `<tr class="${esc(trCls)}">
          <td class="seqCell allNarrowCol tightCol" title="${esc(String(i + 1))}"><span class="cellTxt">${esc(String(i + 1))}</span></td>
          <td class="allNarrowCol tightCol" title="${esc(r["Marka"] || '')}"><span class="cellTxt">${esc(r["Marka"] || '')}</span></td>

          <td class="allNarrowCol tightCol sepL" title="${esc(r["Ürün Kodu (T-Soft)"] || '')}"><span class="cellTxt">${esc(r["Ürün Kodu (T-Soft)"] || '')}</span></td>
          <td class="left nameCell allNameCol"><span class="nm ${tNameCls}" title="${esc(r["Ürün Adı (T-Soft)"] || '')}">${esc(r["Ürün Adı (T-Soft)"] || '')}</span></td>

          <td class="allNarrowCol tightCol sepL" title="${esc(r["Ürün Kodu (Aide)"] || '')}"><span class="cellTxt">${esc(r["Ürün Kodu (Aide)"] || '')}</span></td>
          <td class="left nameCell allNameCol"><span class="nm" title="${esc(r["Ürün Adı (Aide)"] || '')}">${esc(r["Ürün Adı (Aide)"] || '')}</span></td>

          <td class="allNarrowCol tightCol sepL" title="${esc(fmtStockLabel(r["Stok (T-Soft)"]))}"><span class="cellTxt">${esc(fmtStockLabel(r["Stok (T-Soft)"]))}</span></td>
          <td class="allNarrowCol tightCol" title="${esc(fmtStockLabel(r["Stok (Aide)"]))}"><span class="cellTxt">${esc(fmtStockLabel(r["Stok (Aide)"]))}</span></td>
        </tr>`;
      }).join('');

      $('t1').innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;

      const splitSec = $('unmatchedSplitSection');
      const title = $('unmatchedSplitTitle');
      title && (title.textContent = 'Eşleşmeyen Ürünler');

      const hasUnm = (unmatchedTsoft?.length || 0) + (unmatchedAide?.length || 0);
      if (!hasUnm) {
        splitSec && (splitSec.style.display = 'none');
        $('t2L') && ($('t2L').innerHTML = '');
        $('t2R') && ($('t2R').innerHTML = '');
      } else {
        splitSec && (splitSec.style.display = '');
        const colsU = ["Sıra", "Marka", "Ürün Kodu", "Ürün Adı", "Stok"];

        const mkTable = (id, arr, label) => {
          const topHead = `<tr><th class="unmHead" colspan="${colsU.length}" title="${esc(label)}">${esc(label)}</th></tr>`;

          const headU = colsU.map((c) => {
            const cls = [
              (c === "Ürün Kodu") ? 'sepL' : '',
              (c === "Stok") ? 'sepL' : '',
              (c === "Ürün Adı") ? 'allNameCol' : '',
              (c === "Sıra" || c === "Marka" || c === "Ürün Kodu" || c === "Stok") ? 'allNarrowCol tightCol' : ''
            ].filter(Boolean).join(' ');
            return `<th class="${cls}" title="${esc(c)}"><span class="hTxt">${fmtHdr(c)}</span></th>`;
          }).join('');

          const bodyU = (arr || []).map((r, i) => `<tr>
            <td class="seqCell allNarrowCol tightCol" title="${esc(String(i + 1))}"><span class="cellTxt">${esc(String(i + 1))}</span></td>
            <td class="allNarrowCol tightCol" title="${esc(r["Marka"] || '')}"><span class="cellTxt">${esc(r["Marka"] || '')}</span></td>
            <td class="allNarrowCol tightCol sepL" title="${esc(r["Ürün Kodu"] || '')}"><span class="cellTxt">${esc(r["Ürün Kodu"] || '')}</span></td>
            <td class="left nameCell allNameCol"><span class="nm" title="${esc(r["Ürün Adı"] || '')}">${esc(r["Ürün Adı"] || '')}</span></td>
            <td class="allNarrowCol tightCol sepL" title="${esc(fmtStockLabel(r["Stok"]))}"><span class="cellTxt">${esc(fmtStockLabel(r["Stok"]))}</span></td>
          </tr>`).join('');

          $(id).innerHTML = `<thead>${topHead}<tr>${headU}</tr></thead><tbody>${bodyU}</tbody>`;
        };

        mkTable('t2L', unmatchedTsoft, "T-Soft'ta Aide ile Eşleşmeyen Ürünler");
        mkTable('t2R', unmatchedAide, "Aide'de T-Soft ile Eşleşmeyen Ürünler");
      }

      const total = (viewRows || []).length;
      ui?.setChip?.('sum', `✓${total} • ✕0`, 'muted');

      const dl1 = $('dl1'); dl1 && (dl1.disabled = !total);

      enforceSticky(); sched();
    }
  };
}
