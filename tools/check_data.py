"""checkData: data/*.json 검증 (REQUIRED / ALLOWED / TYPES / 참조 무결성 / 사이즈표 단조 증가 / 수량 목표)"""
import json, sys, pathlib, collections
D = pathlib.Path(__file__).parent.parent / 'data'
B = json.load(open(D / 'brands.json')); P = json.load(open(D / 'products.json')); R = json.load(open(D / 'reviews.json'))
err = []; e = lambda m: err.append(m)
STY = ['캐주얼', '시티', '시티보이', '클래식', '에스닉', '걸리시', '고프코어', '미니멀', '프레피', '리조트', '레트로', '로맨틱', '스포티', '스트릿', '워크웨어']
ALLOWED = {'category': ['상의', '하의', '아우터', '원피스'], 'gender': ['여성', '남성', '공용'], 'fit_type': ['슬림', '레귤러', '오버'], 'stretch': ['없음', '약간', '좋음'],
           'sleeve_type': ['반소매', '긴소매', '민소매', None], 'size_opinion': ['작은 편', '정사이즈', '큰 편'], 'length_opinion': ['짧은 편', '적당', '긴 편'],
           'size_tendency': ['작게 나옴', '정사이즈', '크게 나옴'], 'price_tier': ['저가', '중가', '고가', '프리미엄']}
PARTS = {'상의': ['어깨', '가슴', '소매', '총장'], '아우터': ['어깨', '가슴', '소매', '총장'], '하의': ['허리', '힙', '허벅지', '총장'], '원피스': ['어깨', '가슴', '허리', '총장']}
SZ = ['XS', 'S', 'M', 'L', 'XL']


def req(rows, name, keys):
    for x in rows:
        for k in keys:
            if k not in x or (x[k] is None and k not in ('product_url', 'size_guide_url', 'size_chart', 'sleeve_type')): e(f'{name} {x.get(name[:-1] + "_id") or x.get("brand_id") or x.get("product_id")}: 필수값 {k} 없음')


def dup(rows, k, name):
    c = collections.Counter(x[k] for x in rows)
    for v, n in c.items():
        if n > 1: e(f'{name} {k} 중복: {v}')


req(B, 'brands', ['brand_id', 'name_kr', 'name_en', 'site_url', 'genders', 'categories', 'styles', 'size_tendency', 'price_tier', 'meta'])
req(P, 'products', ['product_id', 'brand_id', 'name', 'category', 'sub_category', 'gender', 'fit_type', 'stretch', 'price', 'colors', 'sizes', 'release_date', 'meta'])
req(R, 'reviews', ['review_id', 'product_id', 'reviewer_id', 'review_date', 'rating', 'height_cm', 'weight_kg', 'purchased_size', 'size_opinion', 'length_opinion', 'review_text', 'meta'])
dup(B, 'brand_id', 'brands'); dup(P, 'product_id', 'products'); dup(R, 'review_id', 'reviews')
bid = {b['brand_id'] for b in B}; pid = {p['product_id']: p for p in P}
for b in B:
    if not b['site_url'].startswith('http'): e(f'{b["brand_id"]} site_url 형식')
    if not (1 <= len(b['styles']) <= 3) or any(s not in STY for s in b['styles']): e(f'{b["brand_id"]} styles')
    for k in ('size_tendency', 'price_tier'):
        if b[k] not in ALLOWED[k]: e(f'{b["brand_id"]} {k}={b[k]}')
for p in P:
    for k in ('category', 'gender', 'fit_type', 'stretch', 'sleeve_type'):
        if p[k] not in ALLOWED[k]: e(f'{p["product_id"]} {k}={p[k]}')
    if p['brand_id'] not in bid: e(f'{p["product_id"]} 없는 brand_id')
    if not isinstance(p['price'], int) or p['price'] <= 0: e(f'{p["product_id"]} price')
    if len(p['release_date']) != 10: e(f'{p["product_id"]} release_date')
    ch = p['size_chart']
    if ch is None: continue
    if sorted(ch, key=SZ.index) != sorted(p['sizes'], key=SZ.index): e(f'{p["product_id"]} sizes≠size_chart')
    for part in PARTS[p['category']]:
        vals = [ch[s][part] for s in sorted(ch, key=SZ.index)]
        if any(b2 <= a for a, b2 in zip(vals, vals[1:])): e(f'{p["product_id"]} {part} 사이즈표 단조 증가 아님 {vals}')
for r in R:
    if r['product_id'] not in pid: e(f'{r["review_id"]} 없는 product_id'); continue
    p = pid[r['product_id']]
    if r['purchased_size'] not in p['sizes']: e(f'{r["review_id"]} purchased_size')
    if not 1 <= r['rating'] <= 5 or not isinstance(r['rating'], int): e(f'{r["review_id"]} rating')
    for k in ('size_opinion', 'length_opinion'):
        if r[k] not in ALLOWED[k]: e(f'{r["review_id"]} {k}')
    if not (140 <= r['height_cm'] <= 200 and 35 <= r['weight_kg'] <= 130): e(f'{r["review_id"]} 신체값')
cnt = collections.Counter(r['product_id'] for r in R); bc = collections.Counter(p['brand_id'] for p in P)
if len(B) < 60: e(f'브랜드 {len(B)} < 60')
if min(bc.values()) < 10: e('브랜드당 상품 10개 미만 있음')
if len(P) < 600: e(f'상품 {len(P)} < 600')
if any(cnt[p['product_id']] < 5 for p in P): e('상품당 후기 5개 미만 있음')
g = collections.Counter(p['gender'] for p in P)
print(f'brands {len(B)} products {len(P)} reviews {len(R)} | gender {dict(g)} | 여성:남성(공용 제외) = {g["여성"]}:{g["남성"]}')
print('ERR', len(err)); [print(' -', x) for x in err[:30]]
sys.exit(1 if err else 0)
