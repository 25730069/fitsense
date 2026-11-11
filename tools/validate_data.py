"""핏센스 데이터 일관성 검증.

실행:  python tools/validate_data.py
JSON을 손으로 고친 뒤에도 실행해 보세요. 오류가 있으면 종료 코드 1로 끝납니다.

검사 범위
  1. 구조: ID 중복, 필수 필드, 허용값, 자료형, meta 플래그
  2. 참조: 후기 → 상품·사용자·브랜드·카테고리가 서로 맞는지
  3. 상품: 사이즈표가 XS→XL로 커지는지, 부위 구성이 카테고리와 맞는지
  4. 사용자: 키·몸무게·치수가 현실적인 범위인지
  5. 후기: 사이즈표와 신체 치수로 핏을 다시 계산해 후기의 판정·추천 사이즈·본문과 비교
  6. 집계: 건수, 상품당 후기 수, 별점-사이즈감 관계
"""
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

import fit_model as M

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
TODAY = date(2026, 11, 9)
errors, warns = [], []
# meta 에 적지 않는 관리용·복제 필드(다른 파일의 값을 복사했거나 ID·구분용 필드)
EXEMPT = ('meta', 'review_id', 'product_id', 'user_id', 'brand_id', 'data_type', 'gender', 'brand', 'category',
          'source', 'source_url')


def err(msg):
    errors.append(msg)


def warn(msg):
    warns.append(msg)


def load(name):
    with open(os.path.join(DATA, name), encoding='utf-8') as f:
        data = json.load(f)
    if not isinstance(data, list):
        err(f'{name}: 최상위가 배열이 아닙니다')
        return []
    return data


def check_ids(rows, key, name):
    ids = [r.get(key) for r in rows]
    for k, c in Counter(ids).items():
        if c > 1:
            err(f'{name}: {key} 중복 {k}')
    return set(ids)


def check_meta(row, ident, cols):
    m = row.get('meta')
    if not isinstance(m, dict):
        err(f'{ident}: meta 없음')
        return
    if m.get('source') not in ('json', 'api'):
        err(f'{ident}: meta.source 허용값 밖 {m.get("source")!r}')
    api = m.get('api', [])
    if m.get('source') == 'api' and not api:
        err(f'{ident}: source=api 인데 meta.api 필드 목록이 없음')
    if m.get('source') == 'json' and api:
        err(f'{ident}: source=json 인데 meta.api 가 있음')
    for f in api:
        if f in cols:
            err(f'{ident}: API 필드 {f} 는 JSON 에 값이 없어야 함')
    listed = []
    for k in ('real', 'dummy', 'unknown', 'derived'):
        listed += m.get(k, [])
    for f in listed:
        if f not in cols:
            err(f'{ident}: meta에 없는 필드 이름 {f}')
    if len(listed) != len(set(listed)):
        err(f'{ident}: meta 목록에 같은 필드가 두 번 이상 있음')
    for f in cols:
        if f not in listed and f not in EXEMPT:
            warn(f'{ident}: {f} 가 meta(real/dummy/unknown/derived) 어디에도 없음')


def main():
    brands, products, users, reviews = (load(n) for n in ('brands.json', 'products.json', 'users.json', 'reviews.json'))
    bid = check_ids(brands, 'brand_id', 'brands')
    pid = check_ids(products, 'product_id', 'products')
    uid = check_ids(users, 'user_id', 'users')
    check_ids(reviews, 'review_id', 'reviews')
    bnames = {b['brand_name']: b['brand_id'] for b in brands}
    for b in brands:
        check_meta(b, b['brand_id'], b.keys())

    # ---------------- 상품
    pmap = {p['product_id']: p for p in products}
    cells = defaultdict(int)
    for p in products:
        i = p['product_id']
        check_meta(p, i, p.keys())
        if p['brand'] not in bnames or bnames[p['brand']] != p['brand_id']:
            err(f'{i}: brand/brand_id 가 brands.json 과 맞지 않음')
        if p['category'] not in M.CATS:
            err(f'{i}: category 허용값 밖 {p["category"]}')
        if p['size_chart'] is None:      # 실제 상품: 사이즈표 미확인
            if p['meta']['real'] == []:
                err(f'{i}: 사이즈표가 없는데 실제 상품으로 표시되지 않음')
            continue
        cells[(p['brand'], p['category'])] += 1
        for k, allowed in (('fit_type', M.FIT_TYPES), ('stretch', M.STRETCHES)):
            if p[k] not in allowed:
                err(f'{i}: {k} 허용값 밖 {p[k]}')
        if p['category'] == '하의' and p['sleeve_type'] is not None:
            err(f'{i}: 하의는 sleeve_type 이 null 이어야 함')
        if p['category'] != '하의' and p['sleeve_type'] not in M.SLEEVES:
            err(f'{i}: sleeve_type 허용값 밖 {p["sleeve_type"]}')
        if p['category'] == '아우터' and p['sleeve_type'] != '긴소매':
            err(f'{i}: 아우터는 긴소매여야 함')
        if not isinstance(p['price'], int) or not 5000 <= p['price'] <= 400000:
            err(f'{i}: price 이상 {p["price"]}')
        if p['sizes'] != M.SIZES or list(p['size_chart']) != M.SIZES:
            err(f'{i}: sizes/size_chart 사이즈 구성이 {M.SIZES} 와 다름')
            continue
        keys = M.chart_keys(p['category'], p['sub_category'], p['sleeve_type'])
        prev = None
        for s in M.SIZES:
            row = p['size_chart'][s]
            if list(row) != keys:
                err(f'{i} {s}: 사이즈표 부위가 {keys} 와 다름 ({list(row)})')
            if prev:
                for k in keys:
                    if not row[k] > prev[k]:
                        err(f'{i}: {k} 이(가) {s} 에서 커지지 않음')
                    elif row[k] - prev[k] > 2 * (M.INC.get(k) or M.INC_LEN[p['category']]) + 1:
                        warn(f'{i}: {k} 의 사이즈 간격이 비정상적으로 큼')
            prev = row
        if '가슴' in keys and '허리' in keys and p['category'] == '원피스':
            pass
        if p['category'] == '하의' and not all(p['size_chart'][s]['힙'] > p['size_chart'][s]['허리'] for s in M.SIZES):
            err(f'{i}: 힙이 허리보다 커야 함')
    for b in bnames:
        for c in M.CATS:
            if cells[(b, c)] == 0:
                err(f'상품 없음: {b} / {c}')

    # ---------------- 사용자
    umap = {u['user_id']: u for u in users}
    for u in users:
        i = u['user_id']
        check_meta(u, i, u.keys())
        if not 145 <= u['height_cm'] <= 180:
            err(f'{i}: 키 범위 밖 {u["height_cm"]}')
        if not 38 <= u['weight_kg'] <= 95:
            err(f'{i}: 몸무게 범위 밖 {u["weight_kg"]}')
        bmi = u['weight_kg'] / (u['height_cm'] / 100) ** 2
        if not 15.5 <= bmi <= 35:
            err(f'{i}: BMI 범위 밖 {bmi:.1f}')
        if u['data_type'] == 'real':
            continue
        if u['fit_preference'] not in M.PREFS:
            err(f'{i}: fit_preference 허용값 밖 {u["fit_preference"]}')
        h, dw = u['height_cm'], u['weight_kg'] - 52
        exp = {'shoulder_cm': h * .238 + .04 * dw, 'chest_cm': h * .5 + dw * .6 + 2, 'waist_cm': h * .4 + dw * .6,
               'hip_cm': h * .575 + dw * .6, 'arm_cm': h * .3375}
        tol = {'shoulder_cm': 4, 'chest_cm': 10, 'waist_cm': 11, 'hip_cm': 9, 'arm_cm': 5}
        for k, e in exp.items():
            if u[k] is None or abs(u[k] - e) > tol[k]:
                err(f'{i}: {k}={u[k]} 가 키·몸무게에서 기대되는 값({e:.0f}±{tol[k]})에서 너무 멀다')
        if not (u['chest_cm'] > u['waist_cm'] and u['hip_cm'] > u['waist_cm']):
            err(f'{i}: 가슴·힙이 허리보다 커야 함')
        if not 40 <= u['thigh_cm'] < u['hip_cm']:
            err(f'{i}: 허벅지 둘레 이상 {u["thigh_cm"]}')

    # ---------------- 후기
    per_product, per_user, seen_pairs = Counter(), Counter(), set()
    rating_by_op = defaultdict(list)
    n_real = 0
    for r in reviews:
        i = r['review_id']
        check_meta(r, i, r.keys())
        if r['product_id'] not in pmap:
            err(f'{i}: product_id {r["product_id"]} 없음')
            continue
        if r['user_id'] not in umap:
            err(f'{i}: user_id {r["user_id"]} 없음')
            continue
        p, u = pmap[r['product_id']], umap[r['user_id']]
        per_product[p['product_id']] += 1
        per_user[u['user_id']] += 1
        if (r['product_id'], r['user_id']) in seen_pairs:
            err(f'{i}: 같은 사용자가 같은 상품에 후기를 두 번 씀')
        seen_pairs.add((r['product_id'], r['user_id']))
        if r['brand'] != p['brand'] or r['category'] != p['category']:
            err(f'{i}: brand/category 가 상품({p["brand"]}/{p["category"]})과 다름')
        if r['data_type'] not in ('real', 'dummy'):
            err(f'{i}: data_type 허용값 밖')
        if not isinstance(r['rating'], int) or not 1 <= r['rating'] <= 5:
            err(f'{i}: rating 범위 밖')
        if r['review_date'] and not date.fromisoformat(r['review_date']) <= TODAY:
            err(f'{i}: 미래 날짜 {r["review_date"]}')
        if r['purchased_size'] not in M.SIZES or r['fitted_size'] not in M.SIZES:
            err(f'{i}: 사이즈 허용값 밖')
            continue
        op = r['size_opinion']
        if op not in ('작은 편', '정사이즈', '큰 편'):
            err(f'{i}: size_opinion 허용값 밖 {op}')
            continue
        # 사이즈감 ↔ 점수 ↔ 추천 사이즈 관계
        if r['size_score'] != {'큰 편': 1, '정사이즈': 0, '작은 편': -1}[op]:
            err(f'{i}: size_score 가 size_opinion 과 맞지 않음')
        pi, fi = M.SIZES.index(r['purchased_size']), M.SIZES.index(r['fitted_size'])
        if r['size_matched'] != (pi == fi):
            err(f'{i}: size_matched 가 purchased/fitted 와 맞지 않음')
        if op == '정사이즈' and pi != fi:
            err(f'{i}: 정사이즈인데 추천 사이즈가 다름')
        if op == '큰 편' and not (fi < pi or (fi == pi and r['size_limit'])):
            err(f'{i}: 큰 편인데 추천 사이즈가 더 작지 않음')
        if op == '작은 편' and not (fi > pi or (fi == pi and r['size_limit'])):
            err(f'{i}: 작은 편인데 추천 사이즈가 더 크지 않음')
        rating_by_op[op].append(r['rating'])
        text = r['review_text']
        if r['data_type'] == 'real':
            n_real += 1
            continue
        # ---- 더미 후기: 사이즈표·신체로 다시 계산
        if r['source'] != 'synthetic':
            err(f'{i}: dummy 인데 source 가 synthetic 이 아님')
        ev = M.evaluate(p, u, r['purchased_size'])
        step, op2 = M.opinion_from_d(ev['d'])
        if op2 != op:
            err(f'{i}: 사이즈표·신체로 계산한 사이즈감은 "{op2}" 인데 후기는 "{op}" (d={ev["d"]:.2f})')
        exp_fi = max(0, min(4, pi - step))
        if r['size_limit'] != (not 0 <= pi - step <= 4):
            err(f'{i}: size_limit({r["size_limit"]}) 이 계산과 다름 (구매 {pi}, 단계 {step})')
        if exp_fi != fi:
            err(f'{i}: 추천 사이즈 계산값 {M.SIZES[exp_fi]} ≠ 후기 {M.SIZES[fi]}')
        keys = M.chart_keys(p['category'], p['sub_category'], p['sleeve_type'])
        if list(r['fit_details']) != keys or list(r['ease_cm']) != keys:
            err(f'{i}: fit_details/ease_cm 부위가 {keys} 와 다름')
            continue
        for k in keys:
            if abs(ev['ease'][k] - r['ease_cm'][k]) > 0.051:
                err(f'{i}: {k} 여유 {r["ease_cm"][k]} ≠ 계산값 {ev["ease"][k]}')
            if ev['labels'][k] != r['fit_details'][k]:
                err(f'{i}: {k} 판정 "{r["fit_details"][k]}" ≠ 계산값 "{ev["labels"][k]}"')
        ln = r['fit_details']['총장']
        if r['length_opinion'] != ln or r['length_score'] != (1 if ln == '긴 편' else -1 if ln == '짧은 편' else 0):
            err(f'{i}: length_opinion/score 가 총장 판정과 다름')
        # ---- 본문
        if f'{u["height_cm"]}' not in text or f'{u["weight_kg"]}' not in text:
            err(f'{i}: 본문 키/몸무게가 사용자 정보와 다름')
        m = re.search(r'\b(XS|S|M|L|XL)\b', text)
        if not m or m.group(1) != r['purchased_size']:
            err(f'{i}: 본문 구매 사이즈가 purchased_size 와 다름')
        token = {'정사이즈': '정사이즈', '큰 편': '큰 편', '작은 편': '작은 편'}[op]
        if token not in text:
            err(f'{i}: 본문에 사이즈감 표현 "{token}" 없음')
        for other in ('정사이즈', '큰 편', '작은 편'):
            if other != token and other in text and not (other == '큰 편' and '긴 편' in text):
                if other in text.replace('가장 큰 사이즈', '').replace('가장 작은 사이즈', ''):
                    err(f'{i}: 본문에 서로 다른 사이즈감 표현 "{other}" 혼재')
        n = abs(pi - fi)
        if op == '큰 편' and fi != pi:
            want = '한 치수 작게' if n == 1 else '두 치수 작게'
            if want not in text:
                err(f'{i}: 본문 추천 문구 "{want}" 없음')
        if op == '작은 편' and fi != pi:
            want = '한 치수 크게' if n == 1 else '두 치수 크게'
            if want not in text:
                err(f'{i}: 본문 추천 문구 "{want}" 없음')
        for k in keys:
            if r['fit_details'][k] == '타이트' and f'{k}{M.JOSA[k]} 타이트' not in text and '·' not in text:
                warn(f'{i}: {k} 타이트 표현이 본문에 없음')

    # ---------------- 집계
    n_dummy = len(reviews) - n_real
    if len(reviews) != 300:
        err(f'후기 건수 {len(reviews)} (300건이어야 함)')
    if n_real != 1:
        warn(f'실제 후기 {n_real}건')
    for p in products:
        if p['size_chart'] is not None and per_product[p['product_id']] < 3:
            err(f'{p["product_id"]}: 후기 {per_product[p["product_id"]]}건 (3건 이상 필요)')
    for u in users:
        if per_user[u['user_id']] == 0:
            err(f'{u["user_id"]}: 후기를 한 건도 쓰지 않은 사용자')
    mean = {k: sum(v) / len(v) for k, v in rating_by_op.items() if v}
    if mean.get('정사이즈', 0) <= max(mean.get('큰 편', 0), mean.get('작은 편', 0)):
        warn(f'정사이즈 후기의 평균 별점이 가장 높지 않음: {mean}')

    # ---------------- 결과
    print(f'브랜드 {len(brands)} · 상품 {len(products)} · 사용자 {len(users)} · 후기 {len(reviews)}'
          f' (실제 {n_real} · 더미 {n_dummy})')
    c = Counter(r['size_opinion'] for r in reviews)
    print('사이즈감:', dict(c), '· 평균 별점:', {k: round(v, 2) for k, v in mean.items()})
    print('항목 출처(meta.source):', {'products': dict(Counter(p['meta']['source'] for p in products)),
          'brands/users/reviews': 'json 전부' if all(x['meta']['source'] == 'json' for x in brands + users + reviews) else '확인 필요'})
    print(f'경고 {len(warns)}건 · 오류 {len(errors)}건')
    for w in warns[:30]:
        print('  경고:', w)
    for e in errors[:60]:
        print('  오류:', e)
    if len(errors) > 60:
        print(f'  … 오류 {len(errors) - 60}건 더')
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
