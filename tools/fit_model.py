"""핏센스 더미 데이터의 '핏 판정 규칙'.

generate_data.py(데이터 생성)와 validate_data.py(일관성 검증)가 같은 규칙을 공유한다.
JSON의 값(사이즈표·신체 치수)만으로 후기의 핏 판정이 다시 계산되기 때문에,
JSON을 손으로 고치면 validate_data.py가 어긋난 부분을 찾아낸다.

모든 수치는 '실습용 가정값'이며 실제 브랜드·체형 통계로 검증된 값이 아니다.
"""
import math

SIZES = ['XS', 'S', 'M', 'L', 'XL']
CATS = ['상의', '하의', '원피스', '아우터']
PREFS = ['슬림 핏', '기본 핏', '여유 핏']        # 앱의 PREF 이름과 동일
FIT_TYPES = ['슬림', '레귤러', '오버']
SLEEVES = ['민소매', '반소매', '긴소매']
STRETCHES = ['없음', '약간', '좋음']

# 기준 체형(키 160cm·52kg)의 치수. 앱 app.js의 bodyOf() 추정식과 같은 값이다.
REF = {'어깨': 38.1, '가슴': 82.0, '허리': 64.0, '힙': 92.0, '허벅지': 54.7, '소매': 54.0}
BODY_KEY = {'어깨': 'shoulder_cm', '가슴': 'chest_cm', '허리': 'waist_cm',
            '힙': 'hip_cm', '허벅지': 'thigh_cm', '소매': 'arm_cm'}

# 한 사이즈 올라갈 때 늘어나는 치수(cm)
INC = {'어깨': 1.2, '가슴': 6.0, '허리': 4.0, '힙': 4.0, '허벅지': 3.0, '소매': 1.0}
INC_LEN = {'상의': 1.5, '하의': 1.5, '원피스': 2.0, '아우터': 1.5}

# 컷(핏 타입)별 의도된 여유량: 사이즈 M 옷 치수 = 기준 체형 + 여유량
CUT = {
    '상의': {'슬림': {'어깨': 0.5, '가슴': 6, '소매': 3},
            '레귤러': {'어깨': 1.5, '가슴': 14, '소매': 4},
            '오버': {'어깨': 5.0, '가슴': 26, '소매': 8}},
    '하의': {'슬림': {'허리': 2, '힙': 3, '허벅지': 1},
            '레귤러': {'허리': 4, '힙': 7, '허벅지': 5},
            '오버': {'허리': 5, '힙': 11, '허벅지': 14}},
    '원피스': {'슬림': {'어깨': 0.5, '가슴': 6, '허리': 4, '소매': 3},
             '레귤러': {'어깨': 1.5, '가슴': 12, '허리': 14, '소매': 4},
             '오버': {'어깨': 4.0, '가슴': 22, '허리': 26, '소매': 7}},
    '아우터': {'슬림': {'어깨': 1.5, '가슴': 14, '소매': 5},
             '레귤러': {'어깨': 3.0, '가슴': 22, '소매': 6},
             '오버': {'어깨': 7.0, '가슴': 34, '소매': 10}},
}

# 선호 핏에 따른 기대 여유량 이동(슬림은 덜 여유롭게, 여유는 더 여유롭게)
PREF_K = {'슬림 핏': -1.0, '기본 핏': 0.0, '여유 핏': 1.2}
PREF_SCALE = {'어깨': 1.2, '가슴': 5.0, '허리': 3.0, '힙': 3.0, '허벅지': 2.5, '소매': 0.0}

# 신축성이 좋으면 같은 치수에도 덜 타이트하게 느낀다
STRETCH_K = {'없음': 0.0, '약간': -1.0, '좋음': -3.0}
STRETCH_F = {'어깨': 0.0, '가슴': 1.0, '허리': 1.0, '힙': 1.0, '허벅지': 0.8, '소매': 0.0}

# '적당' 판정 허용 범위(cm)
TOL = {'어깨': 1.6, '가슴': 4.5, '허리': 3.0, '힙': 3.0, '허벅지': 2.5, '소매': 2.5}

# 전체 사이즈감(size_opinion) 판정에 쓰는 부위 가중치
WEIGHT_TOP = {'어깨': 0.25, '가슴': 0.75}
WEIGHT_PANTS = {'허리': 0.4, '힙': 0.4, '허벅지': 0.2}
WEIGHT_SKIRT = {'허리': 0.5, '힙': 0.5}
WEIGHT_DRESS = {'어깨': 0.15, '가슴': 0.45, '허리': 0.40}
WEIGHT_OUTER = {'어깨': 0.30, '가슴': 0.70}

JOSA = {'어깨': '는', '가슴': '은', '허리': '는', '힙': '은', '허벅지': '는', '소매': '는', '총장': '은'}


def is_skirt(sub_category):
    return sub_category == '스커트'


def body_parts(category, sub_category, sleeve_type):
    """몸 치수와 비교하는 부위(총장 제외)."""
    if category == '상의':
        p = ['어깨', '가슴']
    elif category == '하의':
        p = ['허리', '힙'] if is_skirt(sub_category) else ['허리', '힙', '허벅지']
    elif category == '원피스':
        p = ['어깨', '가슴', '허리']
    else:
        p = ['어깨', '가슴']
    if category in ('상의', '원피스') and sleeve_type == '긴소매':
        p.append('소매')
    if category == '아우터':
        p.append('소매')
    return p


def chart_keys(category, sub_category, sleeve_type):
    return body_parts(category, sub_category, sleeve_type) + ['총장']


def weights(category, sub_category):
    if category == '상의':
        return WEIGHT_TOP
    if category == '하의':
        return WEIGHT_SKIRT if is_skirt(sub_category) else WEIGHT_PANTS
    if category == '원피스':
        return WEIGHT_DRESS
    return WEIGHT_OUTER


def length_tol(design_length):
    return max(2.5, 0.045 * design_length)


def center(category, fit_type, part, pref, stretch):
    """해당 컷에서 '딱 맞다'고 느끼는 기대 여유량(cm)."""
    return CUT[category][fit_type][part] + PREF_K[pref] * PREF_SCALE[part] + STRETCH_K[stretch] * STRETCH_F[part]


def rhu(x):
    """반올림(0.5는 올림). Python round()의 짝수 반올림을 피하기 위해 사용."""
    return int(math.floor(x + 0.5))


def label_for(part, dev, design_length=None):
    if part == '총장':
        tol = length_tol(design_length)
        return '긴 편' if dev > tol else '짧은 편' if dev < -tol else '적당'
    if part == '소매':
        return '긴 편' if dev > TOL[part] else '짧은 편' if dev < -TOL[part] else '적당'
    return '여유' if dev > TOL[part] else '타이트' if dev < -TOL[part] else '적당'


def evaluate(product, user, size):
    """상품(사이즈표)과 사용자(신체·선호 핏)로 핏을 판정한다.

    반환: ease(옷-몸 cm, 총장은 '기준 길이 대비 차이'), dev(기대 여유량과의 차이),
          labels(부위별 판정), d(전체 편차, 사이즈 단계 단위: +면 크게, -면 작게)
    """
    cat, sub, slv = product['category'], product['sub_category'], product['sleeve_type']
    row = product['size_chart'][size]
    ease, dev, labels = {}, {}, {}
    for part in body_parts(cat, sub, slv):
        ease[part] = round(row[part] - user[BODY_KEY[part]], 1)
        dev[part] = ease[part] - center(cat, product['fit_type'], part, user['fit_preference'], product['stretch'])
        labels[part] = label_for(part, dev[part])
    design = product['design_length_cm']
    ease['총장'] = round(row['총장'] - design * user['height_cm'] / 160.0, 1)
    dev['총장'] = ease['총장']
    labels['총장'] = label_for('총장', dev['총장'], design)
    w = weights(cat, sub)
    d = sum(w[p] * dev[p] / INC[p] for p in w) / sum(w.values())
    return {'ease': ease, 'dev': dev, 'labels': labels, 'd': d}


def opinion_from_d(d):
    step = rhu(d)
    op = '큰 편' if step > 0 else '작은 편' if step < 0 else '정사이즈'
    return step, op
