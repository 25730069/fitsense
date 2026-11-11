"""핏센스 더미 데이터 생성기.

실행:  python tools/generate_data.py
결과:  data/brands.json, data/products.json, data/users.json, data/reviews.json

- 같은 시드(SEED)면 항상 같은 결과가 나온다.
- 핏 판정(타이트/적당/여유, 큰 편/작은 편, 추천 사이즈)은 fit_model.py 규칙으로 계산하므로
  상품 사이즈표 · 사용자 신체 치수 · 후기가 서로 어긋나지 않는다.
- 브랜드별 사이즈 경향(BRAND_BIAS)은 '검증되지 않은 가정값'이다. 실제 브랜드 특성이 아니다.
"""
import json
import os
import random
from datetime import date, timedelta

import fit_model as M

SEED = 20261109
N_USERS = 130                 # 더미 사용자 수(후기 작성자)
REVIEWS_PER_PRODUCT = 4       # 상품당 최소 후기 수
TOTAL_DUMMY_REVIEWS = 299     # 더미 후기 수(+ 실제 후기 1건 = 300건)
TODAY = date(2026, 11, 9)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')

# ---------------------------------------------------------------- 브랜드
BRANDS = [  # (id, 한글명, 영문명, 공식 사이트, 코드, 가격 배수)
    (1, '유니클로', 'UNIQLO', 'https://www.uniqlo.com/kr', 'UNIQLO', 0.9),
    (2, '무신사 스탠다드', 'MUSINSA STANDARD', 'https://www.musinsa.com', 'MSS', 0.9),
    (3, '스파오', 'SPAO', 'https://www.spao.co.kr', 'SPAO', 0.7),
    (4, '탑텐', 'TOPTEN10', 'https://www.topten10.com', 'TOPTEN', 0.7),
    (5, '에잇세컨즈', '8SECONDS', 'https://www.8seconds.co.kr', '8SEC', 1.2),
    (6, '지오다노', 'GIORDANO', 'https://www.giordano.co.kr', 'GIORDANO', 0.8),
    (7, '자라', 'ZARA', 'https://www.zara.com/kr', 'ZARA', 1.3),
    (8, '아디다스', 'adidas', 'https://www.adidas.co.kr', 'ADIDAS', 1.3),
    (9, '나이키', 'NIKE', 'https://www.nike.com/kr', 'NIKE', 1.4),
]

# 가정값: 브랜드가 같은 '라벨 사이즈'를 얼마나 크게/작게 만드는지(cm). +면 크게, -면 작게.
BRAND_BIAS = {
    '유니클로': {'어깨': 0.5, '총장': 1.5},
    '무신사 스탠다드': {'어깨': 1.0, '가슴': 3, '허리': 2, '힙': 2},
    '스파오': {},
    '탑텐': {'소매': 2.0},
    '에잇세컨즈': {'어깨': -0.8, '가슴': -3, '허리': -2, '힙': -2},
    '지오다노': {'허리': 3, '힙': 1},
    '자라': {'어깨': -1.2, '가슴': -5, '허리': -3, '힙': -3, '총장': -2},
    '아디다스': {'가슴': 1, '소매': 1.0},
    '나이키': {'가슴': 2, '허리': 1, '힙': 1},
}

# ---------------------------------------------------------------- 상품 원형
# (이름, 세부 분류, 컷, 소매, 신축성, 설계 총장(M·키160 기준), 기준 가격, 색상 후보)
A = {
    '상의': {
        'tee': ('우먼즈 베이직 크루넥 티셔츠', '티셔츠', '레귤러', '반소매', '약간', 60, 19900, ['화이트', '블랙', '그레이', '네이비']),
        'knit': ('우먼즈 릴렉스드 니트 풀오버', '니트/가디건', '오버', '긴소매', '약간', 62, 39900, ['아이보리', '차콜', '베이지', '카키']),
        'cardigan': ('우먼즈 라이트 카디건', '니트/가디건', '레귤러', '긴소매', '약간', 60, 39900, ['베이지', '그레이', '블랙', '아이보리']),
        'shirt': ('우먼즈 옥스포드 셔츠', '셔츠/블라우스', '레귤러', '긴소매', '없음', 66, 39900, ['화이트', '스카이블루', '네이비']),
        'tank': ('우먼즈 슬림 슬리브리스 탑', '나시/슬리브리스', '슬림', '민소매', '좋음', 56, 14900, ['블랙', '화이트', '그레이']),
        'sweat': ('우먼즈 오버핏 맨투맨', '후드/맨투맨', '오버', '긴소매', '약간', 64, 39900, ['그레이', '네이비', '블랙', '아이보리']),
        'crop': ('우먼즈 크롭 반팔 티셔츠', '티셔츠', '슬림', '반소매', '좋음', 48, 19900, ['화이트', '블랙', '핑크']),
    },
    '하의': {
        'denim': ('우먼즈 스트레이트 데님 팬츠', '데님팬츠', '레귤러', None, '약간', 98, 49900, ['연청', '진청', '블랙']),
        'slacks': ('우먼즈 슬랙스 팬츠', '팬츠/슬랙스', '레귤러', None, '약간', 98, 49900, ['블랙', '차콜', '베이지']),
        'wide': ('우먼즈 와이드 슬랙스', '팬츠/슬랙스', '오버', None, '약간', 100, 49900, ['블랙', '그레이', '아이보리']),
        'jogger': ('우먼즈 조거 팬츠', '조거/트레이닝', '레귤러', None, '좋음', 96, 39900, ['그레이', '블랙', '네이비']),
        'skirt': ('우먼즈 에이라인 미디 스커트', '스커트', '레귤러', None, '약간', 78, 39900, ['블랙', '베이지', '카키']),
        'shorts': ('우먼즈 데님 쇼츠', '쇼츠/버뮤다', '레귤러', None, '약간', 42, 29900, ['연청', '진청', '블랙']),
    },
    '원피스': {
        'knit_mini': ('우먼즈 니트 미니 원피스', '원피스', '슬림', '긴소매', '좋음', 88, 59900, ['블랙', '차콜', '아이보리']),
        'shirt_dress': ('우먼즈 셔츠 원피스', '원피스', '레귤러', '긴소매', '없음', 105, 59900, ['화이트', '스카이블루', '베이지']),
        'long': ('우먼즈 롱 원피스', '원피스', '레귤러', '반소매', '약간', 125, 69900, ['블랙', '네이비', '카키']),
        'sleeveless': ('우먼즈 슬리브리스 미니 원피스', '원피스', '슬림', '민소매', '좋음', 85, 49900, ['블랙', '화이트', '그레이']),
    },
    '아우터': {
        'blazer': ('우먼즈 블레이저', '블레이저', '레귤러', '긴소매', '없음', 66, 99000, ['블랙', '그레이', '베이지']),
        'trench': ('우먼즈 트렌치 코트', '코트', '레귤러', '긴소매', '없음', 100, 159000, ['베이지', '블랙', '카키']),
        'padding': ('우먼즈 숏 패딩 점퍼', '패딩', '오버', '긴소매', '없음', 58, 129000, ['블랙', '아이보리', '카키']),
        'denim_jacket': ('우먼즈 데님 자켓', '자켓/점퍼', '레귤러', '긴소매', '약간', 56, 79000, ['연청', '진청', '블랙']),
        'half_coat': ('우먼즈 울 하프 코트', '코트', '레귤러', '긴소매', '없음', 85, 189000, ['차콜', '카멜', '블랙']),
        'fleece': ('우먼즈 후리스 집업', '후리스', '오버', '긴소매', '약간', 64, 59900, ['아이보리', '그레이', '네이비']),
    },
}
CAT_CODE = {'상의': 'TOP', '하의': 'BOTTOM', '원피스': 'DRESS', '아우터': 'OUTER'}

# 브랜드 × 카테고리 별로 판매하는 상품 2종
ASSIGN = {
    '유니클로': {'상의': ['tee', 'knit'], '하의': ['slacks', 'denim'], '원피스': ['shirt_dress', 'long'], '아우터': ['padding', 'fleece']},
    '무신사 스탠다드': {'상의': ['sweat', 'tee'], '하의': ['wide', 'denim'], '원피스': ['knit_mini', 'long'], '아우터': ['blazer', 'trench']},
    '스파오': {'상의': ['tee', 'sweat'], '하의': ['denim', 'shorts'], '원피스': ['shirt_dress', 'sleeveless'], '아우터': ['fleece', 'denim_jacket']},
    '탑텐': {'상의': ['shirt', 'knit'], '하의': ['slacks', 'skirt'], '원피스': ['long', 'knit_mini'], '아우터': ['padding', 'blazer']},
    '에잇세컨즈': {'상의': ['shirt', 'cardigan'], '하의': ['slacks', 'skirt'], '원피스': ['shirt_dress', 'knit_mini'], '아우터': ['trench', 'half_coat']},
    '지오다노': {'상의': ['tee', 'cardigan'], '하의': ['denim', 'jogger'], '원피스': ['long', 'sleeveless'], '아우터': ['denim_jacket', 'fleece']},
    '자라': {'상의': ['knit', 'crop'], '하의': ['wide', 'skirt'], '원피스': ['sleeveless', 'shirt_dress'], '아우터': ['blazer', 'half_coat']},
    '아디다스': {'상의': ['tee', 'crop'], '하의': ['jogger', 'shorts'], '원피스': ['sleeveless', 'long'], '아우터': ['fleece', 'padding']},
    '나이키': {'상의': ['tank', 'sweat'], '하의': ['jogger', 'wide'], '원피스': ['sleeveless', 'knit_mini'], '아우터': ['padding', 'fleece']},
}


def r05(x):
    return round(x * 2) / 2


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def build_chart(category, sub, sleeve, fit, design_len, bias, noise):
    """사이즈별 옷 치수(cm) 생성. bias/noise는 부위별 cm."""
    chart = {}
    for i, size in enumerate(M.SIZES):
        row = {}
        for part in M.body_parts(category, sub, sleeve):
            v = M.REF[part] + M.CUT[category][fit][part] + bias.get(part, 0) + noise.get(part, 0) + M.INC[part] * (i - 2)
            row[part] = r05(v)
        row['총장'] = r05(design_len + bias.get('총장', 0) + noise.get('총장', 0) + M.INC_LEN[category] * (i - 2))
        chart[size] = row
    return chart


# ---------------------------------------------------------------- 생성
def make_brands():
    out = []
    for bid, ko, en, site, _code, _m in BRANDS:
        out.append({
            'brand_id': bid, 'brand_name': ko, 'brand_name_en': en, 'website': site,
            'meta': {'source': 'json', 'real': ['brand_name', 'brand_name_en', 'website'], 'dummy': [], 'unknown': []},
        })
    return out


def make_products(rng):
    prods = []
    for bid, ko, _en, _site, code, mult in BRANDS:
        for cat in M.CATS:
            for n, key in enumerate(ASSIGN[ko][cat], start=1):
                name, sub, fit, slv, stretch, dlen, price, colors = A[cat][key]
                pid = f'{code}_{CAT_CODE[cat]}_{n:02d}'
                noise = {p: clamp(rng.gauss(0, 0.8), -1.5, 1.5) for p in M.body_parts(cat, sub, slv)}
                noise['총장'] = clamp(rng.gauss(0, 1.0), -2, 2)
                chart = build_chart(cat, sub, slv, fit, dlen, BRAND_BIAS[ko], noise)
                p = int(round(price * mult / 1000.0)) * 1000 - 100
                if price >= 79000:
                    p = int(round(price * mult / 1000.0)) * 1000
                prods.append({
                    'product_id': pid, 'brand_id': bid, 'brand': ko,
                    'product_name': name, 'category': cat, 'sub_category': sub, 'gender': '여성',
                    'fit_type': fit, 'sleeve_type': slv, 'stretch': stretch,
                    'design_length_cm': dlen, 'price': p,
                    'colors': rng.sample(colors, 2 if len(colors) < 4 else 3),
                    'sizes': list(M.SIZES), 'size_chart': chart,
                    'meta': {'source': 'json', 'real': ['brand', 'category'],
                             'dummy': ['product_name', 'sub_category', 'fit_type', 'sleeve_type', 'stretch',
                                       'design_length_cm', 'price', 'colors', 'sizes', 'size_chart'],
                             'unknown': []},
                })
    # 실제 후기 1건이 달린 실제 상품(사이즈표·가격은 확인하지 못함)
    prods.append({
        'product_id': 'MSS_TOP_R01', 'brand_id': 2, 'brand': '무신사 스탠다드',
        'product_name': '우먼즈 브이 넥 슬리브리스 탑 [블랙]', 'category': '상의', 'sub_category': None, 'gender': '여성',
        'fit_type': None, 'sleeve_type': '민소매', 'stretch': None, 'design_length_cm': None, 'price': None,
        'colors': ['블랙'], 'sizes': None, 'size_chart': None,
        'meta': {'source': 'json', 'real': ['brand', 'product_name', 'category', 'sleeve_type', 'colors'], 'dummy': [],
                 'unknown': ['sub_category', 'fit_type', 'stretch', 'design_length_cm', 'price', 'sizes', 'size_chart']},
    })
    return prods


def make_users(rng):
    users = []
    for i in range(1, N_USERS + 1):
        h = int(round(clamp(rng.gauss(160.5, 6.0), 148, 178)))
        bmi = clamp(rng.gauss(21.6, 3.0), 16.8, 31.5)
        w = int(round(bmi * (h / 100.0) ** 2))
        dw = w - 52
        sho = round(h * .238 + .04 * dw + rng.gauss(0, 1.0))
        chest = round(h * .5 + dw * .6 + 2 + rng.gauss(0, 2.2))
        waist = round(h * .4 + dw * .6 + rng.gauss(0, 2.5))
        hip = round(h * .575 + dw * .6 + rng.gauss(0, 2.0))
        thigh = round(hip * .595 + rng.gauss(0, 1.5))
        arm = round(h * .3375 + rng.gauss(0, 1.2))
        pref = rng.choices(M.PREFS, weights=[20, 55, 25])[0]
        users.append({
            'user_id': f'U{i:03d}', 'data_type': 'dummy', 'gender': '여성',
            'height_cm': h, 'weight_kg': w, 'shoulder_cm': sho, 'chest_cm': chest, 'waist_cm': waist,
            'hip_cm': hip, 'thigh_cm': thigh, 'arm_cm': arm, 'fit_preference': pref,
            'meta': {'source': 'json', 'real': [],
                     'dummy': ['height_cm', 'weight_kg', 'shoulder_cm', 'chest_cm', 'waist_cm', 'hip_cm',
                               'thigh_cm', 'arm_cm', 'fit_preference'], 'unknown': []},
        })
    users.insert(0, {
        'user_id': 'U000', 'data_type': 'real', 'gender': '여성', 'height_cm': 162, 'weight_kg': 53,
        'shoulder_cm': None, 'chest_cm': None, 'waist_cm': None, 'hip_cm': None, 'thigh_cm': None, 'arm_cm': None,
        'fit_preference': None,
        'meta': {'source': 'json', 'real': ['height_cm', 'weight_kg'], 'dummy': [],
                 'unknown': ['shoulder_cm', 'chest_cm', 'waist_cm', 'hip_cm', 'thigh_cm', 'arm_cm', 'fit_preference']},
    })
    return users


def usual_index(user, category):
    """사용자가 브랜드·상품을 모르고 고르는 '평소 사이즈'(기본 컷·무보정 기준 최적 사이즈)."""
    sub = '팬츠/슬랙스' if category == '하의' else '티셔츠'
    sleeve = '긴소매' if category in ('상의', '원피스', '아우터') else None
    generic = {
        'category': category, 'sub_category': sub, 'sleeve_type': sleeve, 'fit_type': '레귤러', 'stretch': '약간',
        'design_length_cm': 80, 'size_chart': build_chart(category, sub, sleeve, '레귤러', 80, {}, {}),
    }
    best = min(range(5), key=lambda i: abs(M.evaluate(generic, user, M.SIZES[i])['d']))
    return best


def assign_reviewers(rng, products_dummy, users_dummy):
    """상품별 후기 슬롯에 작성자를 배정(한 사용자가 같은 상품에 두 번 쓰지 않음)."""
    slots = []
    counts = {p['product_id']: REVIEWS_PER_PRODUCT for p in products_dummy}
    extra = TOTAL_DUMMY_REVIEWS - REVIEWS_PER_PRODUCT * len(products_dummy)
    for pid in rng.sample(list(counts), extra):
        counts[pid] += 1
    for pid, n in counts.items():
        slots += [pid] * n
    ids = [u['user_id'] for u in users_dummy]
    pool = ids[:] + [rng.choice(ids) for _ in range(len(slots) - len(ids))]
    for _ in range(2000):
        rng.shuffle(pool)
        seen, dup = set(), False
        for pid, uid in zip(slots, pool):
            if (pid, uid) in seen:
                dup = True
                break
            seen.add((pid, uid))
        if not dup:
            return list(zip(slots, pool))
    raise RuntimeError('작성자 배정 실패')


def review_text(rng, h, w, size, opinion, pi, fi, size_limit, labels, parts, stretch, rating, color):
    opener = rng.choice([
        f'{h}cm/{w}kg {size} 사이즈로 구매했어요.', f'키 {h}cm에 {w}kg, {size} 사이즈 착용했어요.',
        f'{h}cm {w}kg인데 {size} 입었어요.', f'{h}cm/{w}kg {size} 착용 후기예요.'])
    size_sent = {
        '정사이즈': ['사이즈는 정사이즈예요.', '정사이즈로 잘 맞아요.', '정사이즈 느낌이에요.'],
        '큰 편': ['사이즈는 큰 편이에요.', '생각보다 큰 편이에요.'],
        '작은 편': ['사이즈는 작은 편이에요.', '생각보다 작은 편이에요.'],
    }[opinion]
    pred = {'타이트': '타이트해요', '여유': '여유 있어요', '적당': '적당해요', '긴 편': '긴 편이에요', '짧은 편': '짧은 편이에요'}
    groups = {}
    for p in parts:
        groups.setdefault(labels[p], []).append(p)
    order = [k for k in ('타이트', '여유', '긴 편', '짧은 편') if k in groups] + (['적당'] if '적당' in groups else [])
    detail = ' '.join(f"{'·'.join(groups[k])}{M.JOSA[groups[k][-1]]} {pred[k]}." for k in order)
    n = abs(pi - fi)
    if opinion == '정사이즈':
        rec = rng.choice(['착용 사이즈 그대로 추천해요.', '같은 사이즈 추천드려요.'])
    elif opinion == '큰 편':
        if n == 0:   # 이미 가장 작은 사이즈
            rec = '가장 작은 사이즈인데도 큰 편이라 여유 있게 입고 싶을 때 추천해요.'
        else:
            rec = ('한 치수 작게' if n == 1 else '두 치수 작게') + (' 추천해요. 그래도 큰 편일 수 있어요.' if size_limit else ' 추천해요.')
    else:
        if n == 0:   # 이미 가장 큰 사이즈
            rec = '가장 큰 사이즈인데도 작은 편이라 아쉬워요.'
        else:
            rec = ('한 치수 크게' if n == 1 else '두 치수 크게') + (' 추천해요. 그래도 작은 편일 수 있어요.' if size_limit else ' 추천해요.')
    extra = []
    if stretch == '좋음' and rng.random() < .3:
        extra.append('신축성이 좋아서 편해요.')
    if stretch == '없음' and '타이트' in labels.values():
        extra.append('신축성이 거의 없어요.')
    if rng.random() < .2:
        extra.append(f'{color} 색감이 예뻐요.')
    if rating <= 3 and opinion != '정사이즈':
        extra.append('사이즈 선택이 조금 아쉬웠어요.')
    return ' '.join([opener, rng.choice(size_sent), detail, rec] + extra)


def make_reviews(rng, products, users):
    pmap = {p['product_id']: p for p in products}
    umap = {u['user_id']: u for u in users}
    dummy_products = [p for p in products if p['product_id'] != 'MSS_TOP_R01']
    dummy_users = [u for u in users if u['data_type'] == 'dummy']
    pairs = assign_reviewers(rng, dummy_products, dummy_users)
    usual = {}
    out = []
    start = date(2025, 11, 10)
    span = (TODAY - timedelta(days=4) - start).days
    for pid, uid in pairs:
        p, u = pmap[pid], umap[uid]
        key = (uid, p['category'])
        if key not in usual:
            usual[key] = usual_index(u, p['category'])
        shift = rng.choices([0, -1, 1], weights=[80, 10, 10])[0]
        pi = clamp(usual[key] + shift, 0, 4)
        size = M.SIZES[pi]
        ev = M.evaluate(p, u, size)
        step, opinion = M.opinion_from_d(ev['d'])
        fi = clamp(pi - step, 0, 4)
        size_limit = (pi - step) != fi
        parts = M.chart_keys(p['category'], p['sub_category'], p['sleeve_type'])
        labels = ev['labels']
        n_off = sum(1 for k in parts if labels[k] != '적당')
        rating = 5
        if opinion != '정사이즈':
            rating -= 1
        if abs(step) >= 2:
            rating -= 1
        if n_off >= 3 and rng.random() < .5:
            rating -= 1
        if rng.random() < .12:
            rating -= 1
        rating = int(clamp(rating, 2 if opinion != '정사이즈' else 3, 5))
        ln = labels['총장']
        d = start + timedelta(days=rng.randint(0, span))
        out.append({
            'data_type': 'dummy', 'product_id': pid, 'user_id': uid, 'brand': p['brand'], 'category': p['category'],
            'review_date': d.isoformat(), 'rating': rating,
            'purchased_size': size, 'size_opinion': opinion,
            'size_score': 1 if opinion == '큰 편' else -1 if opinion == '작은 편' else 0,
            'length_opinion': ln, 'length_score': 1 if ln == '긴 편' else -1 if ln == '짧은 편' else 0,
            'fit_details': {k: labels[k] for k in parts},
            'ease_cm': {k: ev['ease'][k] for k in parts},
            'size_matched': fi == pi, 'size_limit': size_limit, 'fitted_size': M.SIZES[fi],
            'review_text': review_text(rng, u['height_cm'], u['weight_kg'], size, opinion, pi, fi, size_limit,
                                       labels, parts, p['stretch'], rating, p['colors'][0]),
            'source': 'synthetic', 'source_url': None,
            'meta': {'source': 'json', 'real': [],
                     'dummy': ['product_id', 'user_id', 'review_date', 'rating', 'purchased_size', 'size_opinion',
                               'size_score', 'length_opinion', 'length_score', 'fit_details', 'ease_cm',
                               'size_matched', 'size_limit', 'fitted_size', 'review_text'], 'unknown': []},
        })
    out.append({  # 실제 후기 1건(무신사 스탠다드). 원문 그대로, 이용 조건은 직접 확인 필요
        'data_type': 'real', 'product_id': 'MSS_TOP_R01', 'user_id': 'U000', 'brand': '무신사 스탠다드', 'category': '상의',
        'review_date': None, 'rating': 5, 'purchased_size': 'S', 'size_opinion': '정사이즈', 'size_score': 0,
        'length_opinion': '적당', 'length_score': 0, 'fit_details': None, 'ease_cm': None,
        'size_matched': True, 'size_limit': False, 'fitted_size': 'S',
        'review_text': '브이넥 나시가 필요해서 검색하다가 발견 역시 무신사 스탠다드 살이쪄서 스몰이 적당한 핏으로 맞구요. 길이도 짧지도 길지도 않고 적당했습니다. 완전 신축성좋은 코튼은 아니고 그래서 더 이뻐보이는듯! 세일때 못산게 아쉬워용 ㅜㅜ',
        'source': 'musinsa', 'source_url': 'https://www.musinsa.com/products/4651478',
        'meta': {'source': 'json',
                 'real': ['product_id', 'user_id', 'brand', 'category', 'rating', 'purchased_size', 'size_opinion',
                          'length_opinion', 'review_text', 'source_url'],
                 'dummy': [],
                 'unknown': ['review_date', 'fit_details', 'ease_cm'],
                 'derived': ['size_score', 'length_score', 'size_matched', 'size_limit', 'fitted_size']},
    })
    # 보기 좋게 브랜드 → 상품 → 날짜 순으로 정렬한 뒤 ID 부여
    order = {p['product_id']: i for i, p in enumerate(products)}
    out.sort(key=lambda r: (order[r['product_id']], r['review_date'] or ''))
    for i, r in enumerate(out, start=1):
        r['review_id'] = f'R{i:03d}'
    out = [{'review_id': r.pop('review_id'), **r} for r in out]
    return out


def dump(name, data):
    path = os.path.join(OUT, name)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(f'  {name}: {len(data)}건')


def main():
    rng = random.Random(SEED)
    brands = make_brands()
    products = make_products(rng)
    users = make_users(rng)
    reviews = make_reviews(rng, products, users)
    os.makedirs(OUT, exist_ok=True)
    print('생성 완료:')
    dump('brands.json', brands)
    dump('products.json', products)
    dump('users.json', users)
    dump('reviews.json', reviews)


if __name__ == '__main__':
    main()
