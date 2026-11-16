/* checkData(): 데이터 형식 검사 (교안 6주차 REQUIRED / ALLOWED / TYPES). 문제가 있어도 화면은 계속 뜨고, 콘솔 경고와 window.DATA_ISSUES 에 남겨요. */
const REQUIRED = {
  brands: ['brand_id', 'name_kr', 'name_en', 'site_url', 'genders', 'categories', 'styles', 'size_tendency', 'price_tier', 'meta'],
  products: ['product_id', 'brand_id', 'name', 'category', 'sub_category', 'gender', 'fit_type', 'stretch', 'price', 'colors', 'sizes', 'release_date', 'meta'],
  reviews: ['review_id', 'product_id', 'reviewer_id', 'review_date', 'rating', 'height_cm', 'weight_kg', 'purchased_size', 'size_opinion', 'length_opinion', 'review_text', 'meta']
};
const ALLOWED = {
  category: ['상의', '하의', '아우터', '원피스'], gender: ['여성', '남성', '공용'], fit_type: ['슬림', '레귤러', '오버'], stretch: ['없음', '약간', '좋음'],
  size_opinion: ['작은 편', '정사이즈', '큰 편'], length_opinion: ['짧은 편', '적당', '긴 편'], size_tendency: ['작게 나옴', '정사이즈', '크게 나옴'], price_tier: ['저가', '중가', '고가', '프리미엄']
};
const IDKEY = { brands: 'brand_id', products: 'product_id', reviews: 'review_id' };
const TYPES = { price: 'number', rating: 'number', height_cm: 'number', weight_kg: 'number', colors: 'array', sizes: 'array', styles: 'array', genders: 'array' };
function checkData(raw) {
  const issues = [], seen = {};
  for (const [file, keys] of Object.entries(REQUIRED)) {
    (raw[file] || []).forEach((x, i) => {
      const id = x[IDKEY[file]] || '#' + i;
      keys.forEach(k => { if (x[k] === undefined || x[k] === null || x[k] === '') issues.push(`${file} ${id}: 필수값 ${k} 없음`); });
      Object.entries(ALLOWED).forEach(([k, vals]) => { if (x[k] != null && !vals.includes(x[k])) issues.push(`${file} ${id}: ${k}="${x[k]}" 허용값 아님`); });
      Object.entries(TYPES).forEach(([k, t]) => { if (x[k] != null && (t === 'array' ? !Array.isArray(x[k]) : typeof x[k] !== t)) issues.push(`${file} ${id}: ${k} 타입 오류`); });
      const k0 = file + ':' + id; if (seen[k0]) issues.push(`${file}: ID 중복 ${id}`); seen[k0] = 1;
    });
  }
  const pids = new Set((raw.products || []).map(p => p.product_id)), bids = new Set((raw.brands || []).map(b => b.brand_id));
  (raw.products || []).forEach(p => { if (!bids.has(p.brand_id)) issues.push(`products ${p.product_id}: 없는 brand_id ${p.brand_id}`); });
  (raw.reviews || []).forEach(r => { if (!pids.has(r.product_id)) issues.push(`reviews ${r.review_id}: 없는 product_id ${r.product_id}`); });
  window.DATA_ISSUES = issues;
  if (issues.length) console.warn(`[checkData] 데이터 문제 ${issues.length}건`, issues.slice(0, 20)); else console.info('[checkData] 데이터 이상 없음');
  return issues;
}
