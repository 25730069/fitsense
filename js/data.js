/* 데이터 로더: data/*.json(원본 스키마) → 앱이 쓰는 짧은 형식(DB)으로 변환
   - 나중에 JSON을 교체·추가해도 필드명(brand_id, product_id …)만 맞으면 그대로 연결돼요.
   - 새로 받을 수 있는 선택 필드: brands.size_tendency, products.lowest_price / lowest_shop / product_url
     (없으면 화면은 더미 값을 계산해서 보여줘요) */
const DATA_FILES = { brands: 'data/brands.json', products: 'data/products.json', users: 'data/users.json', reviews: 'data/reviews.json' };
async function fetchRaw() {
  const out = {};
  for (const [k, u] of Object.entries(DATA_FILES)) { const r = await fetch(u); if (!r.ok) throw new Error(u + ' ' + r.status); out[k] = await r.json(); }
  return out;
}
function mapDB(raw) {
  const B = raw.brands.map(x => ({ id: x.brand_id, n: x.brand_name, en: x.brand_name_en || '', site: x.website || '', tend: x.size_tendency || null }));
  const P = raw.products.map(x => ({
    id: x.product_id, b: x.brand_id, n: String(x.product_name).replace('(가상) ', ''), c: x.category, sc: x.sub_category || '', fit: x.fit_type, sl: x.sleeve_type, st: x.stretch,
    len: x.design_length_cm, pr: x.price, low: x.lowest_price || null, shop: x.lowest_shop || null, url: x.product_url || null, col: x.colors, sz: x.sizes, ch: x.size_chart,
    real: x.data_type === 'real' || /_R\d+$/.test(x.product_id)
  }));
  const U = Object.fromEntries(raw.users.map(x => [x.user_id, [x.height_cm, x.weight_kg, x.fit_preference]]));
  const R = raw.reviews.map(x => ({ id: x.review_id, p: x.product_id, u: x.user_id, rt: x.rating, d: x.review_date, sz: x.purchased_size, op: x.size_opinion, lo: x.length_opinion, fd: x.fit_details, ez: x.ease_cm, fs: x.fitted_size, t: x.review_text, real: x.data_type === 'real' }));
  return { B, P, U, R };
}
