/* 핏센스 v3 - 화면·핏 계산·라우터 (data.js 의 DB 가 준비된 뒤 index.html 이 불러옴)
   1) 핏 계산·마이핏드백 보정·라우터·SVG  2) 튜토리얼·홈·사이즈 측정·결과  3) 브랜드·상품·후기·기록·찜·마이 */
/* ===== 핏센스 프로토타입 · 핵심 로직 ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SZ = ['XS', 'S', 'M', 'L', 'XL'];
const SZ_WIDE = ['4XS', '3XS', '2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const CATS = ['상의', '하의', '원피스', '아우터'];
const PREFS = ['슬림 핏', '기본 핏', '여유 핏'];
const PARTS = { 상의: ['어깨', '가슴', '소매', '총장'], 아우터: ['어깨', '가슴', '소매', '총장'], 하의: ['허리', '힙', '허벅지', '총장'], 원피스: ['어깨', '가슴', '허리', '총장'] };
// 핏 판정 규칙: zip의 tools/fit_model.py 값을 그대로 가져온 것(실습용 가정값)
const TARGET = { 상의: { 어깨: 1.5, 가슴: 14, 소매: 4 }, 아우터: { 어깨: 3, 가슴: 22, 소매: 6 }, 하의: { 허리: 4, 힙: 7, 허벅지: 5 }, 원피스: { 어깨: 1.5, 가슴: 12, 허리: 14 } };
const PREF_K = { '슬림 핏': -1, '기본 핏': 0, '여유 핏': 1.2 };
const PREF_SCALE = { 어깨: 1.2, 가슴: 5, 허리: 3, 힙: 3, 허벅지: 2.5, 소매: 0 };
const TOL = { 어깨: 1.6, 가슴: 4.5, 허리: 3, 힙: 3, 허벅지: 2.5, 소매: 2.5 };
const W = { 상의: { 어깨: .25, 가슴: .75 }, 아우터: { 어깨: .3, 가슴: .7 }, 하의: { 허리: .4, 힙: .4, 허벅지: .2 }, 원피스: { 어깨: .15, 가슴: .45, 허리: .4 } };
const INC = { 어깨: 1.2, 가슴: 6, 허리: 4, 힙: 4, 허벅지: 3, 소매: 1, 총장: 1.5 };
const LENR = { 상의: .378, 아우터: .397, 원피스: .6 }, LENTOL = { 상의: 3.5, 아우터: 5, 원피스: 6 };
// AI가 사진에서 읽었다고 가정하는 샘플값(M 기준). 프로토타입에서는 고정
const SAMPLE_M = { 상의: { 어깨: 41, 가슴: 100, 소매: 58, 총장: 62 }, 아우터: { 어깨: 44, 가슴: 112, 소매: 61, 총장: 66 }, 하의: { 허리: 70, 힙: 100, 허벅지: 60, 총장: 98 }, 원피스: { 어깨: 40, 가슴: 96, 허리: 80, 총장: 100 } };
const VLABEL = { tight: '타이트', ok: '적당', loose: '여유', short: '짧은 편', long: '긴 편', na: '—' };

/* ---------- 데이터 인덱스 ---------- */
const BR = DB.B, PR = DB.P, RV = DB.R;
const prodById = Object.fromEntries(PR.map(p => [p.id, p]));
const brandById = Object.fromEntries(BR.map(b => [b.id, b]));
const revByProd = {}; RV.forEach(r => (revByProd[r.p] ||= []).push(r));
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const helpfulBase = r => 3 + hash(r.id) % 41, likeBase = r => hash(r.id + 'l') % 19;
const won = n => n ? n.toLocaleString('ko-KR') + '원' : '가격 미확인';
const r1 = x => Math.round(x * 10) / 10;
const sgn = x => (x > 0 ? '+' : x < 0 ? '−' : '±') + Math.abs(r1(x));
const today = () => new Date().toISOString().slice(0, 10).replace(/-/g, '.');

function brandStat(bid) {
  const ids = PR.filter(p => p.b === bid).map(p => p.id), rs = ids.flatMap(i => revByProd[i] || []);
  const ok = rs.filter(r => r.op === '정사이즈').length;
  return { n: PR.filter(p => p.b === bid).length, rv: rs.length, pct: rs.length ? Math.round(ok / rs.length * 100) : 0 };
}
function similarBrandPct(bid, body) {
  const h = +body?.h || 160, w = +body?.w || 52;
  const rs = PR.filter(p => p.b === bid).flatMap(p => revByProd[p.id] || []).filter(r => { const u = DB.U[r.u]; return u && Math.abs(u[0] - h) <= 6 && Math.abs(u[1] - w) <= 7; });
  if (rs.length < 3) return null;
  return { pct: Math.round(rs.filter(r => r.op === '정사이즈').length / rs.length * 100), n: rs.length };
}

/* ---------- 상태 + 저장 ---------- */
const KEY = 'fitsense_wf_v3';
const freshS = () => ({ tutorialHide: false, bodyPhoto: null, body: null, bodyHistory: [], profile: { nick: '핏센스 유저', gender: '여성', bio: '', showBody: true }, records: [], closet: [], likes: { brand: [], product: [], review: [] }, helpful: {}, recent: [], seeded: false });
let S = freshS();
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(freshS(), JSON.parse(raw)); } catch (e) { }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };

/* ---------- 핏 계산 ---------- */
function bodyVals(b) {
  b = b || {};
  const h = +b.h || 160, w = +b.w || 52, n = x => (x ? +x : 0), est = {};
  const pick = (k, v, f) => { const x = n(v); if (!x) est[k] = true; return x || f; };
  const sho = pick('어깨', b.sho, h * .238), chest = pick('가슴', b.chest, h * .5 + (w - 52) * .6 + 2), waist = pick('허리', b.waist, h * .4 + (w - 52) * .6), hip = pick('힙', b.hip, h * .575 + (w - 52) * .6);
  const thigh = pick('허벅지', b.thigh, hip * .595), arm = pick('소매', b.arm, h * .3375);
  return { h, w, 어깨: r1(sho), 가슴: r1(chest), 허리: r1(waist), 힙: r1(hip), 허벅지: r1(thigh), 소매: r1(arm), est };
}
function evalSize(cat, g, bv, pref, pers = {}) {
  const rows = []; let score = 0;
  PARTS[cat].forEach(p => {
    if (g[p] == null || g[p] === '') return;
    const gv = +g[p];
    if (p === '총장') {
      const ratio = LENR[cat];
      if (ratio) { const exp = bv.h * ratio, d = gv - exp, t = LENTOL[cat]; rows.push({ part: p, body: r1(exp), garment: gv, diff: d, v: d < -t ? 'short' : d > t ? 'long' : 'ok', len: true }); }
      else rows.push({ part: p, body: null, garment: gv, diff: null, v: 'na', len: true });
      return;
    }
    const tg = TARGET[cat][p] + PREF_K[pref] * PREF_SCALE[p] + (pers[p] || 0), ease = gv - bv[p], d = ease - tg, tol = TOL[p];
    rows.push({ part: p, body: bv[p], garment: gv, ease, target: tg, diff: d, tol, v: d < -tol ? 'tight' : d > tol ? 'loose' : 'ok', est: !!bv.est[p] });
    if (W[cat][p]) score += W[cat][p] * Math.abs(d) / tol;
  });
  return { rows, score };
}
// 한 사이즈만 아는 경우 나머지는 사이즈 간격으로 추정(ex 표시)
function fullChart(cat, given) {
  const ks = SZ.filter(s => given[s]); if (!ks.length) return { chart: {}, ex: {} };
  const chart = {}, ex = {};
  SZ.forEach((s, i) => {
    if (given[s]) { chart[s] = { ...given[s] }; return; }
    const near = ks.reduce((a, k) => Math.abs(SZ.indexOf(k) - i) < Math.abs(SZ.indexOf(a) - i) ? k : a, ks[0]), d = i - SZ.indexOf(near);
    chart[s] = {}; PARTS[cat].forEach(p => { if (given[near][p] != null) chart[s][p] = r1(+given[near][p] + INC[p] * d); }); ex[s] = true;
  });
  return { chart, ex };
}
function recommend(cat, chart, bv, pref, pers = {}) {
  const sc = SZ.filter(s => chart[s]).map(s => ({ s, ...evalSize(cat, chart[s], bv, pref, pers) }));
  sc.sort((a, b) => a.score - b.score);
  return { best: sc[0].s, all: Object.fromEntries(sc.map(x => [x.s, x.score])), gap: sc[1] ? sc[1].score - sc[0].score : 9 };
}
function quickRec(prod) {
  if (!prod?.ch || !S.body) return null;
  const cat = prod.c, bv = bodyVals(S.body), pref = S.body.pref || '기본 핏';
  try { return recommend(cat, prod.ch, bv, pref, persInfo().shift).best; } catch (e) { return null; }
}
function buildAnalysis(d) {
  // d: 측정 초안. 우선순위 = 직접 입력 > 불러온 상품 > AI 샘플
  const cat = d.cat, prod = d.productId ? prodById[d.productId] : null;
  const typed = {}; PARTS[cat].forEach(p => { if (d.rows[p] !== undefined && d.rows[p] !== '') typed[p] = +d.rows[p]; });
  let given, source;
  if (prod?.ch) {
    // 상품 사이즈표를 불러온 경우: 그대로 쓰되, 사용자가 고친 값은 모든 사이즈에 같은 차이만큼 반영
    given = JSON.parse(JSON.stringify(prod.ch)); source = 'product';
    if (d.touched && given[d.size]) {
      PARTS[cat].forEach(p => { if (typed[p] != null && given[d.size][p] != null) { const dl = typed[p] - given[d.size][p]; if (Math.abs(dl) > 0.01) { source = 'manual'; SZ.forEach(z => { if (given[z] && given[z][p] != null) given[z][p] = r1(given[z][p] + dl); }); } } });
    }
  }
  else if (Object.keys(typed).length >= 2) { given = { [d.size]: typed }; source = 'manual'; }
  else { given = { M: SAMPLE_M[cat] }; source = 'sample'; }
  const { chart, ex } = fullChart(cat, given);
  const bv = bodyVals(S.body), pref = S.body?.pref || '기본 핏', pi = persInfo(), rec = recommend(cat, chart, bv, pref, pi.shift);
  return {
    id: 'A' + Date.now(), date: today(), cat, brandId: d.brandId, brandName: d.brandId ? brandById[d.brandId].n : (d.brandText || '직접 입력'),
    productId: d.productId || null, productName: prod ? prod.n : (d.name || ''), photoType: '사이즈표', link: d.link || '', hasPhoto: !!d.photo, source, chart, ex,
    sel: rec.best, rec: rec.best, gap: rec.gap, body: { ...S.body }, pref, pers: pi, corrected: false, fb: null
  };
}
function analysisView(A) { // 선택한 사이즈 기준 평가 + 추천 재계산
  const bv = bodyVals(A.body), sh = A.pers?.shift || {}, ev = evalSize(A.cat, A.chart[A.sel] || {}, bv, A.pref, sh), rec = recommend(A.cat, A.chart, bv, A.pref, sh);
  return { bv, ev, rec };
}

/* ---------- 핏 시각화(SVG 실루엣) ---------- */
function fitSVG(cat, rows, h) {
  const C = { tight: 'var(--tight)', ok: 'var(--ok)', loose: 'var(--loose)', short: 'var(--tight)', long: 'var(--loose)', na: 'var(--mute)' };
  const by = Object.fromEntries(rows.map(r => [r.part, r]));
  const z = (p, shape) => by[p] ? shape(C[by[p].v]) : '';
  const fillz = c => `style="fill:${c};fill-opacity:.42;stroke:${c}" stroke-width="1.6"`;
  const ARM_L = 'M106 82 C94 100 88 150 84 216 L98 218 C102 168 108 124 116 96 Z', ARM_R = 'M194 82 C206 100 212 150 216 216 L202 218 C198 168 192 124 184 96 Z';
  const tagY = { 어깨: 84, 가슴: 118, 소매: 152, 허리: cat === '하의' ? 156 : 158, 힙: 204, 허벅지: 258 };
  const zoneEdge = { 어깨: [194, 81], 가슴: [188, 115], 소매: [211, 150], 허리: [178, 155], 힙: [196, 204], 허벅지: [192, 258] };
  let tags = '';
  rows.forEach(r => {
    if (r.len) return;
    const y = tagY[r.part], e = zoneEdge[r.part], c = C[r.v], txt = `${r.part} ${r1(r.ease) > 0 ? '+' : ''}${r1(r.ease)}`;
    tags += `<line x1="${e[0]}" y1="${e[1]}" x2="224" y2="${y}" style="stroke:${c}" stroke-width="1" stroke-dasharray="2 2"/><rect x="224" y="${y - 10}" width="74" height="20" rx="10" style="fill:var(--s0);stroke:${c}"/><text x="261" y="${y + 4}" text-anchor="middle" font-size="10.5" font-weight="700" style="fill:${c}">${txt}</text>`;
  });
  let len = '';
  const L = by['총장'];
  if (L) {
    const k = 407 / h, y0 = cat === '하의' ? 152 : 77, y1 = Math.min(432, y0 + L.garment * k), c = C[L.v];
    len = `<line x1="64" y1="${y0}" x2="64" y2="${y1}" style="stroke:${c}" stroke-width="2"/><line x1="58" y1="${y0}" x2="70" y2="${y0}" style="stroke:${c}" stroke-width="2"/><line x1="58" y1="${y1}" x2="70" y2="${y1}" style="stroke:${c}" stroke-width="2"/>
    <line x1="70" y1="${y1}" x2="230" y2="${y1}" style="stroke:${c}" stroke-width="1.4" stroke-dasharray="5 4"/>
    <rect x="2" y="${Math.min(y1 - 10, 414)}" width="56" height="20" rx="10" style="fill:var(--s0);stroke:${c}"/><text x="30" y="${Math.min(y1 + 4, 428)}" text-anchor="middle" font-size="10.5" font-weight="700" style="fill:${c}">총장 ${L.diff != null ? (r1(L.diff) > 0 ? '+' : '') + r1(L.diff) : r1(L.garment)}</text>`;
  }
  return `<svg class="fitsvg" viewBox="0 0 300 440" role="img" aria-label="부위별 핏 실루엣">
  <g style="fill:var(--s1);stroke:var(--line2)" stroke-width="1.4">
    <circle cx="150" cy="36" r="19"/><path d="M143 54 L143 70 L157 70 L157 54"/>
    <path d="M108 80 C106 108 120 128 124 158 C118 180 106 196 104 218 L196 218 C194 196 182 180 176 158 C180 128 194 108 192 80 Q150 68 108 80Z"/>
    <path d="M104 218 L149 218 L145 300 L141 424 L121 424 L116 300 Z"/><path d="M196 218 L151 218 L155 300 L159 424 L179 424 L184 300 Z"/>
    <path d="${ARM_L}"/><path d="${ARM_R}"/>
  </g>
  ${z('소매', c => `<path d="${ARM_L}" ${fillz(c)}/><path d="${ARM_R}" ${fillz(c)}/>`)}
  ${z('어깨', c => `<rect x="106" y="74" width="88" height="14" rx="7" ${fillz(c)}/>`)}
  ${z('가슴', c => `<rect x="112" y="104" width="76" height="22" rx="6" ${fillz(c)}/>`)}
  ${z('허리', c => `<rect x="122" y="146" width="56" height="18" rx="6" ${fillz(c)}/>`)}
  ${z('힙', c => `<rect x="104" y="192" width="92" height="24" rx="8" ${fillz(c)}/>`)}
  ${z('허벅지', c => `<rect x="108" y="226" width="38" height="64" rx="10" ${fillz(c)}/><rect x="154" y="226" width="38" height="64" rx="10" ${fillz(c)}/>`)}
  ${len}${tags}</svg>`;
}

/* ---------- 라우터 ---------- */
let stack = [{ v: 'home', p: {} }];
const V = {}; // 화면 함수 모음(app2.js)
let sheetOpen = false;
function render(keepScroll) {
  const cur = stack.at(-1), view = $('#view');
  view.innerHTML = '<div class="scr">' + (V[cur.v] ? V[cur.v](cur.p) : '<div class="empty">화면 없음</div>') + '</div>';
  view.scrollTop = keepScroll ? (cur.sy || 0) : (cur.sy || 0);
  const full = ['tutorial', 'analyzing'].includes(cur.v);
  $('#nav').style.display = full ? 'none' : '';
  const rootOf = { home: 'home', tutorial: 'home', measure: 'home', analyzing: 'home', saved: 'home', brand: 'brand', brandDetail: 'brand', product: 'brand', review: 'brand', records: 'records', feedback: 'records', closetAdd: 'records', likes: 'likes', my: 'my', profile: 'my', myfit: 'my', recent: 'my' };
  let t = rootOf[cur.v] || 'my';
  if (cur.v === 'result') t = cur.p.rid ? 'records' : 'home';
  if (cur.v === 'saved' && cur.p.rid) t = 'records';
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  if (V[cur.v + '$after']) V[cur.v + '$after'](cur.p);
}
function go(v, p = {}) { stack.at(-1).sy = $('#view').scrollTop; stack.push({ v, p }); $('#view').scrollTop = 0; render(); $('#view').scrollTop = 0; }
function back() { if (stack.length > 1) { stack.pop(); render(); } else tab('home'); }
function tab(t) { stack = [{ v: t === 'my' ? 'my' : t, p: {} }]; render(); $('#view').scrollTop = 0; }
function replaceTop(v, p = {}) { stack[stack.length - 1] = { v, p }; render(); $('#view').scrollTop = 0; }
function reRender() { const y = $('#view').scrollTop; render(); $('#view').scrollTop = y; }

/* ---------- 시트·토스트 ---------- */
function sheet(html, mid) {
  closeSheet();
  const d = document.createElement('div'); d.className = 'scrim' + (mid ? ' mid' : ''); d.id = 'scrim';
  d.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  d.addEventListener('click', e => { if (e.target === d) closeSheet(); });
  $('#phone').appendChild(d);
}
function closeSheet() { const s = $('#scrim'); if (s) s.remove(); }
let tt;
function toast(msg) {
  const old = $('#toast'); if (old) old.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.id = 'toast'; t.textContent = msg; $('#phone').appendChild(t);
  clearTimeout(tt); tt = setTimeout(() => t.remove(), 1800);
}

/* ---------- 이미지 축소(저장 용량 절약) ---------- */
function readPhoto(file, max, cb) {
  const fr = new FileReader();
  fr.onload = () => { const im = new Image(); im.onload = () => {
    const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k;
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .72));
  }; im.onerror = () => cb(null); im.src = fr.result; };
  fr.readAsDataURL(file);
}

/* ---------- 초성 검색 ---------- */
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const choOf = s => [...s].map(c => { const k = c.charCodeAt(0) - 44032; return k >= 0 && k < 11172 ? CHO[Math.floor(k / 588)] : c; }).join('');
function findIn(text, q) {
  q = q.trim().toLowerCase(); if (!q) return null;
  const t = text.toLowerCase(); let i = t.indexOf(q);
  if (i < 0 && /^[ㄱ-ㅎ]+$/.test(q)) i = choOf(text).indexOf(q);
  return i < 0 ? null : [i, q.length];
}
function hl(text, q) { const m = findIn(text, q); return m ? esc(text.slice(0, m[0])) + '<mark>' + esc(text.slice(m[0], m[0] + m[1])) + '</mark>' + esc(text.slice(m[0] + m[1])) : esc(text); }

/* ---------- 아이콘 ---------- */
const IC = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  measure: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
  brand: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  my: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  heart: '<path d="M12 20s-7-4.6-9-9.2C1.8 7 4 4 7 4c2 0 3.500 1 5 3 1.500-2 3-3 5-3 3 0 5.200 3 4 6.800C19 15.400 12 20 12 20z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  thumb: '<path d="M7 11v9H4v-9zM7 11l4-8c2 0 3 1 3 3l-1 4h6a2 2 0 0 1 2 2.300l-1.300 6A2 2 0 0 1 17.800 20H7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>', chev: '<path d="M9 5l7 7-7 7"/>'
};
const ico = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24">${IC[n]}</svg>`;

/* ---------- 마이핏드백 → 개인 보정값 ----------
   피드백(분석 기록 피드백 + 내 옷장)에서 부위별 "타이트"가 많으면 그 부위의 선호 여유를 늘리고, "여유"가 많으면 줄인다.
   전체 핏이 작음/여유면 가슴·허리·힙에 절반 가중치로 반영. 보정폭은 부위 허용오차(TOL)의 최대 ±1배. */
function persInfo() {
  const items = [...S.records.filter(r => r.fb).map(r => r.fb), ...S.closet];
  const t = {}, l = {};
  items.forEach(f => {
    Object.entries(f.parts || {}).forEach(([k, v]) => { if (v === '타이트') t[k] = (t[k] || 0) + 1; if (v === '여유') l[k] = (l[k] || 0) + 1; });
    const o = f.overall === '작음' ? 1 : f.overall === '여유' ? -1 : 0;
    if (o) ['가슴', '허리', '힙'].forEach(k => { const m = o > 0 ? t : l; m[k] = (m[k] || 0) + .5; });
  });
  const shift = {};
  Object.keys(TOL).forEach(k => { const d = (t[k] || 0) - (l[k] || 0); if (d) shift[k] = r1(Math.max(-1, Math.min(1, d * .35)) * TOL[k]); });
  return { n: items.length, shift };
}
/* ---------- 최저가·사이즈 경향 (JSON에 값이 없으면 더미로 계산) ---------- */
const SHOPS = ['무신사', '29CM', '쿠팡', '브랜드 공식몰', 'SSF샵'];
function priceInfo(p) {
  if (!p.pr) return null; const h = hash(p.id);
  return { low: p.low || Math.round(p.pr * (0.82 + (h % 12) / 100) / 100) * 100, shop: p.shop || SHOPS[h % SHOPS.length], url: p.url || brandById[p.b]?.site || '', dummy: !p.low };
}
function brandTend(bid, cat) {
  const rs = PR.filter(p => p.b === bid && (!cat || p.c === cat)).flatMap(p => revByProd[p.id] || []), n = rs.length || 1;
  const sm = Math.round(rs.filter(r => r.op === '작은 편').length / n * 100), bg = Math.round(rs.filter(r => r.op === '큰 편').length / n * 100), ok = 100 - sm - bg;
  const given = cat ? null : brandById[bid]?.tend;
  const label = given || (bg - sm >= 12 ? '크게 나오는 편' : sm - bg >= 12 ? '작게 나오는 편' : '정사이즈 경향');
  return { sm, ok, bg, label, cls: label.includes('크게') ? 'loose' : label.includes('작게') ? 'tight' : 'ok' };
}
/* 한 사이즈에 대한 전체 의견: 부위별 편차를 가중 평균 */
function sizeVerdict(cat, ev) {
  let s = 0, w = 0; ev.rows.forEach(r => { if (r.len || r.diff == null) return; const k = W[cat][r.part] || .1; s += k * r.diff / r.tol; w += k; });
  const m = w ? s / w : 0;
  return m < -.8 ? { t: '작게 느껴져요', c: 'tight' } : m > .8 ? { t: '크게 느껴져요', c: 'loose' } : { t: '잘 맞아요', c: 'ok' };
}

/* ===== 화면 1: 튜토리얼 · 홈 · 사이즈 측정(2단계) · 분석 결과 ===== */
const ACT = {}, INP = {}, CHG = {};
const topbar = (title, o = {}) => `<div class="topbar"><button class="ib" data-a="${o.act || 'back'}" aria-label="${o.left === 'close' ? '닫기' : '뒤로'}" ${stack.length <= 1 && !o.act ? 'style="visibility:hidden" tabindex="-1"' : ''}>${ico(o.left === 'close' ? 'close' : 'back')}</button><h2>${esc(title)}</h2><div>${o.right || ''}</div></div>`;
const chipsHTML = (arr, cur, act, extra = '') => arr.map(x => `<button class="chip ${(Array.isArray(cur) ? cur.includes(x) : cur === x) ? 'on' : ''}" data-a="${act}" data-v="${esc(x)}" ${extra}>${esc(x)}</button>`).join('');
const segHTML = (arr, cur, act, cls = '') => `<div class="seg ${cls}">${arr.map(x => `<button class="${cur === x ? 'on' : ''}" data-a="${act}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
const num = v => (v === '' || v == null || isNaN(+v)) ? '' : +v;
const pillV = v => `<span class="pill ${v}">${VLABEL[v]}</span>`;
const stars = n => `<span class="stars" aria-label="별점 ${n}점">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
const nick = () => S.profile.nick;

/* ---------- 바디 프로필 폼(측정 1단계 · 마이핏 공용) ---------- */
let BD = {};
const loadBD = () => { BD = S.body ? { ...S.body } : { h: '', w: '', pref: '기본 핏' }; };
const DETAILS = [['sho', '어깨너비', '어깨'], ['chest', '가슴둘레', '가슴'], ['waist', '허리둘레', '허리'], ['hip', '엉덩이둘레', '힙'], ['thigh', '허벅지둘레', '허벅지'], ['arm', '팔길이', '소매']];
const bdCount = () => DETAILS.filter(d => BD[d[0]] !== undefined && BD[d[0]] !== '' && BD[d[0]] !== null).length;
const accText = n => n >= 5 ? '정확도 높음 · 추정 없이 내 치수로 계산해요' : n >= 2 ? '정확도 보통 · 빈 칸은 키·몸무게로 추정해요' : '정확도 기본 · 세부 치수를 넣을수록 핏 판정이 정확해져요';
function bodyFormHTML() {
  const bv = bodyVals(BD), n = bdCount();
  const f = (k, label, unit, ph) => `<div><label class="f" for="bd-${k}">${label}</label><div class="unit"><input id="bd-${k}" class="inp num" inputmode="decimal" data-i="bd" data-k="${k}" value="${esc(BD[k] ?? '')}" placeholder="${ph}"><i>${unit}</i></div></div>`;
  return `<div class="grid2 field">${f('h', '키 *', 'cm', '160')}${f('w', '몸무게 *', 'kg', '52')}</div>
  <div class="detail-card field"><div class="row between"><b style="font-size:17px">세부 치수 입력</b><button class="btn s" data-a="measureHow">재는 법 ⓘ</button></div>
    <div class="row mt8" style="gap:10px"><div class="meter grow"><i id="bd-mt" style="width:${n / 6 * 100}%"></i></div><b class="sm num" id="bd-n">${n}/6</b></div>
    <p class="hint" id="bd-hint" style="margin:6px 0 12px">${accText(n)}</p>
    <div class="grid2">${DETAILS.map(d => f(d[0], d[1], 'cm', '추정 ' + bv[d[2]])).join('')}</div></div>
  <div class="field"><label class="f">선호 핏</label>${segHTML(PREFS, BD.pref || '기본 핏', 'bdPref')}<p class="hint">${{ '슬림 핏': '몸에 가깝게 붙는 걸 좋아해요', '기본 핏': '보통 여유로 입어요', '여유 핏': '넉넉하게 입는 걸 좋아해요' }[BD.pref || '기본 핏']}</p></div>`;
}
INP.bd = t => { BD[t.dataset.k] = t.value; if (t.dataset.k !== 'h' && t.dataset.k !== 'w') { const n = bdCount(); $('#bd-n').textContent = n + '/6'; $('#bd-mt').style.width = n / 6 * 100 + '%'; $('#bd-hint').textContent = accText(n); } };
ACT.bdPref = t => { BD.pref = t.dataset.v; reRender(); };
ACT.measureHow = () => sheet(`<h3>치수 재는 법</h3><div class="list" style="margin:8px -16px 0">${[['어깨너비', '양쪽 어깨 끝점 사이를 일직선으로'], ['가슴둘레', '가슴이 가장 풍만한 곳을 한 바퀴'], ['허리둘레', '배꼽 위 가장 잘록한 곳을 한 바퀴'], ['엉덩이둘레', '엉덩이 가장 튀어나온 곳을 한 바퀴'], ['허벅지둘레', '다리가 갈라지는 지점 바로 아래'], ['팔길이', '어깨 끝에서 손목뼈까지']].map(([a, b]) => `<div class="li" style="padding:10px 16px"><b class="sm" style="width:80px">${a}</b><span class="sm mute">${b}</span></div>`).join('')}</div><button class="btn pri full mt16" data-a="sheetClose">확인</button>`);
function photoCardHTML() {
  const ph = S.bodyPhoto;
  return `<div class="card" style="padding:14px"><div class="row" style="gap:12px;align-items:flex-start"><label class="upload" for="bphoto" style="width:96px;height:128px;flex:none;border-radius:12px;cursor:pointer">${ph ? `<img src="${ph}" alt="내 전신 사진">` : `<span>${ico('plus', 'ico')}<br><span class="xs">전신 사진</span></span>`}</label>
  <input id="bphoto" type="file" accept="image/*" hidden data-c="bPhoto"><div class="grow"><b>전신 사진 <span class="mute sm">(선택)</span></b>
  <p class="sm ink2" style="margin:4px 0 8px">숫자만으로는 알 수 없는 <b>실제 핏</b>을 함께 확인하는 데 써요. 한 번 올리면 다음 측정에도 계속 사용돼요.</p>
  ${ph ? `<div class="row" style="gap:6px"><label class="btn s" for="bphoto" style="cursor:pointer">교체</label><button class="btn s flat" data-a="bPhotoDel">삭제</button></div><p class="hint">저장됨 · 이 기기에만 보관돼요</p>` : `<p class="hint">정면으로 서서, 몸에 붙는 옷, 발끝까지 나오게</p>`}</div></div></div>`;
}
CHG.bPhoto = t => { const f = t.files[0]; if (f) readPhoto(f, 640, d => { S.bodyPhoto = d; save(); reRender(); }); };
ACT.bPhotoDel = () => { S.bodyPhoto = null; save(); reRender(); };
function commitBody() {
  const h = +BD.h, w = +BD.w;
  if (!(h >= 120 && h <= 210) || !(w >= 30 && w <= 150)) { toast('키(120~210)와 몸무게(30~150)를 확인해 주세요'); return false; }
  const nb = { h, w, sho: num(BD.sho), chest: num(BD.chest), waist: num(BD.waist), hip: num(BD.hip), thigh: num(BD.thigh), arm: num(BD.arm), pref: BD.pref || '기본 핏' };
  const same = S.body && ['h', 'w', 'sho', 'chest', 'waist', 'hip', 'thigh', 'arm', 'pref'].every(k => (S.body[k] ?? '') === (nb[k] ?? ''));
  if (!same) { if (S.body) S.bodyHistory.unshift({ ...S.body }); S.bodyHistory = S.bodyHistory.slice(0, 5); nb.updated = today(); } else nb.updated = S.body.updated;
  S.body = nb; seedRecords(); save(); return true;
}

/* ---------- 튜토리얼: 사이즈 측정에 들어가기 전에 따로 한 번 ---------- */
const TUT = [
  { t: '1. 내 바디 프로필을<br>입력해요', d: '키·몸무게와 세부 치수, 전신 사진을 한 번 저장해 두면 다음부터 자동으로 불러와요.', i: 'b' },
  { t: '2. 옷의 사이즈표를<br>올려요', d: '브랜드를 고르고 사이즈표 사진을 올리면 AI가 실측을 읽어요. 우리 DB에 있는 상품은 골라서 바로 분석해요.', i: 'c' },
  { t: '3. 사이즈별 의견을<br>확인해요', d: '가장 잘 맞는 사이즈를 먼저 알려주고, 다른 사이즈는 어떤지도 부위별로 볼 수 있어요.', i: 'd' }
];
function tutIllu(k) {
  if (k === 'b') return `<div style="width:236px" class="card pad"><div class="grid2"><div><div class="xs mute">키</div><div class="inp row" style="pointer-events:none">162 cm</div></div><div><div class="xs mute">몸무게</div><div class="inp row" style="pointer-events:none">53 kg</div></div></div><div class="detail-card mt12" style="padding:10px"><div class="b sm">세부 치수 3/6</div><div class="meter mt8"><i style="width:50%"></i></div></div></div>`;
  if (k === 'c') return `<div class="row" style="gap:12px"><div class="ph" style="width:96px;height:130px"><span>사이즈표</span></div><div class="card" style="width:112px;padding:10px;font-size:11px"><div class="b">브랜드</div><div class="inp" style="height:28px;font-size:11px;display:flex;align-items:center;pointer-events:none">유니</div><div class="mt8 b">유니클로</div><div class="mute">상품 불러오기(선택)</div></div></div>`;
  return `<div style="width:190px">${fitSVG('상의', evalSize('상의', { 어깨: 41, 가슴: 100, 소매: 58, 총장: 62 }, bodyVals({ h: 162, w: 53 }), '기본 핏').rows, 162)}</div>`;
}
let T = { step: 0, hide: false };
V.tutorial = () => {
  const s = T.step, d = TUT[s];
  return `<div class="tut"><div class="row between" style="padding:6px 8px 0 4px"><button class="ib" data-a="back" aria-label="닫기">${ico('close')}</button><span class="xs mute b">${s + 1} / ${TUT.length}</span><button class="link" data-a="tutSkip" style="padding:0 12px">건너뛰기</button></div>
  <div class="illu">${tutIllu(d.i)}</div>
  <div class="pad" style="padding-top:8px;text-align:center"><h1 class="big">${d.t}</h1><p class="sub">${d.d}</p></div>
  <div style="margin-top:auto;padding:16px"><div class="dots" style="margin-bottom:14px">${TUT.map((_, i) => `<i class="${i === s ? 'on' : ''}"></i>`).join('')}</div>
  <button class="row" role="checkbox" aria-checked="${T.hide}" data-a="tutHide" style="background:none;border:0;padding:6px 0;margin:0 auto 10px"><span class="cbx ${T.hide ? 'on' : ''}">${T.hide ? '✓' : ''}</span><span class="sm ink2">다시 보지 않기</span></button>
  <div class="row">${s > 0 ? `<button class="btn flat" data-a="tutPrev" style="width:96px">이전</button>` : ''}<button class="btn pri grow" data-a="tutNext">${s === TUT.length - 1 ? '사이즈 측정 시작하기' : '다음'}</button></div></div></div>`;
};
ACT.tutNext = () => { if (T.step >= TUT.length - 1) finishTutorial(); else { T.step++; render(); } };
ACT.tutPrev = () => { T.step = Math.max(0, T.step - 1); render(); };
ACT.tutSkip = () => finishTutorial();
ACT.tutHide = () => { T.hide = !T.hide; reRender(); };
function finishTutorial() { if (T.hide) { S.tutorialHide = true; save(); } goMeasure(1); }
function showTutorial() { T = { step: 0, hide: false }; stack = [{ v: 'home', p: {} }, { v: 'tutorial', p: {} }]; render(); $('#view').scrollTop = 0; }
function goMeasure(step = 1) { if (!M) M = newM(); M.step = step; loadBD(); stack = [{ v: 'home', p: {} }, { v: 'measure', p: {} }]; render(); $('#view').scrollTop = 0; }
ACT.startMeasure = () => { if (S.tutorialHide) goMeasure(1); else showTutorial(); };
ACT.tutAgain = () => showTutorial();

/* ---------- 홈 ---------- */
let HSZ = 'M';
function brandsRanked() { return BR.map(x => ({ x, st: brandStat(x.id), sim: similarBrandPct(x.id, S.body) })).sort((a, c) => ((c.sim?.pct ?? c.st.pct) - (a.sim?.pct ?? a.st.pct))); }
function brandsBySize(sz) {
  return BR.map(b => { const rs = PR.filter(p => p.b === b.id).flatMap(p => revByProd[p.id] || []).filter(r => r.sz === sz); return { b, n: rs.length, pct: rs.length ? Math.round(rs.filter(r => r.op === '정사이즈').length / rs.length * 100) : 0 }; }).filter(x => x.n >= 3).sort((a, c) => c.pct - a.pct).slice(0, 3);
}
const popularProducts = () => [...PR].sort((a, b) => (revByProd[b.id]?.length || 0) - (revByProd[a.id]?.length || 0) || a.id.localeCompare(b.id)).slice(0, 8);
const brandRowHTML = ({ x, st, sim }, note) => { const tn = brandTend(x.id); return `<button class="brand-row" data-a="openBrand" data-v="${x.id}"><span class="logo">${esc(x.n.slice(0, 2))}</span><span class="grow"><b>${esc(x.n)}</b><span class="sm mute" style="display:block">${note || (sim ? `비슷한 체형 후기 ${sim.n}건` : `전체 후기 ${st.rv}건`)}</span></span><span class="col" style="align-items:flex-end;gap:4px"><span class="pill ok">체형 일치 ${sim ? sim.pct : st.pct}%</span><span class="pill ${tn.cls}">${tn.label}</span></span></button>`; };
V.home = () => {
  const b = S.body, rec = S.records[0], ranked = brandsRanked();
  return `<div class="row between" style="padding:14px 16px 0"><div class="row"><div class="logo" style="width:32px;height:32px;border-radius:9px;font-size:12px">FS</div><b style="font-size:17px;letter-spacing:-.02em">핏센스</b></div>${b ? `<button class="link" data-a="goMyfit" style="text-decoration:none">${b.h}cm · ${b.w}kg ›</button>` : ''}</div>
  <div class="hero">${b ? `<span class="pill gray" style="background:rgba(255,255,255,.16);color:inherit">${esc(nick())}님의 사이즈 비서</span>` : ''}<h1 style="margin-top:8px">${b ? `${esc(nick())}님,<br>이 옷, 나한테 맞을까?` : '입어보지 않아도,<br>내 옷과 딱 맞는 사이즈'}</h1><p>사이즈표 사진 한 장이면 모든 사이즈의 핏을 알려드려요.</p><button class="btn full" data-a="startMeasure">사이즈 측정하기 →</button></div>
  ${rec ? `<div class="sec" style="padding-top:4px"><div class="sec-h"><h3>최근 분석</h3><button class="link" data-a="goTab" data-v="records">전체 ›</button></div><button class="card li" data-a="openRecord" data-v="${rec.id}" style="width:100%"><span class="ph" style="width:48px;height:48px;flex:none"><span>${esc(rec.cat)}</span></span><span class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(rec.productName || rec.brandName)}</b><span class="sm mute">${esc(rec.brandName)} · ${rec.date}</span></span><span class="pill dark">추천 ${rec.rec}</span></button></div>` : ''}
  ${b ? `<div class="sec"><div class="sec-h"><h3>${esc(nick())}님 체형에 맞는 브랜드</h3><button class="link" data-a="goTab" data-v="brand">더보기 ›</button></div><p class="sub" style="margin-bottom:4px">키 ${b.h}cm·${b.w}kg과 비슷한 사람들의 정사이즈 후기 비율로 골랐어요.</p></div><div class="list" style="margin:0 4px">${ranked.slice(0, 3).map(r => brandRowHTML(r)).join('')}</div>`
      : `<div class="sec"><div class="card fill pad" style="padding:16px"><b>내 체형에 맞는 브랜드</b><p class="sm mute" style="margin:4px 0 12px">신체 사이즈를 입력하면 나와 비슷한 체형의 후기를 바탕으로 브랜드를 골라드려요.</p><button class="btn pri s" data-a="startMeasure">신체 사이즈 입력하기</button></div></div>`}
  <div class="sec"><div class="sec-h"><h3>사이즈별 추천 브랜드</h3></div><div class="chips">${chipsHTML(SZ, HSZ, 'hSize')}</div></div>
  <div class="list" style="margin:4px 4px 0">${brandsBySize(HSZ).map(r => `<button class="brand-row" data-a="openBrand" data-v="${r.b.id}"><span class="logo">${esc(r.b.n.slice(0, 2))}</span><span class="grow"><b>${esc(r.b.n)}</b><span class="sm mute" style="display:block">${HSZ} 구매 후기 ${r.n}건</span></span><span class="pill ok">정사이즈 ${r.pct}%</span></button>`).join('') || '<div class="empty" style="padding:16px">후기가 부족해요</div>'}</div>
  <div class="sec"><div class="sec-h"><h3>지금 잘나가는 브랜드</h3></div></div><div class="hscroll">${[...BR].sort((a, c) => brandStat(c.id).rv - brandStat(a.id).rv).slice(0, 6).map((x, i) => `<button class="mini" data-a="openBrand" data-v="${x.id}" style="width:96px;text-align:center"><div class="logo" style="width:64px;height:64px;margin:0 auto;font-size:17px;border-radius:20px">${esc(x.n.slice(0, 2))}</div><div class="sm b ellip mt8">${i + 1}. ${esc(x.n)}</div><div class="xs mute">후기 ${brandStat(x.id).rv}</div></button>`).join('')}</div>
  <div class="sec"><div class="sec-h"><h3>인기 상품</h3></div></div><div class="hscroll">${popularProducts().map(p => { const pi = priceInfo(p), r = quickRec(p); return `<button class="mini" data-a="openProduct" data-v="${p.id}"><div class="ph"><span>${esc(p.c)}</span></div><div class="xs mute mt8">${esc(brandById[p.b].n)}</div><div class="sm ellip">${esc(p.n)}</div><div class="xs num b">${pi ? won(pi.low) : '가격 미확인'}${r ? ` · <span class="mute">추천 ${r}</span>` : ''}</div></button>`; }).join('')}</div>
  <div style="height:24px"></div>`;
};
ACT.hSize = t => { HSZ = t.dataset.v; reRender(); };
ACT.goMyfit = () => { loadBD(); go('myfit'); };
ACT.goBodyForm = () => ACT.goMyfit();
ACT.goTab = t => tab(t.dataset.v);

/* ---------- 사이즈 측정 ---------- */
let M = null;
const newM = (step = 1) => ({ step, cat: '상의', brandId: null, brandText: '', productId: null, name: '', link: '', photo: null, size: 'M', rows: {}, touched: false, open: false });
const mRows = () => PARTS[M.cat].filter(p => M.rows[p] !== undefined && M.rows[p] !== '').length;
function mReady() { return !!(M.brandId || M.brandText.trim()) && !!(M.photo || M.productId || mRows() >= 2); }
const stepper = s => `<div class="stepper"><button class="${s === 1 ? 'on' : 'done'}" data-a="mStep" data-v="1">1 사이즈 입력</button><button class="${s === 2 ? 'on' : ''}" data-a="mStep" data-v="2">2 옷 입력</button><div>3 결과</div></div>`;
V.measure = () => {
  if (!M) M = newM();
  if (M.step === 1) {
    return `${topbar('사이즈 측정')}${stepper(1)}<div class="pad"><h1 class="big">내 바디 프로필</h1>
    <p class="sub">${S.body ? `저장된 프로필을 불러왔어요 · 마지막 수정 ${S.body.updated || '–'}` : '처음 한 번만 입력하면 다음부터 자동으로 불러와요.'}</p><div class="mt16">${bodyFormHTML()}</div>${photoCardHTML()}</div>
    <div class="dock"><button class="btn pri full" data-a="mNext">다음 · 옷 입력</button></div>`;
  }
  const prods = M.brandId ? PR.filter(p => p.b === M.brandId && p.c === M.cat) : [], parts = PARTS[M.cat], prod = M.productId ? prodById[M.productId] : null;
  return `${topbar('사이즈 측정', { act: 'mBack' })}${stepper(2)}
  <div class="pad" style="padding-bottom:8px">
  <div class="card fill row between" style="padding:11px 14px"><span class="sm"><b>내 신체</b> ${S.body ? `${S.body.h}cm · ${S.body.w}kg · ${esc(S.body.pref)}` : '미입력'}${S.bodyPhoto ? ' · 사진 있음' : ''}</span><button class="link" data-a="mStep" data-v="1">수정</button></div>
  <div class="field mt16"><label class="f">옷 타입</label><div class="chips">${chipsHTML(CATS, M.cat, 'mCat')}</div></div>
  <div class="field" style="position:relative"><label class="f" for="ta">브랜드</label>
    <div class="search"><input id="ta" class="inp" autocomplete="off" placeholder="브랜드 검색 (초성 가능 · 예: ㅇㄴㅋㄹ)" data-i="ta" value="${esc(M.brandText)}" onfocus="taShow()">${ico('search')}</div>
    <div id="ta-list" hidden></div>
    ${M.brandId ? `<div class="row mt8"><span class="pill ok">✓ ${esc(brandById[M.brandId].n)} 선택됨</span></div>` : M.brandText.trim() ? `<div class="hint">목록에 없는 브랜드는 입력한 이름 그대로 사용해요.</div>` : ''}</div>
  ${prods.length ? `<div class="field"><label class="f" for="msel">우리 DB 상품 불러오기 <span class="mute b sm">(선택)</span></label><select id="msel" class="inp" data-c="mProd"><option value="">다른 사이트의 상품이에요 (직접 올릴게요)</option>${prods.map(p => `<option value="${p.id}" ${M.productId === p.id ? 'selected' : ''}>${esc(p.n)}</option>`).join('')}</select>
    ${prod?.ch ? `<div class="card fill row mt8" style="padding:10px 12px;gap:10px"><span class="ph" style="width:40px;height:48px;flex:none"><span>${esc(prod.c)}</span></span><span class="grow sm"><b>${esc(prod.n)}</b><br><span class="mute">${won(prod.pr)} · 사이즈표를 불러왔어요. 사진은 생략할 수 있어요</span></span></div>` : ''}</div>` : ''}
  <div class="field"><div class="row between" style="margin-bottom:5px"><label class="f" style="margin:0">사이즈표 사진 <button class="info" data-a="photoInfo" aria-label="어떤 사진을 올리면 되나요?">i</button></label>${M.productId ? '<span class="pill gray">DB 상품 · 생략 가능</span>' : '<span class="pill tight">필수</span>'}</div>
    <label class="upload" for="mphoto" style="cursor:pointer">${M.photo ? `<img src="${M.photo}" alt="첨부한 사이즈표">` : `<span>${ico('plus', 'ico')}<br><b>사이즈표 사진 올리기</b><br><span class="xs mute">상품 상세 페이지의 사이즈 표를 캡처해 주세요</span></span>`}</label>
    <input id="mphoto" type="file" accept="image/*" hidden data-c="mPhoto">${M.photo ? `<button class="link mt8" data-a="mPhotoDel">사진 지우기</button>` : ''}</div>
  <div class="field"><label class="f" for="mlink">상품 페이지 링크 <span class="mute b sm">(선택)</span></label><input id="mlink" class="inp" inputmode="url" data-i="mM" data-k="link" value="${esc(M.link)}" placeholder="https://…  붙여넣기"><div class="hint">링크를 남기면 분석 기록에서 상품 페이지로 돌아갈 수 있어요.</div></div>
  <div class="acc field"><button data-a="mOpen" aria-expanded="${M.open}"><span>상세 실측 직접 입력 <span class="mute sm b">분석이 실패할 때</span></span><span>${M.open ? '−' : '+'}</span></button>
    ${M.open ? `<div class="in"><label class="f">입력할 사이즈</label><div class="chips mb8" style="margin-bottom:12px">${chipsHTML(SZ, M.size, 'mSize')}</div><div class="grid2">${parts.map(p => `<div><label class="f" for="r-${p}">${p}${['가슴', '허리', '힙', '허벅지'].includes(p) ? ' (둘레)' : ''}</label><div class="unit"><input id="r-${p}" class="inp num" inputmode="decimal" data-i="mRow" data-k="${p}" value="${esc(M.rows[p] ?? '')}" placeholder="cm"><i>cm</i></div></div>`).join('')}</div><p class="hint">상품 상세의 "총 길이/어깨/가슴단면" 등은 단면(폭)일 수 있어요. 둘레는 단면 × 2예요.</p></div>` : ''}</div>
  <button class="link" data-a="mDemo">예시 값으로 채우기 (프로토타입)</button></div>
  <div class="dock"><button id="mgo" class="btn pri full" data-a="mGo" ${mReady() ? '' : 'disabled'}>사이즈 분석하기</button><p class="hint" style="text-align:center">${mReady() ? '' : '브랜드를 고르고, 사이즈표 사진을 올리거나 DB 상품을 선택해 주세요.'}</p></div>`;
};
ACT.mStep = t => { const s = +t.dataset.v; if (s === 2 && M.step === 1 && !commitBody()) return; M.step = s; if (s === 1) loadBD(); reRender(); $('#view').scrollTop = 0; };
ACT.mNext = () => { if (!commitBody()) return; M.step = 2; render(); $('#view').scrollTop = 0; };
ACT.mBack = () => { if (M.step === 2) { M.step = 1; loadBD(); render(); $('#view').scrollTop = 0; } else back(); };
ACT.sheetClose = () => closeSheet();
const mUpdate = () => { const g = $('#mgo'); if (g) { g.disabled = !mReady(); const h = g.nextElementSibling; if (h) h.textContent = mReady() ? '' : '브랜드를 고르고, 사이즈표 사진을 올리거나 DB 상품을 선택해 주세요.'; } };
ACT.mCat = t => { M.cat = t.dataset.v; M.productId = null; M.rows = {}; M.touched = false; reRender(); };
ACT.mOpen = () => { M.open = !M.open; reRender(); };
ACT.mSize = t => { M.size = t.dataset.v; if (M.productId && !M.touched) fillFromProduct(); reRender(); };
ACT.mPhotoDel = () => { M.photo = null; reRender(); };
ACT.photoInfo = () => sheet(`<h3>어떤 사진을 올리면 되나요?</h3><div class="list" style="margin:8px -16px 0">
  <div class="li" style="align-items:flex-start"><span class="pill dark">필수</span><div><b>사이즈표 사진</b><p class="sm mute" style="margin:2px 0 0">상품 상세 하단의 "사이즈 정보" 표를 캡처해요. 모든 사이즈의 실측이 보이게 찍어주세요.</p></div></div>
  <div class="li" style="align-items:flex-start"><span class="pill gray">예외</span><div><b>DB 상품은 사진이 없어도 돼요</b><p class="sm mute" style="margin:2px 0 0">브랜드를 고른 뒤 "우리 DB 상품 불러오기"에서 고르면 사이즈표를 자동으로 가져와요.</p></div></div>
  <div class="li" style="align-items:flex-start"><span class="pill gray">대안</span><div><b>읽기 실패 시 직접 입력</b><p class="sm mute" style="margin:2px 0 0">"상세 실측 직접 입력"에 숫자를 넣으면 사진 없이도 분석해요.</p></div></div></div>
  <button class="btn pri full mt16" data-a="sheetClose">확인</button>`);
INP.mM = t => { M[t.dataset.k] = t.value; };
INP.mRow = t => { M.rows[t.dataset.k] = t.value; M.touched = true; mUpdate(); };
CHG.mPhoto = t => { const f = t.files[0]; if (f) readPhoto(f, 900, d => { M.photo = d; reRender(); }); };
function fillFromProduct() { const p = prodById[M.productId]; M.rows = {}; if (p?.ch?.[M.size]) PARTS[M.cat].forEach(k => { if (p.ch[M.size][k] != null) M.rows[k] = p.ch[M.size][k]; }); }
CHG.mProd = t => { M.productId = t.value || null; M.touched = false; M.rows = {}; if (M.productId) { M.name = prodById[M.productId].n; fillFromProduct(); M.open = true; } reRender(); };
function setDemoM(step = 2) { M = newM(step); M.cat = '상의'; M.brandId = 1; M.brandText = '유니클로'; M.productId = PR.find(p => p.b === 1 && p.c === '상의').id; M.size = 'M'; fillFromProduct(); M.open = true; }
ACT.mDemo = () => { setDemoM(2); reRender(); };
// 브랜드 자동완성(검색하면 아래 목록이 필터링됨)
function taList() {
  const q = M.brandText, cnt = id => PR.filter(p => p.b === id && p.c === M.cat).length;
  const hits = BR.map(b => ({ b, m: findIn(b.n, q) || findIn(b.en, q) })).filter(x => !q.trim() || x.m);
  let h = hits.slice(0, 6).map(({ b }) => `<button data-a="taPick" data-v="${b.id}"><span class="logo" style="width:34px;height:34px;font-size:12px;border-radius:9px">${esc(b.n.slice(0, 2))}</span><span class="grow"><b>${hl(b.n, q)}</b> <span class="xs mute">${esc(b.en)}</span></span><span class="xs mute">${M.cat} ${cnt(b.id)}개</span></button>`).join('');
  if (q.trim() && !BR.some(b => b.n === q.trim())) h += `<button data-a="taFree"><span class="logo" style="width:34px;height:34px;font-size:16px;border-radius:9px">+</span><span class="grow"><b>"${esc(q.trim())}"</b> 직접 입력</span></button>`;
  return h || '<div class="empty" style="padding:16px">검색 결과가 없어요</div>';
}
window.taShow = () => { const l = $('#ta-list'); if (!l) return; l.className = 'ta-list'; l.hidden = false; l.innerHTML = taList(); };
INP.ta = t => { M.brandText = t.value; M.brandId = null; M.productId = null; taShow(); mUpdate(); };
ACT.taPick = t => { const b = brandById[t.dataset.v]; M.brandId = b.id; M.brandText = b.n; M.productId = null; M.rows = {}; reRender(); };
ACT.taFree = () => { M.brandId = null; const l = $('#ta-list'); if (l) l.hidden = true; reRender(); };
document.addEventListener('click', e => { const l = $('#ta-list'); if (l && !l.hidden && !e.target.closest('#ta-list') && e.target.id !== 'ta') l.hidden = true; });
ACT.mGo = () => { if (mReady()) runAnalysis(); };
function runAnalysis() { CUR = buildAnalysis(M); RT = 'viz'; RE = false; go('analyzing', { next: { v: 'result', p: {} } }); }

/* ---------- 분석 중(처음 분석과 다시 분석에서 공용) ---------- */
const AN_STEPS = ['사이즈표를 찾는 중', '부위별 실측을 읽는 중', '내 신체와 비교하는 중', '사이즈별 의견을 만드는 중'];
V.analyzing = p => `<div class="anl"><div class="scan"><svg viewBox="0 0 300 440"><g fill="none" stroke="currentColor" stroke-width="6"><circle cx="150" cy="36" r="19"/><path d="M108 80 C106 108 120 128 124 158 C118 180 106 196 104 218 L196 218 C194 196 182 180 176 158 C180 128 194 108 192 80 Z M104 218 L121 424 M196 218 L179 424"/></g></svg></div>
  <h2 style="margin:22px 0 4px;font-size:18px">${p.again ? '수정한 값으로 다시 분석 중이에요' : '분석 중이에요'}</h2><p class="sub">잠시만 기다려 주세요</p><div style="margin-top:18px;text-align:left">${AN_STEPS.map((s, i) => `<div class="chk" id="an${i}"><i></i>${s}</div>`).join('')}</div></div>`;
let anTimers = [];
V['analyzing$after'] = p => {
  anTimers.forEach(clearTimeout); anTimers = [];
  AN_STEPS.forEach((_, i) => anTimers.push(setTimeout(() => { const e = $('#an' + i); if (e) { e.classList.add('on'); e.firstChild.textContent = '✓'; } }, 450 + i * 600)));
  anTimers.push(setTimeout(() => { if (stack.at(-1).v === 'analyzing') { const nx = p.next || { v: 'result', p: {} }; replaceTop(nx.v, nx.p); } }, 450 + AN_STEPS.length * 600 + 300));
};

/* ---------- 분석 결과 ---------- */
let CUR = null, RT = 'viz', RE = false;
const SRC = { manual: '직접 입력·수정한 실측', product: '우리 DB 사이즈표', sample: 'AI 샘플 분석 (프로토타입 고정값)' };
function summarize(ev, sel, rec) {
  const bad = ev.rows.filter(r => r.v !== 'ok' && r.v !== 'na');
  const head = sel === rec ? `${sel} 사이즈가 가장 잘 맞아요. ` : `${sel} 사이즈는 추천(${rec})과 달라요. `;
  if (!bad.length) return head + '비교한 모든 부위가 적당해요.';
  return head + bad.map(r => `${r.part}은 ${VLABEL[r.v]}`).join(', ') + '이에요.';
}
const persText = A => { const e = Object.entries(A.pers?.shift || {}); return e.length ? e.map(([k, v]) => `${k} ${v > 0 ? '더 여유롭게' : '더 몸에 맞게'}`).join(' · ') : ''; };
V.result = p => {
  const A = p.rid ? S.records.find(r => r.id === p.rid) : CUR; if (!A) return '<div class="empty">분석 결과가 없어요</div>';
  const { bv, ev, rec } = analysisView(A), fromRec = !!p.rid, sel = A.sel, sh = A.pers?.shift || {};
  const gauge = r => { if (r.len || r.ease == null) return ''; const lo = r.target - r.tol, hiV = r.target + r.tol, min = Math.min(lo - 6, r.ease - 2), max = Math.max(hiV + 6, r.ease + 2), pc = x => (x - min) / (max - min) * 100; return `<div class="gauge"><div class="ok" style="left:${pc(lo)}%;width:${pc(hiV) - pc(lo)}%"></div><div class="dot" style="left:${pc(r.ease)}%;background:var(--${r.v === 'ok' ? 'ok' : r.v === 'tight' ? 'tight' : 'loose'})"></div></div>`; };
  const per = SZ.filter(s => A.chart[s]).map(s => { const e = evalSize(A.cat, A.chart[s], bv, A.pref, sh), v = sizeVerdict(A.cat, e), bad = e.rows.filter(r => r.v !== 'ok' && r.v !== 'na'); return { s, v, txt: bad.length ? bad.map(r => `${r.part} ${VLABEL[r.v]}`).join(' · ') : '모든 부위 적당' }; });
  return `${topbar(fromRec ? '분석 기록' : '분석 결과', { left: 'close' })}
  <div class="rec"><div class="sm mute">${esc(A.brandName)}${A.productName ? ' · ' + esc(A.productName) : ''} · ${esc(A.cat)}</div><div class="sm mute mt8">가장 추천하는 사이즈</div><div class="sz">${rec.best}</div>
    <p class="sm ink2" style="margin:2px 0 0">${rec.gap > 1.2 ? '다른 사이즈와 차이가 분명해요' : '인접 사이즈와 차이가 작아요 · 아래 의견을 보고 골라도 좋아요'}</p>
    <div class="row mt8" style="justify-content:center;gap:6px;flex-wrap:wrap"><span class="pill gray">${SRC[A.source]}</span>${A.corrected ? '<span class="pill ok">수정 반영됨</span>' : ''}${A.sample ? '<span class="pill gray">예시 기록</span>' : ''}</div></div>
  <div class="pad" style="padding-top:0">
  ${persText(A) ? `<div class="card fill sm" style="padding:10px 12px;margin-bottom:12px"><b>내 마이핏드백 ${A.pers.n}건 반영 중</b><br><span class="mute">${persText(A)} 기준으로 판정했어요</span></div>` : ''}
  <b>사이즈별 의견</b><div class="card mt8 list" style="overflow:hidden">${per.map(x => `<button class="li ${x.s === sel ? 'selrow' : ''}" data-a="rSize" data-v="${x.s}" style="padding:12px 14px"><span class="sizechip ${x.s === rec.best ? 'isrec' : ''}">${x.s}</span><span class="grow" style="min-width:0"><span class="row" style="gap:6px"><span class="pill ${x.v.c}">${x.v.t}</span>${x.s === rec.best ? '<span class="pill dark">추천</span>' : ''}${A.ex[x.s] ? '<span class="xs mute">추정</span>' : ''}</span><span class="xs mute" style="display:block;margin-top:2px">${x.txt}</span></span><span class="chev">${x.s === sel ? '●' : '›'}</span></button>`).join('')}</div>
  ${Object.keys(A.ex).length ? `<p class="hint">추정 표시는 입력된 사이즈 간격으로 계산한 값이에요.</p>` : ''}
  <div class="card fill pad mt12 sm" style="padding:12px 14px"><b>${sel}</b> · ${summarize(ev, sel, rec.best)}</div>
  <div class="mt16"><div class="row between mb8" style="margin-bottom:6px"><b>선호 핏 기준</b></div>${segHTML(PREFS, A.pref, 'rPref', 'sm')}</div>
  <div class="mt16">${segHTML(['핏 시각화', '부위별 표'], RT === 'viz' ? '핏 시각화' : '부위별 표', 'rTab')}</div>
  ${RT === 'viz' ? `<div class="card mt12" style="padding:12px 8px 10px"><div style="max-width:300px;margin:0 auto">${fitSVG(A.cat, ev.rows, bv.h)}</div>
    <div class="legend mt8"><span><i style="background:var(--tight)"></i>타이트</span><span><i style="background:var(--ok)"></i>적당</span><span><i style="background:var(--loose)"></i>여유</span></div>
    <p class="hint" style="text-align:center;padding:0 12px">숫자는 옷 실측 − 내 몸 치수(cm)예요. 정면 2D 실루엣 기반의 근사 시각화예요.</p></div>
    <div class="card mt12 row" style="padding:12px;gap:12px"><span class="ph" style="width:64px;height:84px;flex:none">${S.bodyPhoto ? `<img src="${S.bodyPhoto}" alt="내 전신 사진">` : '<span>내 사진</span>'}</span><span class="sm"><b>내 사진으로 핏 보기</b> <span class="pill gray">준비 중</span><br><span class="mute">내 전신 사진 위에 ${sel} 사이즈를 입혀보는 가상 피팅 영역이에요. AI 모델 연동 후 제공돼요.</span></span></div>`
    : `<div class="card mt12" style="padding:2px 14px">${ev.rows.map(r => `<div class="vs"><div><b>${r.part}</b>${r.est ? '<div class="xs mute">몸 추정</div>' : ''}</div><div><div class="row between"><span class="sm num ink2">${r.len ? `옷 ${r.garment}` : `몸 ${r.body} → 옷 ${r.garment}`}</span>${pillV(r.v)}</div>${r.len ? `<div class="xs mute">키 기준 ${r.body ?? '—'}cm 대비 ${r.diff != null ? sgn(r.diff) + 'cm' : '판정 안 함'}</div>` : `<div class="xs mute num mb8">여유 ${sgn(r.ease)}cm (적정 ${r1(r.target)}±${r.tol})</div>${gauge(r)}`}</div></div>`).join('')}</div>`}
  <div class="card mt16"><button class="li" data-a="rEdit" style="border-radius:14px"><span class="grow"><b>AI가 읽은 값이 다른가요?</b><span class="sm mute" style="display:block">${sel} 사이즈 실측을 직접 고치고 다시 분석해요</span></span><span class="mute">${RE ? '−' : '+'}</span></button>
    ${RE ? `<div style="padding:0 14px 14px"><div class="grid2">${PARTS[A.cat].filter(k => A.chart[sel][k] != null).map(k => `<div><label class="f" for="re-${k}">${k}</label><div class="unit"><input id="re-${k}" class="inp num" inputmode="decimal" data-i="re" data-k="${k}" value="${esc(A.chart[sel][k] ?? '')}"><i>cm</i></div></div>`).join('')}</div><button class="btn pri full mt12" data-a="rRe">수정한 값으로 다시 분석</button></div>` : ''}</div>
  ${fromRec ? recordFeedbackHTML(A) : ''}
  </div><div style="height:${fromRec ? 20 : 96}px"></div>
  ${fromRec ? '' : `<div class="dock" style="position:sticky;bottom:0"><div class="row"><button class="btn flat" data-a="rAgain" style="width:112px">다시 측정</button><button class="btn pri grow" data-a="rSave">저장하기</button></div></div>`}`;
};
const getA = () => { const p = stack.at(-1).p; return p.rid ? S.records.find(r => r.id === p.rid) : CUR; };
ACT.rSize = t => { getA().sel = t.dataset.v; RE = false; reRender(); };
ACT.rPref = t => { const A = getA(); A.pref = t.dataset.v; A.rec = recommend(A.cat, A.chart, bodyVals(A.body), A.pref, A.pers?.shift || {}).best; if (stack.at(-1).p.rid) save(); reRender(); };
ACT.rTab = t => { RT = t.dataset.v === '핏 시각화' ? 'viz' : 'tbl'; reRender(); };
ACT.rEdit = () => { RE = !RE; reRender(); };
INP.re = t => { const A = getA(); A._draft = A._draft || {}; A._draft[t.dataset.k] = t.value; };
ACT.rRe = () => {
  const A = getA(), d = A._draft || {}, sel = A.sel, orig = stack.at(-1).p; delete A._draft;
  PARTS[A.cat].forEach(k => { if (d[k] === undefined || d[k] === '' || isNaN(+d[k])) return; const delta = +d[k] - (A.chart[sel][k] ?? 0); SZ.forEach(s => { if (A.chart[s]) A.chart[s][k] = r1((A.chart[s][k] ?? 0) + delta); }); });
  A.corrected = true; A.source = A.source === 'sample' ? 'manual' : A.source; A.rec = recommend(A.cat, A.chart, bodyVals(A.body), A.pref, A.pers?.shift || {}).best; RE = false;
  if (orig.rid) save();
  replaceTop('analyzing', { again: true, next: { v: 'result', p: orig } });   // 다시 분석도 분석 중 화면을 거친다
};
/* 다시 측정: 처음이 아니라 방금 입력한 옷 정보가 남은 '옷 입력' 화면으로 */
ACT.rAgain = () => { if (!M) M = newM(); M.step = 2; loadBD(); stack = [{ v: 'home', p: {} }, { v: 'measure', p: {} }]; render(); $('#view').scrollTop = 0; };
ACT.mNew = () => { M = newM(2); loadBD(); stack = [{ v: 'home', p: {} }, { v: 'measure', p: {} }]; render(); $('#view').scrollTop = 0; };
ACT.rSave = () => { const A = CUR; A.saved = true; delete A._draft; S.records.unshift(JSON.parse(JSON.stringify(A))); save(); replaceTop('saved', { rid: A.id }); };

V.saved = p => {
  const A = S.records.find(r => r.id === p.rid) || CUR;
  return `<div class="anl"><div class="check">${ico('check')}</div><h1 class="big" style="margin:0">저장 완료</h1><p class="sub mt8">${esc(A.brandName)} ${esc(A.cat)} · 추천 <b>${A.rec}</b></p>
  <div class="card fill pad mt16 sm" style="text-align:left;width:100%">분석 기록에 저장됐어요. 나중에 실제로 입어본 느낌을 <b>피드백</b>으로 남기면 내 추천에 반영돼요.</div>
  <div style="width:100%;margin-top:22px"><button class="btn pri full" data-a="savedRecords">분석 기록 보러가기</button><div class="row mt8"><button class="btn flat grow" data-a="mNew">다른 옷 측정</button><button class="btn flat grow" data-a="goTab" data-v="home">홈으로</button></div></div></div>`;
};
ACT.savedRecords = () => { RTb = 'analysis'; tab('records'); };

/* ===== 화면 2: 브랜드 · 상품 · 후기 · 마이페이지 · 초기화 ===== */
const heartBtn = (kind, id, cls = 'hb') => `<button class="${cls} ${S.likes[kind].includes(id) ? 'on' : ''}" data-a="like" data-k="${kind}" data-v="${esc(id)}" aria-label="관심 ${S.likes[kind].includes(id) ? '해제' : '추가'}">${ico('heart')}</button>`;
ACT.like = t => {
  const arr = S.likes[t.dataset.k], id = t.dataset.v, i = arr.indexOf(id);
  if (i >= 0) arr.splice(i, 1); else arr.unshift(id);
  save(); toast(i >= 0 ? '좋아요를 취소했어요' : '좋아요에 담았어요'); reRender();
};
ACT.back = () => back();
ACT.openBrand = t => { DF = { id: +t.dataset.v, cat: '전체', q: '', sort: '기본' }; go('brandDetail', { id: +t.dataset.v }); };
ACT.openProduct = t => { openProduct(t.dataset.v); };
function openProduct(id, tabName = 'info') {
  S.recent = [id, ...S.recent.filter(x => x !== id)].slice(0, 12); save();
  LF = { sort: 'helpful', sizes: [], h: null, w: null, op: null, similar: false }; go('product', { id, tab: tabName });
}

/* ---------- 브랜드(카테고리형 + 내 체형 맞춤 추천) ---------- */
let BF = { cat: '전체', q: '', sort: '추천순' };
const CAT_SHORT = { 전체: '전', 상의: '상', 하의: '하', 원피스: '원', 아우터: '아' };
function brandListHTML() {
  const q = BF.q.trim();
  let items = BR.map(b => {
    const prods = PR.filter(p => p.b === b.id && (BF.cat === '전체' || p.c === BF.cat));
    return { b, prods, nameHit: findIn(b.n, q) || findIn(b.en, q), prodHit: q ? prods.filter(p => findIn(p.n, q)).length : 0, st: brandStat(b.id), sim: similarBrandPct(b.id, S.body), tn: brandTend(b.id, BF.cat === '전체' ? null : BF.cat) };
  }).filter(x => x.prods.length && (!q || x.nameHit || x.prodHit));
  const score = x => x.sim?.pct ?? x.st.pct;
  items.sort(BF.sort === '후기 많은 순' ? (a, c) => c.st.rv - a.st.rv : BF.sort === '정사이즈 높은 순' ? (a, c) => c.st.pct - a.st.pct : (a, c) => score(c) - score(a));
  if (!items.length) return `<div class="empty">조건에 맞는 브랜드가 없어요<br><button class="link mt8" data-a="bfReset">필터 초기화</button></div>`;
  return items.map(({ b, prods, prodHit, st, sim, tn }) => `<div class="brand-row" style="padding:12px 8px 12px 16px;border-bottom:1px solid var(--line)"><button class="row grow" style="background:none;border:0;text-align:left;padding:0;gap:12px;min-width:0" data-a="openBrand" data-v="${b.id}"><span class="logo">${esc(b.n.slice(0, 2))}</span><span class="grow" style="min-width:0"><b>${q ? hl(b.n, q) : esc(b.n)}</b> <span class="xs mute">${esc(b.en)}</span>
      <span class="sm mute" style="display:block">${BF.cat === '전체' ? '상품' : BF.cat} ${prods.length} · 후기 ${st.rv}${prodHit ? ` · "${esc(q)}" 상품 ${prodHit}개` : ''}</span>
      <span class="row" style="gap:6px;margin-top:4px;flex-wrap:wrap"><span class="pill ok">${sim ? '체형 일치' : '정사이즈'} ${sim ? sim.pct : st.pct}%</span><span class="pill ${tn.cls}">${tn.label}</span></span></span></button>${heartBtn('brand', String(b.id), 'ib heart')}</div>`).join('');
}
V.brand = () => {
  const b = S.body, pers = b && !BF.q.trim() && BF.cat === '전체', top = brandsRanked().slice(0, 5);
  const hot = BF.cat !== '전체' ? [...PR.filter(p => p.c === BF.cat)].sort((a, c) => (revByProd[c.id]?.length || 0) - (revByProd[a.id]?.length || 0)).slice(0, 6) : [];
  return `${topbar('브랜드')}
  <div class="pad" style="padding-bottom:8px"><div class="search"><input id="bq" class="inp" data-i="bq" value="${esc(BF.q)}" placeholder="브랜드·상품 검색 (초성 가능)" autocomplete="off">${ico('search')}</div>
  <div class="tiles mt12">${['전체', ...CATS].map(c => `<button class="tile ${BF.cat === c ? 'on' : ''}" data-a="bfCat" data-v="${c}"><span class="tile-ic">${CAT_SHORT[c]}</span>${c}</button>`).join('')}</div></div>
  ${pers ? `<div class="sec" style="padding-top:6px"><div class="sec-h"><h3>${esc(nick())}님, 이런 브랜드를 추천해요</h3></div><p class="sub" style="margin-top:-6px">키 ${b.h}cm·${b.w}kg과 비슷한 사람들의 후기를 바탕으로 골랐어요.</p></div><div class="hscroll" style="margin-bottom:8px">${top.map(({ x, st, sim }) => { const tn = brandTend(x.id); return `<button class="card bcard" data-a="openBrand" data-v="${x.id}"><span class="logo">${esc(x.n.slice(0, 2))}</span><b class="mt8 ellip" style="display:block">${esc(x.n)}</b><span class="pill ok mt8">체형 일치 ${sim ? sim.pct : st.pct}%</span><span class="pill ${tn.cls}" style="margin-top:4px">${tn.label}</span></button>`; }).join('')}</div>`
      : !b && !BF.q.trim() ? `<div style="padding:0 16px 8px"><div class="card fill row between" style="padding:12px 14px"><span class="sm"><b>내 체형 맞춤 추천</b><br><span class="mute">신체 사이즈를 입력하면 브랜드를 골라드려요</span></span><button class="btn s pri" data-a="startMeasure">입력하기</button></div></div>` : ''}
  ${hot.length ? `<div class="sec" style="padding-top:6px"><div class="sec-h"><h3>${BF.cat} 인기 상품</h3></div></div><div class="hscroll" style="margin-bottom:8px">${hot.map(p => { const pi = priceInfo(p); return `<button class="mini" data-a="openProduct" data-v="${p.id}"><div class="ph"><span>${esc(p.sc || p.c)}</span></div><div class="xs mute mt8">${esc(brandById[p.b].n)}</div><div class="sm ellip">${esc(p.n)}</div><div class="xs num b">${pi ? won(pi.low) : ''}</div></button>`; }).join('')}</div>` : ''}
  <div class="sec" style="padding-top:6px;padding-bottom:8px"><div class="row between"><h3 style="margin:0;font-size:16px">${BF.cat === '전체' ? '전체 브랜드' : BF.cat + ' 브랜드'}</h3><select class="inp" style="width:auto;height:32px;font-size:12px" data-c="bfSort" aria-label="정렬">${['추천순', '후기 많은 순', '정사이즈 높은 순'].map(x => `<option ${BF.sort === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>
  <div id="blist">${brandListHTML()}</div><div style="height:20px"></div>`;
};
INP.bq = t => { BF.q = t.value; $('#blist').innerHTML = brandListHTML(); };
ACT.bfCat = t => { BF.cat = t.dataset.v; reRender(); };
CHG.bfSort = t => { BF.sort = t.value; reRender(); };
ACT.bfReset = () => { BF = { cat: '전체', q: '', sort: '추천순' }; reRender(); };

/* ---------- 브랜드 상세(공식 사이트 · 사이즈 경향 · 상품) ---------- */
let DF = { id: 1, cat: '전체', q: '', sort: '기본' };
function prodGridHTML() {
  let ps = PR.filter(p => p.b === DF.id && (DF.cat === '전체' || p.c === DF.cat) && (!DF.q.trim() || findIn(p.n, DF.q) || findIn(p.sc, DF.q)));
  if (DF.sort === '낮은 가격') ps.sort((a, b) => (a.pr || 9e9) - (b.pr || 9e9)); else if (DF.sort === '높은 가격') ps.sort((a, b) => (b.pr || 0) - (a.pr || 0)); else if (DF.sort === '후기 많은 순') ps.sort((a, b) => (revByProd[b.id]?.length || 0) - (revByProd[a.id]?.length || 0));
  if (!ps.length) return `<div class="empty">조건에 맞는 상품이 없어요</div>`;
  return `<div class="pgrid">${ps.map(p => { const rs = revByProd[p.id] || [], rec = quickRec(p), pi = priceInfo(p);
    return `<div class="pcard"><button class="pcard" style="width:100%" data-a="openProduct" data-v="${p.id}"><div class="ph"><span>${esc(p.c)}${p.sc ? ' · ' + esc(p.sc) : ''}</span></div><div class="sm b mt8 ellip" style="white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(p.n)}</div><div class="sm num">${won(p.pr)}</div>${pi ? `<div class="xs num" style="color:var(--ok);font-weight:700">최저 ${won(pi.low)}</div>` : ''}<div class="xs mute">후기 ${rs.length}${rec ? ` · 내 추천 <b style="color:var(--ink)">${rec}</b>` : ''}</div></button>${heartBtn('product', p.id)}</div>`; }).join('')}</div>`;
}
V.brandDetail = p => {
  const b = brandById[p.id], st = brandStat(b.id), tn = brandTend(b.id);
  const host = (b.site || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
  return `${topbar(b.n, { right: heartBtn('brand', String(b.id), 'ib heart') })}
  <div class="pad row" style="gap:14px"><span class="logo" style="width:56px;height:56px;font-size:17px">${esc(b.n.slice(0, 2))}</span><div class="grow"><b style="font-size:17px">${esc(b.n)}</b><div class="sm mute">${esc(b.en)}</div><div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><span class="pill gray">상품 ${st.n}</span><span class="pill gray">후기 ${st.rv}</span></div></div></div>
  ${b.site ? `<div style="padding:0 16px"><a class="btn full flat" href="${esc(b.site)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;justify-content:space-between"><span>공식 사이트</span><span class="mute sm">${esc(host)} ↗</span></a></div>` : ''}
  <div class="pad" style="padding-bottom:8px"><div class="card" style="padding:14px"><div class="row between"><b>사이즈 경향</b><span class="pill ${tn.cls}">${tn.label}</span></div>
    <div class="tbar mt8"><i style="width:${tn.sm}%;background:var(--tight)"></i><i style="width:${tn.ok}%;background:var(--ok)"></i><i style="width:${tn.bg}%;background:var(--loose)"></i></div>
    <div class="row between xs mt8" style="margin-top:6px"><span style="color:var(--tight)">작은 편 ${tn.sm}%</span><span style="color:var(--ok)">정사이즈 ${tn.ok}%</span><span style="color:var(--loose)">큰 편 ${tn.bg}%</span></div>
    <div class="chips mt12" style="gap:6px">${CATS.map(c => { const t = brandTend(b.id, c); return `<span class="pill ${t.cls}">${c} ${t.label.replace('나오는 편', '').replace('경향', '')}</span>`; }).join('')}</div>
    <p class="hint">이 브랜드 상품에 달린 사이즈 후기 ${st.rv}건 기준이에요.</p></div></div>
  <div style="padding:0 16px 12px"><div class="search"><input id="pq" class="inp" data-i="pq" value="${esc(DF.q)}" placeholder="이 브랜드 상품 검색" autocomplete="off">${ico('search')}</div>
  <div class="chips scroll mt12">${chipsHTML(['전체', ...CATS], DF.cat, 'dfCat')}</div>
  <div class="row between mt12"><span class="sm mute"></span><select class="inp" style="width:auto;height:34px;font-size:12.5px" data-c="dfSort" aria-label="정렬">${['기본', '낮은 가격', '높은 가격', '후기 많은 순'].map(s => `<option ${DF.sort === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>
  <div id="pgrid">${prodGridHTML()}</div>`;
};
INP.pq = t => { DF.q = t.value; $('#pgrid').innerHTML = prodGridHTML(); };
ACT.dfCat = t => { DF.cat = t.dataset.v; reRender(); };
CHG.dfSort = t => { DF.sort = t.value; reRender(); };

/* ---------- 상품 상세 ---------- */
let LF = { sort: 'helpful', sizes: [], h: null, w: null, op: null, similar: false };
const HR = [['~155', 0, 155], ['155~160', 155, 160], ['160~165', 160, 165], ['165~', 165, 999]], WR = [['~45kg', 0, 45], ['45~50kg', 45, 50], ['50~55kg', 50, 55], ['55kg~', 55, 999]];
const OPCLS = { '작은 편': 'tight', '정사이즈': 'ok', '큰 편': 'loose' }, FDCLS = { '타이트': 'tight', '적당': 'ok', '여유': 'loose', '짧은 편': 'short', '긴 편': 'long' };
const helpN = r => helpfulBase(r) + (S.helpful[r.id] ? 1 : 0), likeN = r => likeBase(r) + (S.likes.review.includes(r.id) ? 1 : 0);
function filterReviews(pid) {
  let rs = (revByProd[pid] || []).slice(); const U = r => DB.U[r.u];
  if (LF.sizes.length) rs = rs.filter(r => LF.sizes.includes(r.sz));
  if (LF.h) { const x = HR.find(a => a[0] === LF.h); rs = rs.filter(r => U(r)[0] >= x[1] && U(r)[0] < x[2]); }
  if (LF.w) { const x = WR.find(a => a[0] === LF.w); rs = rs.filter(r => U(r)[1] >= x[1] && U(r)[1] < x[2]); }
  if (LF.op) rs = rs.filter(r => r.op === LF.op);
  if (LF.similar && S.body) rs = rs.filter(r => Math.abs(U(r)[0] - S.body.h) <= 6 && Math.abs(U(r)[1] - S.body.w) <= 7);
  const s = { helpful: (a, b) => helpN(b) - helpN(a), recent: (a, b) => (b.d || '').localeCompare(a.d || ''), high: (a, b) => b.rt - a.rt, low: (a, b) => a.rt - b.rt }[LF.sort];
  return rs.sort(s);
}
const activeFilters = () => [...LF.sizes.map(s => ['sizes', s, '구매 ' + s]), ...(LF.h ? [['h', LF.h, '키 ' + LF.h]] : []), ...(LF.w ? [['w', LF.w, '몸무게 ' + LF.w]] : []), ...(LF.op ? [['op', LF.op, LF.op]] : []), ...(LF.similar ? [['similar', 1, '내 체형 후기']] : [])];
function reviewCard(r) {
  const u = DB.U[r.u], helped = !!S.helpful[r.id], liked = S.likes.review.includes(r.id);
  return `<div class="rv" role="button" tabindex="0" data-a="openReview" data-v="${r.id}">
  <div class="row between">${stars(r.rt)}<span class="xs mute">${r.d || '날짜 미확인'}${r.real ? '<span class="tag-real">실제 후기</span>' : ''}</span></div>
  <div class="sm mt8" style="margin-top:6px"><b>키 ${u[0]}cm · ${u[1]}kg</b> <span class="mute">· 구매 ${r.sz} → 추천 ${r.fs}</span></div>
  <div class="chips mt8" style="margin-top:6px"><span class="pill ${OPCLS[r.op]}">${r.op}</span>${r.fd ? Object.entries(r.fd).slice(0, 3).map(([k, v]) => `<span class="pill ${FDCLS[v]}">${k} ${v}</span>`).join('') : ''}</div>
  <div class="txt">${esc(r.t)}</div>
  <div class="row" style="gap:8px"><button class="act ${helped ? 'on' : ''}" data-a="helpful" data-v="${r.id}">${ico('thumb')}도움이 됐어요 ${helpN(r)}</button><button class="act heart ${liked ? 'on' : ''}" data-a="like" data-k="review" data-v="${r.id}">${ico('heart')}${likeN(r)}</button></div></div>`;
}
function reviewBlock(pid) {
  const all = revByProd[pid] || [], rs = filterReviews(pid), n = all.length, avg = n ? all.reduce((a, r) => a + r.rt, 0) / n : 0;
  const d = o => n ? Math.round(all.filter(r => r.op === o).length / n * 100) : 0, af = activeFilters();
  return `<div class="pad"><div class="row" style="gap:18px"><div style="text-align:center"><div style="font-size:30px;font-weight:800">${n ? avg.toFixed(1) : '–'}</div>${stars(Math.round(avg))}<div class="xs mute">후기 ${n}건</div></div>
  <div class="grow">${['작은 편', '정사이즈', '큰 편'].map(o => `<div class="row" style="gap:8px;margin:3px 0"><span class="xs" style="width:48px">${o}</span><div class="bar"><i style="width:${d(o)}%"></i></div><span class="xs num mute" style="width:32px;text-align:right">${d(o)}%</span></div>`).join('')}</div></div></div>
  <div style="padding:0 16px 10px;border-bottom:1px solid var(--line)"><div class="chips scroll"><button class="chip ${af.length ? 'on' : ''}" data-a="openFilter">필터${af.length ? ' ' + af.length : ''} ▾</button>${af.map(([k, v, l]) => `<button class="chip x" data-a="rmFilter" data-k="${k}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>
  <div class="chips scroll mt8" style="margin-top:8px">${[['helpful', '도움순'], ['recent', '최신순'], ['high', '별점 높은순'], ['low', '별점 낮은순']].map(([k, l]) => `<button class="chip ${LF.sort === k ? 'on' : ''}" data-a="rvSort" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="xs mute mt8" style="margin-top:8px">${rs.length}건 ${af.length ? `(전체 ${n}건 중)` : ''}</div></div>
  ${rs.length ? rs.map(reviewCard).join('') : `<div class="empty">조건에 맞는 후기가 없어요<br><button class="link mt8" data-a="rvReset">필터 초기화</button></div>`}`;
}
V.product = p => {
  const pr = prodById[p.id], b = brandById[pr.b], rs = revByProd[pr.id] || [], rec = quickRec(pr), tabName = p.tab;
  let body = '';
  if (tabName === 'info') {
    const info = [['브랜드', b.n], ['카테고리', pr.c + (pr.sc ? ' · ' + pr.sc : '')], ['핏', pr.fit ? ({ 슬림: '슬림핏', 레귤러: '레귤러핏', 오버: '오버핏' }[pr.fit]) : '미확인'], ['소매', pr.sl || '미확인'], ['신축성', pr.st || '미확인'], ['컬러', (pr.col || []).join(', ') || '미확인'], ['설계 총장', pr.len ? pr.len + 'cm (M, 키 160 기준)' : '미확인']];
    body = `<div class="pad"><div class="list card">${info.map(([k, v]) => `<div class="li" style="padding:11px 14px"><span class="mute sm" style="width:72px">${k}</span><span class="sm">${esc(v)}</span></div>`).join('')}</div>
    ${rec ? `<div class="card fill pad mt16" style="padding:14px"><div class="sm mute">내 체형(${S.body.h}cm·${S.body.w}kg) 기준</div><div class="row between mt8" style="margin-top:4px"><b style="font-size:20px">추천 ${rec}</b><button class="btn s pri" data-a="measureWith" data-v="${pr.id}">정밀 측정</button></div></div>` : `<div class="card fill pad mt16 sm" style="padding:14px">${pr.ch ? '신체 사이즈를 입력하면 추천 사이즈를 보여드려요.' : '이 상품은 사이즈표가 없어 추천을 계산할 수 없어요.'}</div>`}</div>`;
  } else if (tabName === 'chart') {
    if (!pr.ch) body = `<div class="empty">사이즈표 미확인<br><span class="sm">실제 후기 1건만 있는 상품이라 사이즈표 데이터가 없어요</span></div>`;
    else { const parts = PARTS[pr.c].filter(k => Object.values(pr.ch).some(v => v[k] != null)), bv = bodyVals(S.body);
      body = `<div class="pad"><div class="tbl-wrap"><table class="t"><thead><tr><th>(cm)</th><th>내 몸</th>${pr.sz.map(s => `<th class="${s === rec ? 'hl' : ''}">${s}${s === rec ? ' ★' : ''}</th>`).join('')}</tr></thead><tbody>${parts.map(k => `<tr><td>${k}</td><td class="mute">${k === '총장' ? '–' : bv[k]}${bv.est[k] && k !== '총장' ? '*' : ''}</td>${pr.sz.map(s => `<td class="${s === rec ? 'hl' : ''}">${pr.ch[s][k] ?? '–'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="hint">가슴·허리·힙·허벅지는 둘레, 어깨·소매·총장은 길이예요. * 표시는 키·몸무게로 추정한 내 치수예요. ★는 내 추천 사이즈예요.</p></div>`; }
  } else body = reviewBlock(pr.id);
  return `${topbar(pr.n, { left: 'close', right: heartBtn('product', pr.id, 'ib heart') })}
  <div class="ph" style="height:230px;border-radius:0;border-left:0;border-right:0"><span>상품 이미지</span></div>
  <div class="pad" style="padding-bottom:12px"><div class="sm mute">${esc(b.n)}</div><div class="b" style="font-size:17px;line-height:1.4">${esc(pr.n)}${pr.real ? '<span class="tag-real">실제 상품</span>' : ''}</div><div class="num b" style="font-size:18px;margin-top:2px">${won(pr.pr)}</div>${(() => { const pi = priceInfo(pr); return pi ? `<a class="card row between lowest" href="${esc(pi.url)}" target="_blank" rel="noopener noreferrer"><span class="sm"><span class="pill ok">최저가</span> <b class="num">${won(pi.low)}</b> <span class="mute">· ${esc(pi.shop)}</span></span><span class="sm mute">구매 링크 ↗</span></a>${pi.dummy ? '<div class="xs mute" style="margin-top:4px">최저가·판매처는 더미 값이에요</div>' : ''}` : ''; })()}</div>
  <div class="tabs">${[['info', '상품 정보'], ['chart', '사이즈표'], ['review', `사이즈 후기 ${rs.length}`]].map(([k, l]) => `<button class="${tabName === k ? 'on' : ''}" data-a="pTab" data-v="${k}">${l}</button>`).join('')}</div>
  <div id="ptab">${body}</div><div style="height:20px"></div>`;
};
ACT.pTab = t => { stack.at(-1).p.tab = t.dataset.v; const y = $('#view').scrollTop; render(); $('#view').scrollTop = Math.max(y, 0); };
ACT.measureWith = t => { const pr = prodById[t.dataset.v]; M = newM(S.body ? 2 : 1); M.cat = pr.c; M.brandId = pr.b; M.brandText = brandById[pr.b].n; M.productId = pr.id; M.size = 'M'; fillFromProduct(); M.open = true; loadBD(); stack = [{ v: 'home', p: {} }, { v: 'measure', p: {} }]; render(); $('#view').scrollTop = 0; };
ACT.helpful = t => { const id = t.dataset.v; if (S.helpful[id]) delete S.helpful[id]; else S.helpful[id] = 1; save(); reRender(); };
ACT.rvSort = t => { LF.sort = t.dataset.v; reRender(); };
ACT.rvReset = () => { LF = { sort: LF.sort, sizes: [], h: null, w: null, op: null, similar: false }; reRender(); };
ACT.rmFilter = t => { const k = t.dataset.k, v = t.dataset.v; if (k === 'sizes') LF.sizes = LF.sizes.filter(x => x !== v); else if (k === 'similar') LF.similar = false; else LF[k] = null; reRender(); };
let LFt = null;
ACT.openFilter = () => { LFt = JSON.parse(JSON.stringify(LF)); filterSheet(); };
function filterSheet() {
  const pid = stack.at(-1).p.id, keep = LF; LF = LFt; const n = filterReviews(pid).length; LF = keep;
  const grp = (title, body) => `<div class="field"><label class="f">${title}</label><div class="chips">${body}</div></div>`;
  const ch = (arr, cur, k) => arr.map(x => `<button class="chip ${(Array.isArray(cur) ? cur.includes(x) : cur === x) ? 'on' : ''}" data-a="fT" data-k="${k}" data-v="${esc(x)}">${esc(x)}</button>`).join('');
  sheet(`<h3>후기 필터</h3><div class="mt16">${grp('구매 사이즈', ch(SZ, LFt.sizes, 'sizes'))}${grp('키', ch(HR.map(a => a[0]), LFt.h, 'h'))}${grp('몸무게', ch(WR.map(a => a[0]), LFt.w, 'w'))}${grp('사이즈감', ch(['작은 편', '정사이즈', '큰 편'], LFt.op, 'op'))}
  <div class="row between card fill" style="padding:12px 14px"><div><b class="sm">내 체형과 비슷한 후기만</b><div class="xs mute">${S.body ? `키 ±6cm · 몸무게 ±7kg (${S.body.h}cm·${S.body.w}kg)` : '신체 사이즈를 입력하면 쓸 수 있어요'}</div></div><button class="sw ${LFt.similar ? 'on' : ''}" data-a="fT" data-k="similar" data-v="1" role="switch" aria-checked="${LFt.similar}" aria-label="내 체형 후기만" ${S.body ? '' : 'disabled'}></button></div></div>
  <div class="row mt16"><button class="btn flat" data-a="fReset" style="width:96px">초기화</button><button class="btn pri grow" data-a="fApply">${n}건 보기</button></div>`);
}
ACT.fT = t => { const k = t.dataset.k, v = t.dataset.v; if (k === 'sizes') LFt.sizes = LFt.sizes.includes(v) ? LFt.sizes.filter(x => x !== v) : [...LFt.sizes, v]; else if (k === 'similar') LFt.similar = !LFt.similar; else LFt[k] = LFt[k] === v ? null : v; filterSheet(); };
ACT.fReset = () => { LFt = { sort: LF.sort, sizes: [], h: null, w: null, op: null, similar: false }; filterSheet(); };
ACT.fApply = () => { LF = LFt; closeSheet(); reRender(); };

/* ---------- 후기 상세 ---------- */
V.review = p => {
  const r = RV.find(x => x.id === p.id), pr = prodById[r.p], u = DB.U[r.u], me = S.body, liked = S.likes.review.includes(r.id), helped = !!S.helpful[r.id];
  const dh = me ? u[0] - me.h : null, dw = me ? u[1] - me.w : null;
  return `${topbar('사이즈 후기', { left: 'close' })}
  <div class="pad"><button class="card li" style="width:100%" data-a="openProduct" data-v="${pr.id}"><span class="ph" style="width:44px;height:44px;flex:none"><span>${esc(pr.c)}</span></span><span class="grow"><span class="xs mute">${esc(brandById[pr.b].n)}</span><b class="sm ellip" style="display:block">${esc(pr.n)}</b></span><span class="chev">${ico('chev', 'ico')}</span></button>
  <div class="row mt16" style="gap:12px"><span class="avatar">${r.u.slice(-2)}</span><div class="grow"><b>사용자 ${r.u}</b><div class="sm mute">키 ${u[0]}cm · ${u[1]}kg · 선호 ${u[2] || '미확인'}</div></div>${stars(r.rt)}</div>
  ${me ? `<div class="card fill sm mt12" style="padding:10px 12px">나와 비교하면 키 <b>${sgn(dh)}cm</b>, 몸무게 <b>${sgn(dw)}kg</b> ${Math.abs(dh) <= 6 && Math.abs(dw) <= 7 ? '· <span class="pill ok">비슷한 체형</span>' : ''}</div>` : ''}
  <div class="grid3 mt16" style="gap:8px"><div class="card fill" style="padding:10px;text-align:center"><div class="xs mute">구매 사이즈</div><b style="font-size:18px">${r.sz}</b></div><div class="card fill" style="padding:10px;text-align:center"><div class="xs mute">딱 맞는 사이즈</div><b style="font-size:18px">${r.fs}</b></div><div class="card fill" style="padding:10px;text-align:center"><div class="xs mute">사이즈감</div><span class="pill ${OPCLS[r.op]}" style="margin-top:4px">${r.op}</span></div></div>
  <div class="mt16"><b>부위별 착용감</b>${r.fd ? `<div class="card mt8" style="padding:2px 14px">${Object.entries(r.fd).map(([k, v]) => `<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--line)"><span class="sm">${k}</span><span class="row" style="gap:8px">${r.ez && r.ez[k] != null ? `<span class="xs mute num">${k === '총장' ? '기준 대비 ' : '여유 '}${sgn(r.ez[k])}cm</span>` : ''}<span class="pill ${FDCLS[v]}">${v}</span></span></div>`).join('')}</div>` : `<p class="sm mute">부위별 정보 미확인</p>`}</div>
  <div class="mt16"><b>후기</b><p style="margin:6px 0 0;white-space:pre-wrap">${esc(r.t)}</p><div class="xs mute mt8">${r.d || '작성일 미확인'}${r.real ? ' · <span class="tag-real" style="margin:0">실제 후기</span>' : ' · 더미 데이터'}</div></div></div><div style="height:90px"></div>
  <div class="dock" style="position:sticky;bottom:0"><div class="row"><button class="btn grow ${liked ? 'liked' : ''}" data-a="like" data-k="review" data-v="${r.id}">${ico('heart', 'ico')} 좋아요 ${likeN(r)}</button><button class="btn grow ${helped ? 'pri' : ''}" data-a="helpful" data-v="${r.id}">${helped ? '✓ ' : ''}도움이 됐어요 ${helpN(r)}</button></div></div>`;
};
ACT.openReview = t => go('review', { id: t.dataset.v });

/* ---------- 마이페이지 ---------- */
V.my = () => {
  const b = S.body, pi = persInfo();
  const item = (a, title, sub, badge) => `<button class="li" data-a="${a}"><span class="grow"><b>${title}</b><span class="sm mute" style="display:block">${sub}</span></span>${badge !== undefined ? `<span class="badge">${badge}</span>` : ''}<span class="chev">›</span></button>`;
  return `${topbar('마이')}
  <div class="pad row" style="gap:14px"><span class="avatar" style="width:64px;height:64px;font-size:24px">${esc(S.profile.nick.slice(0, 1))}</span><div class="grow"><b style="font-size:17px">${esc(S.profile.nick)}</b><div class="sm mute">${b ? `${b.h}cm · ${b.w}kg · ${esc(b.pref)}` : '신체 사이즈 미입력'}</div></div><button class="btn s" data-a="goProfile">프로필</button></div>
  <div style="padding:0 16px 14px"><div class="card fill" style="padding:14px"><div class="row between"><b>내 핏 알고리즘</b><span class="pill ${pi.n ? 'ok' : 'gray'}">마이핏드백 ${pi.n}건 반영</span></div><p class="sm mute" style="margin:6px 0 0">${Object.keys(pi.shift).length ? Object.entries(pi.shift).map(([k, v]) => `${k} ${v > 0 ? '+' : '−'}${Math.abs(v)}cm`).join(' · ') + ' 만큼 내 선호 여유를 보정하고 있어요.' : '피드백을 남기면 내 선호에 맞춰 추천이 보정돼요.'}</p><button class="link mt8" data-a="goTab" data-v="records">기록에서 피드백 남기기 ›</button></div></div>
  <div class="list card" style="margin:0 16px">
    ${item('goProfile', '마이프로필', '닉네임과 후기에 표시할 정보')}
    ${item('goMyfit', '마이핏', b ? `신체 치수 · 전신 사진${S.bodyPhoto ? ' 저장됨' : ' 없음'} · 수정 ${b.updated || '–'}` : '신체 치수와 선호 핏을 입력해요')}
    ${item('goRecent', '최근 본 상품', '', S.recent.length)}
    ${item('tutAgain', '사용 방법 다시 보기', '사이즈 측정 튜토리얼')}
  </div><div style="height:24px"></div>`;
};
ACT.goRecent = () => go('recent');
ACT.goProfile = () => go('profile');

V.profile = () => `${topbar('마이프로필')}<div class="pad"><div class="row" style="gap:14px"><span class="avatar" style="width:64px;height:64px;font-size:24px">${esc(PF.nick.slice(0, 1) || '?')}</span><button class="btn s" data-a="toastNA">사진 변경</button></div>
  <div class="field mt16"><label class="f" for="pf-n">닉네임</label><input id="pf-n" class="inp" maxlength="12" data-i="pf" data-k="nick" value="${esc(PF.nick)}"></div>
  <div class="field"><label class="f" for="pf-b">한 줄 소개</label><input id="pf-b" class="inp" maxlength="30" data-i="pf" data-k="bio" value="${esc(PF.bio)}" placeholder="예: 오버핏 좋아하는 160cm"></div>
  <div class="card pad" style="padding:14px"><div class="row between"><div class="grow"><b class="sm">후기에 키·몸무게 공개</b><div class="xs mute">내가 쓴 후기에 체형이 표시돼 다른 사람의 사이즈 선택에 도움이 돼요</div></div><button class="sw ${PF.showBody ? 'on' : ''}" data-a="pfToggle" role="switch" aria-checked="${PF.showBody}" aria-label="체형 공개"></button></div>
  <div class="card fill mt12 sm" style="padding:10px 12px"><span class="xs mute">후기 표시 미리보기</span><br><b>${esc(PF.nick || '닉네임')}</b> ${PF.showBody && S.body ? `· 키 ${S.body.h}cm · ${S.body.w}kg` : '· 체형 비공개'}</div></div></div>
  <div class="dock"><button class="btn pri full" data-a="pfSave">저장</button></div>`;
let PF = {};
V['profile$after'] = () => { };
const origGoProfile = ACT.goProfile; ACT.goProfile = () => { PF = { ...S.profile }; origGoProfile(); };
INP.pf = t => { PF[t.dataset.k] = t.value; const av = document.querySelector('.avatar'); if (t.dataset.k === 'nick' && av) av.textContent = t.value.slice(0, 1) || '?'; };
ACT.pfToggle = () => { PF.showBody = !PF.showBody; reRender(); };
ACT.pfSave = () => { if (!PF.nick.trim()) { toast('닉네임을 입력해 주세요'); return; } S.profile = { ...PF, nick: PF.nick.trim() }; save(); toast('저장했어요'); back(); };
ACT.toastNA = () => toast('프로토타입에서는 사진 변경이 빠져 있어요');

V.myfit = () => {
  const hist = S.bodyHistory;
  return `${topbar('마이핏')}<div class="pad"><h1 class="big">내 신체 치수</h1><p class="sub">몸이 변했다면 수정하세요. 이후 측정부터 바로 반영돼요.${S.body?.updated ? ` <span class="b">마지막 수정 ${S.body.updated}</span>` : ''}</p><div class="mt16">${bodyFormHTML()}${photoCardHTML()}</div>
  ${hist.length ? `<div class="mt16"><b>이전 기록</b><div class="card mt8 list">${hist.map(h => `<div class="li" style="padding:10px 14px"><span class="sm mute" style="width:78px">${h.updated || '–'}</span><span class="sm num">${h.h}cm · ${h.w}kg${h.chest ? ' · 가슴 ' + h.chest : ''}</span></div>`).join('')}</div></div>` : ''}</div>
  <div class="dock"><button class="btn pri full" data-a="myfitSave">저장</button></div>`;
};
const origMyfit = ACT.goMyfit; ACT.goMyfit = () => { loadBD(); origMyfit(); };
ACT.myfitSave = () => { if (commitBody()) { toast('마이핏을 저장했어요'); back(); } };

/* ---------- 분석 기록 + 피드백 ---------- */
let RF = '전체', RTb = 'analysis';
function analysisListHTML() {
  const rs = S.records.filter(r => RF === '전체' || r.cat === RF);
  return `<div class="pad" style="padding-bottom:4px;padding-top:4px"><div class="chips scroll">${chipsHTML(['전체', ...CATS], RF, 'rfCat')}</div></div>
  ${rs.length ? `<div class="list">${rs.map(r => `<button class="li" data-a="openRecord" data-v="${r.id}" style="padding:14px 16px"><span class="ph" style="width:52px;height:52px;flex:none"><span>${esc(r.cat)}</span></span><span class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(r.productName || r.brandName)}</b><span class="sm mute">${esc(r.brandName)} · ${r.date}</span><span class="row" style="gap:6px;margin-top:4px"><span class="pill dark">추천 ${r.rec}</span>${r.fb ? '<span class="pill ok">피드백 있음</span>' : '<span class="pill gray">피드백 없음</span>'}${r.sample ? '<span class="pill gray">예시</span>' : ''}</span></span><span class="chev">›</span></button>`).join('')}</div>` : `<div class="empty">아직 분석 기록이 없어요<br><button class="btn pri mt16" data-a="startMeasure">사이즈 측정하기</button></div>`}`;
}
function closetListHTML() {
  const pi = persInfo();
  return `<div class="pad" style="padding-bottom:4px"><div class="card fill sm" style="padding:12px 14px">측정과 별개로 <b>내가 가진 옷</b>의 착용감을 기록해요. 기록은 모두 <b>내 추천 알고리즘에 반영</b>돼요.<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><span class="pill ${pi.n ? 'ok' : 'gray'}">${pi.n}건 반영 중</span>${Object.entries(pi.shift).map(([k, v]) => `<span class="pill gray">${k} ${v > 0 ? '+' : '−'}${Math.abs(v)}cm</span>`).join('')}</div></div></div>
  ${S.closet.length ? `<div class="list">${S.closet.map(c => `<button class="li" data-a="closetEdit" data-v="${c.id}" style="padding:14px 16px"><span class="ph" style="width:56px;height:68px;flex:none">${c.photo ? `<img src="${c.photo}" alt="착용샷">` : `<span>${esc(c.cat)}</span>`}</span><span class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(c.name || '이름 없는 옷')}</b><span class="sm mute">${esc(c.brand || '브랜드 미입력')} · ${c.date}</span><span class="row" style="gap:6px;margin-top:4px;flex-wrap:wrap"><span class="pill dark">${esc(c.size)}</span><span class="pill gray">${esc(c.overall)}</span>${c.productId ? '<span class="pill ok">상품 연결</span>' : ''}${c.sample ? '<span class="pill gray">예시</span>' : ''}</span></span><span class="chev">›</span></button>`).join('')}</div>` : `<div class="empty">아직 기록한 옷이 없어요<br>아래 버튼으로 첫 옷을 추가해 보세요</div>`}
  <div style="height:70px"></div><button class="btn pri fab" data-a="closetNew">+ 옷 추가</button>`;
}
V.records = () => `${topbar('기록')}<div style="padding:12px 16px 0">${segHTML(['분석 기록', '마이핏드백'], RTb === 'analysis' ? '분석 기록' : '마이핏드백', 'rbTab')}</div>${RTb === 'analysis' ? analysisListHTML() : closetListHTML()}`;
ACT.rbTab = t => { RTb = t.dataset.v === '분석 기록' ? 'analysis' : 'closet'; reRender(); };
ACT.rfCat = t => { RF = t.dataset.v; reRender(); };
ACT.openRecord = t => { RE = false; RT = 'viz'; go('result', { rid: t.dataset.v }); };
function recordFeedbackHTML(A) {
  const f = A.fb;
  return `<div class="card mt16" style="padding:14px"><div class="row between"><b>착용 피드백</b>${f ? '<span class="pill ok">기록됨</span>' : '<span class="pill gray">미작성</span>'}</div>
  ${f ? `<p class="sm" style="margin:8px 0 0">실제 <b>${esc(f.size)}</b> 사이즈 · 전체 <b>${esc(f.overall)}</b>${Object.keys(f.parts).length ? '<br>' + Object.entries(f.parts).map(([k, v]) => k + ' ' + v).join(' · ') : ''}${f.memo ? '<br><span class="mute">' + esc(f.memo) + '</span>' : ''}</p>` : `<p class="sm mute" style="margin:8px 0 0">실제로 입어본 느낌을 남기면 다음 추천이 더 정확해져요.</p>`}
  <button class="btn ${f ? 'flat' : 'pri'} full mt12" data-a="fbOpen" data-v="${A.id}">${f ? '피드백 수정' : '피드백 남기기'}</button></div>
  <button class="link mt16" data-a="recDelAsk" data-v="${A.id}">이 기록 삭제</button>`;
}
ACT.recDelAsk = t => sheet(`<h3>기록을 삭제할까요?</h3><p class="sub">삭제하면 되돌릴 수 없어요.</p><div class="row mt16"><button class="btn flat grow" data-a="sheetClose">취소</button><button class="btn pri grow" data-a="recDel" data-v="${t.dataset.v}">삭제</button></div>`, true);
ACT.recDel = t => { S.records = S.records.filter(r => r.id !== t.dataset.v); save(); closeSheet(); toast('삭제했어요'); back(); };

/* 피드백/옷장 공용 폼 */
const CLOSET_PARTS = { 상의: ['가슴', '어깨', '소매', '총장', '허리'], 아우터: ['가슴', '어깨', '소매', '총장'], 하의: ['허리', '힙', '허벅지', '총장'], 원피스: ['가슴', '어깨', '허리', '총장'] };
const PART_OPT = k => ['소매', '총장'].includes(k) ? ['짧음', '적당', '김'] : ['타이트', '적당', '여유'];
let FB = null;
const newFB = cat => ({ size: 'M', overall: '정핏', parts: {}, memo: '', photo: null, brand: '', name: '', cat: cat || '상의' });
function fitFormHTML(parts) {
  return `<div class="field"><label class="f">착용 사이즈</label><div class="chips scroll" id="fbsz">${chipsHTML(SZ_WIDE, FB.size, 'fbSize')}</div></div>
  <div class="field"><label class="f">전체 핏</label>${segHTML(['작음', '정핏', '여유'], FB.overall, 'fbOverall')}</div>
  <div class="field"><label class="f">부위별 착용감 <span class="mute b sm">(선택)</span></label><div class="card" style="padding:2px 12px">${parts.map(k => `<div class="row between" style="padding:9px 0;border-bottom:1px solid var(--line)"><span class="sm b" style="width:48px">${k}</span><div style="flex:1;max-width:210px">${(() => { const o = PART_OPT(k); return `<div class="seg sm">${o.map(x => `<button class="${FB.parts[k] === x ? 'on' : ''}" data-a="fbPart" data-v="${k}|${x}">${x}</button>`).join('')}</div>`; })()}</div></div>`).join('')}</div></div>
  <div class="field"><label class="f" for="fb-m">착용 메모</label><textarea id="fb-m" class="inp" data-i="fbMemo" placeholder="예: 허리는 맞는데 팔이 길어요. 세탁 후 줄었어요.">${esc(FB.memo)}</textarea></div>`;
}
ACT.fbSize = t => { FB.size = t.dataset.v; const sc = $('#fbsz'), x = sc ? sc.scrollLeft : 0; reRender(); const n = $('#fbsz'); if (n) n.scrollLeft = x; };
ACT.fbOverall = t => { FB.overall = t.dataset.v; reRender(); };
ACT.fbPart = t => { const [k, v] = t.dataset.v.split('|'); FB.parts[k] = FB.parts[k] === v ? undefined : v; if (FB.parts[k] === undefined) delete FB.parts[k]; reRender(); };
INP.fbMemo = t => { FB.memo = t.value; };
ACT.fbOpen = t => { const A = S.records.find(r => r.id === t.dataset.v); FB = A.fb ? JSON.parse(JSON.stringify(A.fb)) : { ...newFB(A.cat), size: A.rec }; go('feedback', { rid: A.id }); };
V.feedback = p => { const A = S.records.find(r => r.id === p.rid); return `${topbar('착용 피드백', { left: 'close' })}<div class="pad"><div class="card fill row" style="padding:12px 14px;gap:10px"><div class="grow"><b class="sm ellip" style="display:block">${esc(A.productName || A.brandName)}</b><span class="xs mute">추천 ${A.rec} · ${A.date}</span></div></div><div class="mt16">${fitFormHTML(CLOSET_PARTS[A.cat])}</div></div><div class="dock"><button class="btn pri full" data-a="fbSave" data-v="${A.id}">저장</button></div>`; };
ACT.fbSave = t => { const A = S.records.find(r => r.id === t.dataset.v); A.fb = { size: FB.size, overall: FB.overall, parts: FB.parts, memo: FB.memo, date: today() }; save(); toast('피드백을 저장했어요'); back(); };

/* ---------- 마이핏 피드백(내 옷장) ---------- */
function closetProdSelect() {
  const b = BR.find(x => x.n === FB.brand.trim()); if (!b) return '';
  const ps = PR.filter(p => p.b === b.id && p.c === FB.cat); if (!ps.length) return '';
  return `<div class="field"><label class="f" for="c-p">우리 DB 상품과 연결 <span class="mute b sm">(선택)</span></label><select id="c-p" class="inp" data-c="cProd"><option value="">연결 안 함</option>${ps.map(p => `<option value="${p.id}" ${FB.productId === p.id ? 'selected' : ''}>${esc(p.n)}</option>`).join('')}</select><div class="hint">연결하면 이 옷의 실측이 알고리즘에 함께 반영돼요.</div></div>`;
}
CHG.cBrand = () => { if (!!closetProdSelect() !== !!$('#c-p')) reRender(); };   // 상품 연결 칸이 생기거나 사라질 때만 다시 그림(클릭 씹힘 방지)
CHG.cProd = t => { FB.productId = t.value || null; if (FB.productId && !FB.name.trim()) FB.name = prodById[FB.productId].n; reRender(); };
ACT.closetNew = () => { FB = newFB(); go('closetAdd', {}); };
ACT.closetEdit = t => { FB = JSON.parse(JSON.stringify(S.closet.find(c => c.id === t.dataset.v))); go('closetAdd', { id: t.dataset.v }); };
V.closetAdd = p => `${topbar(p.id ? '옷 기록 수정' : '옷 기록 추가', { left: 'close' })}<div class="pad">
  <div class="field"><label class="f">착용샷</label><label class="upload" for="cphoto" style="height:150px;cursor:pointer">${FB.photo ? `<img src="${FB.photo}" alt="착용샷">` : `<span>${ico('plus', 'ico')}<br><b>사진 추가</b></span>`}</label><input id="cphoto" type="file" accept="image/*" hidden data-c="cPhoto">${FB.photo ? '<button class="link mt8" data-a="cPhotoDel">사진 지우기</button>' : ''}</div>
  <div class="field"><label class="f">옷 종류</label><div class="chips">${chipsHTML(CATS, FB.cat, 'cCat')}</div></div>
  <div class="grid2 field"><div><label class="f" for="c-b">브랜드</label><input id="c-b" class="inp" list="bl" data-i="cF" data-c="cBrand" data-k="brand" value="${esc(FB.brand)}" placeholder="예: 유니클로"><datalist id="bl">${BR.map(b => `<option value="${esc(b.n)}">`).join('')}</datalist></div><div><label class="f" for="c-n">옷 이름</label><input id="c-n" class="inp" data-i="cF" data-k="name" value="${esc(FB.name)}" placeholder="예: 옥스포드 셔츠"></div></div>
  ${closetProdSelect()}
  ${fitFormHTML(CLOSET_PARTS[FB.cat])}${p.id ? '<button class="link" data-a="cDel" data-v="' + p.id + '">이 기록 삭제</button>' : ''}</div>
  <div class="dock"><button class="btn pri full" data-a="cSave" data-v="${p.id || ''}">저장</button></div>`;
ACT.cCat = t => { FB.cat = t.dataset.v; FB.parts = {}; reRender(); };
INP.cF = t => { FB[t.dataset.k] = t.value; };
CHG.cPhoto = t => { const f = t.files[0]; if (f) readPhoto(f, 360, d => { FB.photo = d; reRender(); }); };
ACT.cPhotoDel = () => { FB.photo = null; reRender(); };
ACT.cSave = t => {
  if (!FB.brand.trim() && !FB.name.trim()) { toast('브랜드나 옷 이름을 입력해 주세요'); return; }
  const id = t.dataset.v; const item = { ...JSON.parse(JSON.stringify(FB)), id: id || 'C' + Date.now(), date: id ? FB.date : today() };
  if (id) S.closet = S.closet.map(c => c.id === id ? item : c); else S.closet.unshift(item);
  save(); toast('저장했어요'); back();
};
ACT.cDel = t => { S.closet = S.closet.filter(c => c.id !== t.dataset.v); save(); toast('삭제했어요'); back(); };

/* ---------- 좋아요 · 최근 본 ---------- */
V.likes = p => {
  const k = p.tab || 'product', L = S.likes;
  const row = (act, id, inner, kind, lid, lead) => `<div class="li" style="padding-right:4px"><button class="row grow" style="background:none;border:0;padding:0;text-align:left;min-width:0;gap:12px" data-a="${act}" data-v="${esc(id)}">${lead}<span class="grow" style="min-width:0">${inner}</span></button>${heartBtn(kind, lid, 'ib heart')}</div>`;
  const lists = {
    product: () => L.product.map(id => prodById[id]).filter(Boolean).map(pr => row('openProduct', pr.id, `<span class="xs mute">${esc(brandById[pr.b].n)}</span><b class="sm" style="display:block">${esc(pr.n)}</b><span class="sm num">${won(pr.pr)}</span>`, 'product', pr.id, `<span class="ph" style="width:52px;height:64px;flex:none"><span>${esc(pr.c)}</span></span>`)).join(''),
    brand: () => L.brand.map(id => brandById[+id]).filter(Boolean).map(b => row('openBrand', b.id, `<b>${esc(b.n)}</b><span class="sm mute" style="display:block">${esc(b.en)}</span>`, 'brand', String(b.id), `<span class="logo">${esc(b.n.slice(0, 2))}</span>`)).join(''),
    review: () => L.review.map(id => RV.find(r => r.id === id)).filter(Boolean).map(r => { const u = DB.U[r.u], pr = prodById[r.p]; return row('openReview', r.id, `<span class="xs mute">${esc(pr.n)}</span><span style="display:block" class="sm"><b>키 ${u[0]} · ${u[1]}kg</b> · ${r.sz}→${r.fs} ${stars(r.rt)}</span><span class="sm mute" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(r.t)}</span>`, 'review', r.id, ''); }).join('')
  };
  const body = lists[k]();
  return `${topbar('찜')}<div class="tabs">${[['product', `상품 ${L.product.length}`], ['brand', `브랜드 ${L.brand.length}`], ['review', `후기 ${L.review.length}`]].map(([a, l]) => `<button class="${k === a ? 'on' : ''}" data-a="lkTab" data-v="${a}">${l}</button>`).join('')}</div>${body ? `<div class="list">${body}</div>` : `<div class="empty">담아둔 ${{ product: '상품', brand: '브랜드', review: '후기' }[k]}이 없어요<br><span class="sm">하트를 눌러 담아보세요</span></div>`}`;
};
ACT.lkTab = t => { stack.at(-1).p.tab = t.dataset.v; reRender(); };
V.recent = () => `${topbar('최근 본 상품', { right: S.recent.length ? '<button class="link" data-a="recentClear" style="padding-right:12px">비우기</button>' : '' })}${S.recent.length ? `<div class="list">${S.recent.map(id => prodById[id]).filter(Boolean).map(pr => `<button class="li" data-a="openProduct" data-v="${pr.id}"><span class="ph" style="width:52px;height:64px;flex:none"><span>${esc(pr.c)}</span></span><span class="grow" style="min-width:0"><span class="xs mute">${esc(brandById[pr.b].n)}</span><b class="sm" style="display:block">${esc(pr.n)}</b><span class="sm num">${won(pr.pr)}</span></span></button>`).join('')}</div>` : `<div class="empty">최근 본 상품이 없어요</div>`}`;
ACT.recentClear = () => { S.recent = []; save(); reRender(); };

/* ---------- 예시 기록(더미) ---------- */
function seedRecords() {
  if (S.seeded || !S.body) return;
  if (!S.records.length) {
    const mk = (cat, bid, date, fb) => { const p = PR.find(x => x.b === bid && x.c === cat && x.ch); const A = buildAnalysis({ cat, brandId: bid, productId: p.id, rows: {}, size: 'M', photo: null, brandText: '' }); A.sample = true; A.date = date; if (fb) A.fb = { size: A.rec, overall: '정핏', parts: { 가슴: '적당', 총장: '적당' }, memo: '예시 피드백 · 기대한 대로 잘 맞아요', date }; return A; };
    S.records = [mk('상의', 1, '2026.10.28', false), mk('하의', 3, '2026.10.21', true)];
  }
  if (!S.closet.length) S.closet = [
    { id: 'C-s1', cat: '상의', brand: '유니클로', name: '옥스포드 셔츠', size: 'M', overall: '작음', parts: { 가슴: '타이트', 어깨: '적당' }, memo: '예시 · 가슴이 꽉 껴요', photo: null, date: '2026.10.12', sample: true },
    { id: 'C-s2', cat: '하의', brand: '스파오', name: '와이드 슬랙스', size: 'L', overall: '정핏', parts: { 허리: '여유', 힙: '적당' }, memo: '예시 · 허리가 살짝 남아요', photo: null, date: '2026.09.30', sample: true }];
  S.seeded = true; save();
}

/* ---------- 프로토타입 패널 · 이벤트 · 시작 ---------- */
function ensureBody() { if (!S.body) S.body = { h: 162, w: 53, pref: '기본 핏', updated: today() }; seedRecords(); }
function ensureLikes() { if (!S.likes.product.length) { S.likes.product = ['UNIQLO_TOP_01', 'ZARA_OUTER_01']; S.likes.brand = ['1', '3']; const r = (revByProd['UNIQLO_TOP_01'] || [])[0]; if (r) S.likes.review = [r.id]; } }
const st = (...a) => { stack = a.map(([v, p]) => ({ v, p: p || {} })); };
const JUMPS = {
  tutorial: () => { ensureBody(); showTutorial(); },
  home: () => { ensureBody(); st(['home']); },
  homeNoBody: () => { S.body = null; st(['home']); },
  measure1: () => { ensureBody(); M = newM(1); loadBD(); st(['home'], ['measure']); },
  measure1empty: () => { S.body = null; S.bodyPhoto = null; M = newM(1); loadBD(); st(['home'], ['measure']); },
  measure2: () => { ensureBody(); M = newM(2); loadBD(); st(['home'], ['measure']); },
  measure2f: () => { ensureBody(); setDemoM(2); loadBD(); st(['home'], ['measure']); },
  analyzing: () => { ensureBody(); setDemoM(); CUR = buildAnalysis(M); st(['home'], ['measure'], ['analyzing', { next: { v: 'result', p: {} } }]); },
  result: () => { ensureBody(); setDemoM(); CUR = buildAnalysis(M); RT = 'viz'; RE = false; st(['home'], ['measure'], ['result']); },
  saved: () => { ensureBody(); setDemoM(); CUR = buildAnalysis(M); st(['home'], ['measure'], ['saved']); },
  brand: () => { ensureBody(); BF = { cat: '전체', q: '', sort: '추천순' }; st(['brand']); },
  brandCat: () => { ensureBody(); BF = { cat: '상의', q: '', sort: '추천순' }; st(['brand']); },
  brandDetail: () => { ensureBody(); DF = { id: 1, cat: '전체', q: '', sort: '기본' }; st(['brand'], ['brandDetail', { id: 1 }]); },
  product: () => { ensureBody(); st(['brand'], ['brandDetail', { id: 1 }], ['product', { id: 'UNIQLO_TOP_01', tab: 'info' }]); },
  chart: () => { ensureBody(); st(['brand'], ['brandDetail', { id: 1 }], ['product', { id: 'UNIQLO_TOP_01', tab: 'chart' }]); },
  reviews: () => { ensureBody(); LF = { sort: 'helpful', sizes: [], h: null, w: null, op: null, similar: false }; st(['brand'], ['brandDetail', { id: 1 }], ['product', { id: 'UNIQLO_TOP_01', tab: 'review' }]); },
  review: () => { ensureBody(); st(['brand'], ['product', { id: 'UNIQLO_TOP_01', tab: 'review' }], ['review', { id: (revByProd['UNIQLO_TOP_01'] || RV)[0].id }]); },
  records: () => { ensureBody(); RF = '전체'; RTb = 'analysis'; st(['records']); },
  record: () => { ensureBody(); RE = false; RT = 'viz'; RTb = 'analysis'; st(['records'], ['result', { rid: S.records[0].id }]); },
  closet: () => { ensureBody(); RTb = 'closet'; st(['records']); },
  closetAdd: () => { ensureBody(); RTb = 'closet'; FB = newFB(); st(['records'], ['closetAdd']); },
  likes: () => { ensureBody(); ensureLikes(); st(['likes', { tab: 'product' }]); },
  my: () => { ensureBody(); st(['my']); },
  myfit: () => { ensureBody(); loadBD(); st(['my'], ['myfit']); }
};
ACT.resetAll = () => { S = freshS(); try { localStorage.removeItem(KEY); } catch (e) { } M = null; CUR = null; BF = { cat: '전체', q: '', sort: '추천순' }; RF = '전체'; RTb = 'analysis'; closeSheet(); st(['home']); render(); $('#view').scrollTop = 0; };

document.addEventListener('click', e => {
  const j = e.target.closest('[data-jump]');
  if (j) { closeSheet(); JUMPS[j.dataset.jump](); render(); $('#view').scrollTop = 0; return; }
  const n = e.target.closest('#nav button'); if (n) { closeSheet(); tab(n.dataset.tab); return; }
  const a = e.target.closest('[data-a]'); if (a && ACT[a.dataset.a]) { e.preventDefault(); ACT[a.dataset.a](a, e); }
});
document.addEventListener('input', e => { const t = e.target.closest('[data-i]'); if (t && INP[t.dataset.i]) INP[t.dataset.i](t); });
document.addEventListener('change', e => { const t = e.target.closest('[data-c]'); if (t && CHG[t.dataset.c]) CHG[t.dataset.c](t); });
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button]')) { e.preventDefault(); e.target.click(); } });

if (S.body) seedRecords();
render();
