/* 데이터 로더(코드이며 데이터 파일이 아니에요): data/*.json → 앱이 쓰는 짧은 형식(DB)으로 변환
   data/brands.json   브랜드 마스터 (brand_id, name_kr, name_en, site_url, genders, categories, styles, size_tendency, price_tier, meta)
   data/products.json 상품 (product_id, brand_id, name, category, sub_category, gender, fit_type, sleeve_type, stretch, price, colors, sizes, size_chart, release_date, product_url, meta)
   data/reviews.json  후기 (review_id, product_id, reviewer_id, reviewer_nick, reviewer_handle, height_cm, weight_kg, purchased_size, size_opinion, … meta)
   필드 설명과 허용값은 docs/DATA_SPEC.md 참고 */
const DATA_FILES = { brands: 'data/brands.json', products: 'data/products.json', reviews: 'data/reviews.json' };
async function fetchRaw() {
  const out = {};
  for (const [k, u] of Object.entries(DATA_FILES)) { const r = await fetch(u); if (!r.ok) throw new Error(u + ' ' + r.status); out[k] = await r.json(); }
  return out;
}
const STYLES = ['캐주얼', '시티', '시티보이', '클래식', '에스닉', '걸리시', '고프코어', '미니멀', '프레피', '리조트', '레트로', '로맨틱', '스포티', '스트릿', '워크웨어'];
/* 상품 이미지: asset/products/{product_id}.jpg 를 넣은 뒤 IMG_ON 을 true 로 바꾸면 나타나요. 파일이 없는 상품은 "이미지" 자리표시가 그대로 보여요(onerror로 <img> 제거) */
const IMG_ON = false;
const pimg = id => IMG_ON && id ? `<img src="asset/products/${id}.jpg" alt="" loading="lazy" onerror="this.remove()">` : '';
const TEND_LBL = { '작게 나옴': '작게 나오는 편', '정사이즈': '정사이즈 경향', '크게 나옴': '크게 나오는 편' };
const CODE_MAP = { 상의: 'top', 하의: 'bottom', 원피스: 'dress', 아우터: 'outer' };
function mapDB(raw) {
  const prods = (raw.products || []).filter(x => x.category !== '신발'), revs = raw.reviews || [];
  const B = (raw.brands || []).map(x => ({ id: x.brand_id, n: x.name_kr, en: x.name_en || '', site: x.site_url || '', tend: TEND_LBL[x.size_tendency] || null, st: Array.isArray(x.styles) && x.styles.length ? x.styles : [], g: x.genders || [], tier: x.price_tier || null, meta: x.meta || null }));
  const seen = new Set(), TX = [];
  prods.forEach(x => { (x.gender === '공용' ? ['여성', '남성'] : [x.gender]).forEach(g => { const k = [x.brand_id, g, x.category, x.sub_category].join('|'); if (!seen.has(k)) { seen.add(k); TX.push({ b: x.brand_id, g, code: CODE_MAP[x.category], s: x.sub_category }); } }); });
  const P = prods.map(x => ({
    id: x.product_id, b: x.brand_id, n: String(x.name).replace('(가상) ', ''), c: x.category, sc: x.sub_category || '', g: x.gender || null, fit: x.fit_type, sl: x.sleeve_type, st: x.stretch,
    pr: x.price, url: x.product_url || null, col: x.colors || [], sz: x.sizes, ch: x.size_chart || null, rd: x.release_date || null, real: !!(x.meta && x.meta.source !== 'generated'), meta: x.meta || null
  }));
  const U = {}, NK = {}, HD = {}, R = [];
  revs.forEach(x => {
    const uid = x.reviewer_id; U[uid] = [x.height_cm, x.weight_kg, x.fit_preference || '기본 핏']; if (x.reviewer_nick) NK[uid] = x.reviewer_nick; if (x.reviewer_handle) HD[uid] = x.reviewer_handle;
    R.push({ id: x.review_id, p: x.product_id, u: uid, rt: x.rating, d: x.review_date, sz: x.purchased_size, op: x.size_opinion, lo: x.length_opinion, fd: x.fit_details || {}, ez: null, fs: x.fitted_size, t: x.review_text, kw: Array.isArray(x.keywords) ? x.keywords : null, col: x.color || null, real: x.data_type === 'real' });
  });
  return { B, P, U, R, TX, NK, HD };
}
