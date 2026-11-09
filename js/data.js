/* 핏센스 - 데이터 연결 (7주차)
   ① JSON(data/) → ② fetch → ③ checkData 점검 후 원본 배열 보관 → ④ 렌더링 → ⑤ 화면
   로드 순서: data.js → app.js  (화면 함수 renderHome 등과 BR, C, S 는 app.js 에 있다) */

const DATA_URLS = {
  brands: './data/brands.json', products: './data/products.json',
  users: './data/users.json', reviews: './data/reviews.json'
};
const CAT_NAMES = ['상의', '하의', '원피스', '아우터'];
const SZ5 = ['XS', 'S', 'M', 'L', 'XL'];
const OPINIONS = ['작은 편', '정사이즈', '큰 편'];
const FITLABEL = { '슬림': '슬림핏', '레귤러': '레귤러핏', '오버': '오버핏' };

// 6주차 데이터 명세서 기준: 파일별 ID·필수 필드·허용값·자료형
const SPEC = {
  brands: { id: 'brand_id', required: ['brand_id', 'brand_name'], allowed: {},
    types: { brand_id: 'number', brand_name: 'string', website: 'string' } },
  products: { id: 'product_id', required: ['product_id', 'brand', 'product_name', 'category'],
    allowed: { category: CAT_NAMES, fit_type: ['슬림', '레귤러', '오버'], sleeve_type: ['민소매', '반소매', '긴소매'], stretch: ['없음', '약간', '좋음'] },
    types: { product_id: 'string', brand_id: 'number', brand: 'string', product_name: 'string', category: 'string', price: 'number', design_length_cm: 'number' } },
  users: { id: 'user_id', required: ['user_id', 'height_cm', 'weight_kg'],
    allowed: { fit_preference: ['슬림 핏', '기본 핏', '여유 핏'], data_type: ['real', 'dummy'] },
    types: { user_id: 'string', height_cm: 'number', weight_kg: 'number', chest_cm: 'number', waist_cm: 'number', hip_cm: 'number' } },
  reviews: { id: 'review_id', required: ['review_id', 'product_id', 'user_id', 'brand', 'category', 'purchased_size', 'size_opinion', 'fitted_size'],
    allowed: { category: CAT_NAMES, purchased_size: SZ5, fitted_size: SZ5, size_opinion: OPINIONS, data_type: ['real', 'dummy'] },
    types: { review_id: 'string', product_id: 'string', user_id: 'string', rating: 'number', size_score: 'number', size_matched: 'boolean' } }
};

// 원본 배열: JSON에서 읽은 그대로 보관하고 화면에서는 바꾸지 않는다
let brands = [], products = [], users = [], reviews = [];
let productById = new Map(), userById = new Map(), reviewsOf = new Map();
let dataState = 'loading', dataError = '';          // loading | ready | error
let bd = { name: '', cat: '상의' };                  // 브랜드 상세 화면 상태

/* ---------- 데이터 점검 ---------- */
// 배열 여부·건수·필드·id·빈 값·자료형·허용값·필수 필드·출처 플래그(meta)를 Console 에 출력하고, 필수 필드가 빠진 항목은 제외
function checkData(data, source, spec) {
  console.group('[데이터 점검]', source);
  console.log('배열인가?', Array.isArray(data));
  if (!Array.isArray(data)) { console.groupEnd(); return []; }
  const K = spec.id;
  console.log('데이터 건수:', data.length);
  console.log('첫 번째 객체의 필드:', Object.keys(data[0] || {}));
  console.log('첫 번째 id와 자료형:', data[0]?.[K], typeof data[0]?.[K]);
  const warn = [], ids = new Set(), nulls = {}, srcs = {};
  data.forEach(p => {
    if (ids.has(p[K])) warn.push(`id 중복: ${p[K]}`);
    ids.add(p[K]);
    Object.keys(spec.types).concat(Object.keys(spec.allowed)).forEach(k => {
      const v = p[k], type = spec.types[k];
      if (v === null || v === undefined || v === '') { nulls[k] = (nulls[k] || 0) + 1; return; }
      if (type && typeof v !== type) warn.push(`자료형: ${K} ${p[K]} ${k} = ${JSON.stringify(v)} (${type} 이어야 함)`);
      else if (spec.allowed[k] && !spec.allowed[k].includes(v)) warn.push(`허용값 밖: ${K} ${p[K]} ${k} = "${v}"`);
    });
    const s = p.meta && p.meta.source;
    if (!s) warn.push(`meta.source 누락: ${K} ${p[K]}`);
    srcs[s || '없음'] = (srcs[s || '없음'] || 0) + 1;
  });
  const valid = data.filter(p => {
    const miss = spec.required.filter(k => p[k] === null || p[k] === undefined || p[k] === '');
    if (miss.length) warn.push(`필수 필드 누락: ${K} ${p[K]} ${miss.join('·')} → 화면에서 제외`);
    return !miss.length;
  });
  console.log('항목 출처(meta.source):', srcs);
  console.log('빈 값(null) 수:', nulls);
  if (warn.length) warn.forEach(w => console.warn(w)); else console.log('경고: 없음');
  console.log('화면에 표시할 건수:', valid.length);
  console.groupEnd();
  return valid;
}

/* ---------- 불러오기 ---------- */
function fetchJson(url) {
  return fetch(url).then(res => { if (!res.ok) throw new Error(url + ' → HTTP ' + res.status); return res.json(); });
}
function loadAll() {
  dataState = 'loading'; dataError = ''; renderAfterLoad();
  return Promise.all(Object.values(DATA_URLS).map(fetchJson)).then(([b, p, u, r]) => {
    brands = checkData(b, DATA_URLS.brands, SPEC.brands);
    products = checkData(p, DATA_URLS.products, SPEC.products);
    users = checkData(u, DATA_URLS.users, SPEC.users);
    reviews = checkData(r, DATA_URLS.reviews, SPEC.reviews);
    buildIndex(); dataState = 'ready'; renderAfterLoad();
  }).catch(showLoadError);
}
function showLoadError(err) {
  console.error(err); dataState = 'error'; dataError = err && err.message ? err.message : String(err); renderAfterLoad();
}
function renderAfterLoad() {
  renderHome(); renderBrands(); renderMypageBrands();
  if ($('page-brand-detail').classList.contains('active')) renderBrandDetail();
}
function stateBox() {
  if (dataState === 'loading') return '<div class="wire-card text-center"><p class="sub-info">데이터를 불러오는 중…</p></div>';
  if (dataState === 'error') {
    const hint = location.protocol === 'file:'
      ? 'file:// 로 열면 브라우저가 JSON 읽기를 막아요. GitHub Pages 배포 주소나 로컬 서버(예: python -m http.server)에서 열어 주세요.'
      : 'data/ 폴더의 파일 경로와 JSON 문법을 확인해 주세요.';
    return `<div class="wire-card state-error"><h4>데이터를 불러오지 못했어요</h4><p class="sub-info mt-5">${escapeHtml(dataError)}</p><p class="sub-info mt-5">${hint}</p><button class="btn btn-dark btn-sm mt-10" onclick="loadAll()">다시 시도</button></div>`;
  }
  return '';
}

/* ---------- 집계(파생값: 원본 배열을 바꾸지 않고 계산만 한다) ---------- */
function buildIndex() {
  productById = new Map(products.map(p => [p.product_id, p]));
  userById = new Map(users.map(u => [u.user_id, u]));
  reviewsOf = new Map();
  reviews.forEach(r => { if (!reviewsOf.has(r.product_id)) reviewsOf.set(r.product_id, []); reviewsOf.get(r.product_id).push(r); });
  BR = buildBR();
}
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
function reviewStats(rs) {
  const count = {}; rs.forEach(r => { count[r.size_opinion] = (count[r.size_opinion] || 0) + 1; });
  return { n: rs.length, count, fit: rs.length ? Math.round((count['정사이즈'] || 0) / rs.length * 100) : 0,
    score: mean(rs.map(r => r.size_score)), len: mean(rs.filter(r => r.length_score !== null && r.length_score !== undefined).map(r => r.length_score)),
    rating: rs.length ? (mean(rs.map(r => r.rating))).toFixed(1) : '-' };
}
// BR 한 줄: [이름, 카테고리(쉼표), 정사이즈 후기 %, 후기 수, 치수 보정(+작게/-크게), 경향]  ← app.js 의 기존 형식과 같음
function buildBR() {
  return brands.map(b => {
    const st = reviewStats(reviews.filter(r => r.brand === b.brand_name));
    const cats = CAT_NAMES.filter(c => products.some(p => p.brand === b.brand_name && p.category === c));
    const bias = st.score >= .35 ? -1 : st.score <= -.35 ? 1 : 0;
    const tend = [st.score >= .35 ? '크게 나오는 편' : st.score <= -.35 ? '작게 나오는 편' : '정사이즈에 가까운 편',
      st.len >= .25 ? '기장 긴 편' : st.len <= -.25 ? '기장 짧은 편' : ''].filter(Boolean).join(' · ');
    return [b.brand_name, cats.join(','), st.fit, st.n, bias, tend];
  });
}

/* ---------- 출처 표시(실제·더미·미확인) ---------- */
function fieldType(p, key) {
  const m = p.meta || {};
  if ((m.api || []).includes(key)) return 'api';
  if ((m.real || []).includes(key)) return 'real';
  if ((m.dummy || []).includes(key)) return 'dummy';
  if ((m.unknown || []).includes(key)) return 'unknown';
  return '';
}
const FIELD_TYPE_LABEL = { real: '실제', dummy: '더미', api: 'API', fallback: '대체', unknown: '미확인' };
const typeTag = t => t ? `<span class="type-tag type-${t}">${FIELD_TYPE_LABEL[t]}</span>` : '';
function sourceSummary(p) {
  const m = p.meta || {};
  return `실제 ${(m.real || []).length}개 · 더미 ${(m.dummy || []).length}개 · 미확인 ${(m.unknown || []).length}개 필드`;
}

/* ---------- 브랜드 상세: 브랜드를 누르면 상품 목록 ---------- */
const won = v => (v === null || v === undefined ? '가격 정보 없음' : v.toLocaleString('ko-KR') + '원');
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
const fmtDate = s => (s ? s.replace(/-/g, '.') : '날짜 정보 없음');

function openBrandDetail(i) {
  const b = BR[i]; if (!b) return;
  bd.name = b[0]; const cats = b[1].split(',');
  bd.cat = cats.includes(brandCat) ? brandCat : cats[0];
  navigateTo('brand-detail');
}
function productCard(p) {
  const st = reviewStats(reviewsOf.get(p.product_id) || []);
  const info = [p.sub_category, p.fit_type ? FITLABEL[p.fit_type] : '', p.sleeve_type].filter(Boolean).join(' · ') || '세부 정보 없음';
  return `<div class="wire-card prod-card clickable" onclick="openProduct('${escapeHtml(p.product_id)}')"><div class="brand-item-row"><div class="wire-x-box square-50"></div><div class="brand-copy">
    <h4>${escapeHtml(p.product_name)}</h4><p class="sub-info mt-5">${escapeHtml(info)}</p>
    <p class="prod-price">${won(p.price)}${typeTag(fieldType(p, 'price'))}</p>
    <div class="badge-group"><span class="badge">후기 ${st.n}건</span>${st.n ? `<span class="badge">정사이즈 ${st.fit}%</span><span class="badge">★ ${st.rating}</span>` : ''}</div></div><span class="row-chev">›</span></div></div>`;
}
function renderBrandDetail() {
  const box = $('brand-detail-body'); if (!box) return;
  const sb = stateBox(); if (sb) { box.innerHTML = sb; return; }
  const i = BR.findIndex(b => b[0] === bd.name);
  if (i < 0) { box.innerHTML = '<p class="sub-info">브랜드 정보를 찾을 수 없어요.</p>'; return; }
  const b = BR[i], cats = b[1].split(','); if (!cats.includes(bd.cat)) bd.cat = cats[0];
  const k = CK.find(x => C[x].n === bd.cat), saved = S.brands.includes(b[0]);
  const list = products.filter(p => p.brand === b[0] && p.category === bd.cat);
  box.innerHTML = `<div class="wire-card"><div class="brand-item-row"><div class="brand-mini-icon">${escapeHtml(b[0].slice(0, 1))}</div>
    <div class="brand-copy"><h3>${escapeHtml(b[0])}</h3><p class="sub-info">${escapeHtml(b[5])}</p></div>
    <button class="btn btn-sm ${saved ? 'btn-dark' : 'btn-outline'}" onclick="toggleBrand(${i});renderBrandDetail()">${saved ? '저장됨' : '♡ 저장'}</button></div>
    <div class="brand-size-grid"><div class="brand-size-cell"><span>정사이즈 후기</span><strong>${b[2]}%</strong></div><div class="brand-size-cell"><span>후기</span><strong>${b[3]}건</strong></div>
    <div class="brand-size-cell" style="grid-column:1/-1"><span>내 ${bd.cat} 추천 사이즈</span><strong>${brandSize(b, k)}</strong></div></div>
    <p class="sub-info mt-10">저장한 신체 사이즈·선호 핏과 이 브랜드 후기 경향으로 계산한 참고값이에요.</p></div>
    <p class="data-notice">상품·후기·체형 데이터는 실습용 더미 데이터예요(실제 후기 1건 포함). 브랜드별 사이즈 경향은 검증되지 않은 가정값이에요.</p>
    <div class="pill-group">${cats.map(c => `<button class="pill ${c === bd.cat ? 'active' : ''}" onclick="bd.cat='${c}';renderBrandDetail()">${c} ${products.filter(p => p.brand === b[0] && p.category === c).length}</button>`).join('')}</div>
    ${list.length ? list.map(productCard).join('') : '<p class="sub-info">이 카테고리에 등록된 상품이 없어요.</p>'}`;
}

/* ---------- 상품 상세(모달): 사이즈표 + 후기 ---------- */
function chartTable(p) {
  if (!p.size_chart || !p.sizes) return '<p class="sub-info">사이즈표 정보 없음 (미확인)</p>';
  const keys = Object.keys(p.size_chart[p.sizes[0]]);
  return `<table class="wire-table chart-table"><thead><tr><th>사이즈</th>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead><tbody>${
    p.sizes.map(s => `<tr><td class="bold">${s}</td>${keys.map(k => `<td>${p.size_chart[s][k]}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <p class="sub-info mt-5">단위 cm · 어깨·소매는 길이, 가슴·허리·힙·허벅지는 둘레 기준</p>`;
}
function reviewSummary(rs) {
  const st = reviewStats(rs); if (!st.n) return '<p class="sub-info">아직 후기가 없어요.</p>';
  const bars = OPINIONS.map(o => { const c = st.count[o] || 0; return `<div class="op-row"><span>${o}</span><div class="op-bar"><i style="width:${Math.round(c / st.n * 100)}%"></i></div><span>${c}</span></div>`; }).join('');
  const fitted = SZ5.map(s => [s, rs.filter(r => r.fitted_size === s).length]).filter(x => x[1]).map(x => `${x[0]} ${x[1]}명`).join(' · ');
  return `<div class="wire-card"><p class="sub-text">평균 별점 ${st.rating} · 후기 ${st.n}건</p><div class="mt-5">${bars}</div>
    <p class="sub-info mt-10">후기 작성자가 추천한 사이즈: ${fitted}</p></div>`;
}
function reviewCard(r) {
  const u = userById.get(r.user_id) || {}, real = r.data_type === 'real';
  const det = r.fit_details ? Object.entries(r.fit_details).map(([k, v]) => `<span class="badge ${v === '적당' ? '' : 'active'}">${k} ${v}</span>`).join('') : '';
  return `<div class="record-card review-card"><div class="rec-head"><span>${stars(r.rating)} · ${fmtDate(r.review_date)}</span><span>${typeTag(real ? 'real' : 'dummy')}</span></div>
    <p class="review-body mt-5">키 ${u.height_cm ?? '-'}cm · ${u.weight_kg ?? '-'}kg · 구매 ${r.purchased_size} → 추천 ${r.fitted_size}</p>
    <div class="badge-group"><span class="badge ${r.size_opinion === '정사이즈' ? '' : 'active'}">${r.size_opinion}</span>${det}</div>
    <p class="feedback-memo mt-5">${escapeHtml(r.review_text)}</p>${real ? '<p class="sub-info mt-5">출처: 무신사 실제 후기 · 원문 그대로</p>' : ''}</div>`;
}
function openProduct(id) {
  const p = productById.get(id); if (!p) return;
  const rs = (reviewsOf.get(id) || []).slice().sort((a, b) => (b.review_date || '').localeCompare(a.review_date || ''));
  const rows = [['브랜드', p.brand, 'brand'], ['카테고리', p.category + (p.sub_category ? ' · ' + p.sub_category : ''), 'category'],
    ['핏', p.fit_type ? FITLABEL[p.fit_type] : '정보 없음', 'fit_type'], ['소매', p.sleeve_type || '해당 없음', 'sleeve_type'],
    ['신축성', p.stretch || '정보 없음', 'stretch'], ['가격', won(p.price), 'price']];
  $('product-modal-body').innerHTML = `<div class="wire-card mt-10"><h3>${escapeHtml(p.product_name)}</h3><p class="sub-info mt-5">${sourceSummary(p)}</p>
    <table class="wire-table">${rows.map(r => `<tr><td>${r[0]}</td><td>${escapeHtml(r[1])}${typeTag(fieldType(p, r[2]))}</td></tr>`).join('')}</table></div>
    <h4 class="mt-10">사이즈표</h4><div class="wire-card">${chartTable(p)}</div>
    <h4>사이즈 후기</h4>${reviewSummary(rs)}${rs.map(reviewCard).join('')}`;
  openModal('modal-product');
  const card = document.querySelector('#modal-product .modal-card'); if (card) card.scrollTop = 0;
}
