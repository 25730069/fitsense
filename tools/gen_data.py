"""핏센스 더미 데이터 생성기 (결정적: 같은 seed → 같은 결과)
   data/brands.json   브랜드 마스터 (브랜드명·사이트는 실제, 나머지 더미)
   data/products.json 상품 (전부 더미, 이름 앞 "(가상)")
   data/reviews.json  후기 (전부 합성, 앱의 핏 계산식과 모순되지 않게 생성)
   data/test_cases.json [테스트] 전용
"""
import json, random, pathlib, math, collections
ROOT = pathlib.Path(__file__).parent.parent
OUT = ROOT / 'data'; OUT.mkdir(exist_ok=True)
rng = random.Random(20261116)
TODAY = '2026-11-16'

STYLES = ['캐주얼', '시티', '시티보이', '클래식', '에스닉', '걸리시', '고프코어', '미니멀', '프레피', '리조트', '레트로', '로맨틱', '스포티', '스트릿', '워크웨어']

# ---------- 브랜드 (이름·공식 사이트는 실제 값, 나머지는 더미) ----------
GM = {'F': (.85, .04, .11), 'f': (.66, .09, .25), 'B': (.50, .13, .37), 'U': (.36, .10, .54), 'u': (.22, .15, .63), 'M': (.14, .46, .40)}
T_S, T_N, T_B = '작게 나옴', '정사이즈', '크게 나옴'
BR = [
 ('무신사 스탠다드', 'MUSINSA STANDARD', 'https://www.musinsa.com/brand/musinsastandard', 'basic', 'U', ['캐주얼', '미니멀', '시티보이'], T_N, '저가'),
 ('유니클로', 'UNIQLO', 'https://www.uniqlo.com/kr', 'basic', 'U', ['미니멀', '캐주얼'], T_N, '저가'),
 ('자라', 'ZARA', 'https://www.zara.com/kr', 'minimal', 'f', ['시티', '미니멀', '리조트'], T_S, '중가'),
 ('H&M', 'H&M', 'https://www2.hm.com/ko_KR/index.html', 'basic', 'B', ['캐주얼', '스트릿', '걸리시'], T_N, '저가'),
 ('코스', 'COS', 'https://www.cosstores.com/kr', 'minimal', 'B', ['미니멀', '시티', '클래식'], T_B, '고가'),
 ('스파오', 'SPAO', 'https://www.spao.co.kr', 'basic', 'U', ['캐주얼', '걸리시', '스포티'], T_N, '저가'),
 ('탑텐', 'TOPTEN10', 'https://www.topten10.goodwearmall.com', 'basic', 'U', ['캐주얼', '클래식'], T_B, '저가'),
 ('에잇세컨즈', '8SECONDS', 'https://www.ssfshop.com/8seconds', 'basic', 'f', ['시티', '캐주얼', '스트릿'], T_N, '저가'),
 ('지오다노', 'GIORDANO', 'https://www.giordano.co.kr', 'basic', 'B', ['캐주얼', '프레피'], T_N, '저가'),
 ('미쏘', 'MIXXO', 'https://www.mixxo.com', 'fem', 'F', ['걸리시', '로맨틱', '시티'], T_S, '중가'),
 ('망고', 'MANGO', 'https://shop.mango.com/kr', 'minimal', 'f', ['시티', '로맨틱', '리조트'], T_S, '중가'),
 ('아디다스', 'ADIDAS', 'https://www.adidas.co.kr', 'sports', 'U', ['스포티', '스트릿', '레트로'], T_N, '중가'),
 ('나이키', 'NIKE', 'https://www.nike.com/kr', 'sports', 'U', ['스포티', '스트릿'], T_N, '중가'),
 ('뉴발란스', 'NEW BALANCE', 'https://www.nbkorea.com', 'sports', 'U', ['스포티', '레트로', '캐주얼'], T_B, '중가'),
 ('푸마', 'PUMA', 'https://kr.puma.com', 'sports', 'U', ['스포티', '스트릿', '레트로'], T_S, '중가'),
 ('휠라', 'FILA', 'https://www.fila.co.kr', 'sports', 'B', ['스포티', '레트로', '걸리시'], T_N, '중가'),
 ('노스페이스', 'THE NORTH FACE', 'https://www.thenorthfacekorea.co.kr', 'outdoor', 'u', ['고프코어', '스트릿', '스포티'], T_B, '고가'),
 ('리바이스', "LEVI'S", 'https://www.levi.co.kr', 'denim', 'B', ['캐주얼', '레트로', '워크웨어'], T_N, '중가'),
 ('커버낫', 'COVERNAT', 'https://covernat.net', 'street', 'U', ['스트릿', '캐주얼', '워크웨어'], T_B, '중가'),
 ('디스이즈네버댓', 'thisisneverthat', 'https://www.thisisneverthat.com', 'street', 'U', ['스트릿', '캐주얼', '시티보이'], T_B, '중가'),
 ('마르디 메크르디', 'MARDI MERCREDI', 'https://www.mardimercredi.com', 'fem', 'f', ['캐주얼', '걸리시', '미니멀'], T_N, '중가'),
 ('아더에러', 'ADER ERROR', 'https://www.adererror.com', 'street', 'U', ['스트릿', '시티보이'], T_B, '고가'),
 ('앤더슨벨', 'ANDERSON BELL', 'https://www.andersonbell.com', 'work', 'U', ['워크웨어', '에스닉', '레트로'], T_B, '고가'),
 ('인사일런스', 'INSILENCE', 'https://www.insilence.co.kr', 'street', 'M', ['스트릿', '시티보이', '캐주얼'], T_B, '중가'),
 ('로우클래식', 'LOW CLASSIC', 'https://www.lowclassic.com', 'minimal', 'f', ['미니멀', '시티', '클래식'], T_N, '고가'),
 ('마뗑킴', 'MATIN KIM', 'https://matinkim.com', 'fem', 'F', ['걸리시', '로맨틱', '시티'], T_S, '중가'),
 ('아크메드라비', 'ACME DE LA VIE', 'https://www.acmedelavie.com', 'street', 'f', ['스트릿', '캐주얼', '걸리시'], T_N, '중가'),
 ('칼하트 WIP', 'CARHARTT WIP', 'https://www.carhartt-wip.com', 'work', 'U', ['워크웨어', '스트릿'], T_B, '고가'),
 ('디키즈', 'DICKIES', 'https://www.dickies.com', 'work', 'M', ['워크웨어', '캐주얼', '스트릿'], T_B, '중가'),
 ('파타고니아', 'PATAGONIA', 'https://www.patagonia.co.kr', 'outdoor', 'U', ['고프코어', '캐주얼'], T_N, '고가'),
 ('아크테릭스', "ARC'TERYX", 'https://arcteryx.com/kr/ko', 'outdoor', 'U', ['고프코어', '시티보이', '미니멀'], T_N, '프리미엄'),
 ('라코스테', 'LACOSTE', 'https://www.lacoste.com/kr', 'preppy', 'B', ['프레피', '클래식', '스포티'], T_N, '고가'),
 ('폴로 랄프 로렌', 'POLO RALPH LAUREN', 'https://www.ralphlauren.co.kr', 'preppy', 'B', ['프레피', '클래식'], T_N, '고가'),
 ('챔피온', 'CHAMPION', 'https://www.champion.com', 'sports', 'U', ['스포티', '스트릿', '캐주얼'], T_B, '중가'),
 ('스톤아일랜드', 'STONE ISLAND', 'https://www.stoneisland.com', 'outdoor', 'M', ['고프코어', '시티보이', '클래식'], T_N, '프리미엄'),
 ('메종 키츠네', 'MAISON KITSUNE', 'https://maisonkitsune.com', 'preppy', 'B', ['프레피', '시티', '클래식'], T_S, '고가'),
 ('아미', 'AMI PARIS', 'https://amiparis.com', 'minimal', 'B', ['시티', '미니멀', '클래식'], T_N, '고가'),
 ('디스커버리 익스페디션', 'DISCOVERY EXPEDITION', 'https://www.discovery-expedition.com', 'outdoor', 'U', ['고프코어', '캐주얼', '스포티'], T_B, '중가'),
 ('코오롱스포츠', 'KOLON SPORT', 'https://www.kolonsport.com', 'outdoor', 'B', ['고프코어', '클래식', '스포티'], T_N, '고가'),
 ('블랙야크', 'BLACKYAK', 'https://www.byc.co.kr', 'outdoor', 'B', ['고프코어', '스포티'], T_N, '중가'),
 ('K2', 'K2', 'https://www.k2.co.kr', 'outdoor', 'B', ['고프코어', '스포티'], T_N, '중가'),
 ('살로몬', 'SALOMON', 'https://www.salomon.com/ko-kr', 'outdoor', 'U', ['고프코어', '스포티', '시티보이'], T_N, '고가'),
 ('젝시믹스', 'XEXYMIX', 'https://www.xexymix.com', 'sports', 'F', ['스포티', '캐주얼'], T_S, '중가'),
 ('안다르', 'ANDAR', 'https://www.andar.co.kr', 'sports', 'F', ['스포티', '미니멀'], T_S, '중가'),
 ('헤지스', 'HAZZYS', 'https://www.hazzys.com', 'preppy', 'B', ['프레피', '클래식'], T_N, '고가'),
 ('빈폴', 'BEANPOLE', 'https://www.beanpole.com', 'preppy', 'B', ['프레피', '클래식', '캐주얼'], T_N, '고가'),
 ('타미힐피거', 'TOMMY HILFIGER', 'https://kr.tommy.com', 'preppy', 'B', ['프레피', '클래식', '스포티'], T_N, '고가'),
 ('게스', 'GUESS', 'https://www.guess.com', 'fem', 'f', ['레트로', '걸리시', '스트릿'], T_S, '고가'),
 ('리', 'LEE', 'https://www.lee.com', 'denim', 'B', ['캐주얼', '레트로', '워크웨어'], T_N, '중가'),
 ('폴햄', 'PAUL HAM', 'https://www.paulham.co.kr', 'basic', 'B', ['캐주얼', '걸리시', '프레피'], T_N, '저가'),
 ('MLB', 'MLB', 'https://www.mlb-korea.com', 'sports', 'U', ['스트릿', '스포티', '레트로'], T_B, '중가'),
 ('타임', 'TIME', 'https://www.thehandsome.com', 'minimal', 'F', ['클래식', '시티', '미니멀'], T_N, '프리미엄'),
 ('예스아이씨', 'YESEYESEE', 'https://www.yeseyesee.com', 'fem', 'F', ['걸리시', '로맨틱', '리조트'], T_S, '중가'),
 ('유니폼브릿지', 'UNIFORM BRIDGE', 'https://uniformbridge.com', 'minimal', 'U', ['미니멀', '캐주얼', '시티보이'], T_N, '중가'),
 ('캘빈클라인', 'CALVIN KLEIN', 'https://www.calvinklein.co.kr', 'minimal', 'B', ['미니멀', '시티'], T_N, '고가'),
 ('스투시', 'STUSSY', 'https://www.stussy.com', 'street', 'U', ['스트릿', '레트로', '캐주얼'], T_B, '중가'),
 ('오베이', 'OBEY', 'https://obeyclothing.com', 'street', 'M', ['스트릿', '레트로'], T_B, '중가'),
 ('바버', 'BARBOUR', 'https://www.barbour.com', 'work', 'M', ['클래식', '워크웨어', '프레피'], T_N, '프리미엄'),
 ('콜롬비아', 'COLUMBIA', 'https://www.columbiakorea.co.kr', 'outdoor', 'B', ['고프코어', '캐주얼'], T_B, '중가'),
 ('데상트', 'DESCENTE', 'https://www.descentekorea.co.kr', 'sports', 'B', ['스포티', '고프코어', '클래식'], T_N, '중가'),
 ('르꼬끄 스포르티브', 'LE COQ SPORTIF', 'https://www.lecoqsportif.com', 'sports', 'B', ['스포티', '레트로', '프레피'], T_N, '중가'),
 ('스노우피크 어패럴', 'SNOW PEAK APPAREL', 'https://www.snowpeak.co.kr', 'outdoor', 'u', ['고프코어', '워크웨어', '에스닉'], T_B, '고가'),
 ('무인양품', 'MUJI', 'https://www.muji.com/kr', 'minimal', 'U', ['미니멀', '캐주얼', '리조트'], T_N, '저가'),
 ('앤아더스토리즈', '& OTHER STORIES', 'https://www.stories.com', 'fem', 'F', ['로맨틱', '에스닉', '리조트'], T_N, '고가'),
]
# 이전 18개 브랜드 사이트 URL은 팀이 이미 정리해 둔 값(raw_data/brands.json)이라 출처를 official_site 로, 나머지는 사이트 확인 전
PREV_SITE = {'유니클로', '자라', 'H&M', '코스', '스파오', '탑텐', '에잇세컨즈', '지오다노', '미쏘', '무신사 스탠다드', '아디다스', '나이키', '망고', '뉴발란스', '푸마', '휠라', '노스페이스', '리바이스'}
TIER = {'저가': .8, '중가': 1.0, '고가': 1.8, '프리미엄': 3.2}

# ---------- 상품 카탈로그 ----------
# (소분류, 카테고리, 태그, 여성 전용?, 소매, 신축성, 기본가(만원), 길이 보정, 핏 가중치(슬림,레귤러,오버))
ALL = 'basic street minimal sports outdoor preppy work denim fem'.split()
CAT = [
 ('티셔츠', '상의', ALL, 0, '반소매', '약간', 3.0, 0, (1, 4, 3)),
 ('크롭 티셔츠', '상의', ['fem', 'street', 'sports'], 1, '반소매', '좋음', 2.6, -14, (5, 3, 1)),
 ('긴소매 티셔츠', '상의', 'basic street minimal sports outdoor preppy work denim'.split(), 0, '긴소매', '약간', 3.4, 0, (1, 4, 3)),
 ('맨투맨', '상의', 'basic street sports preppy work'.split(), 0, '긴소매', '약간', 5.5, 2, (1, 3, 5)),
 ('후드 티셔츠', '상의', 'basic street sports work'.split(), 0, '긴소매', '약간', 6.5, 2, (1, 3, 5)),
 ('셔츠', '상의', 'basic minimal preppy work denim fem'.split(), 0, '긴소매', '없음', 5.0, 6, (1, 4, 3)),
 ('블라우스', '상의', ['fem', 'minimal'], 1, '긴소매', '없음', 4.8, 2, (2, 5, 1)),
 ('니트', '상의', 'basic minimal preppy fem'.split(), 0, '긴소매', '약간', 6.0, -1, (1, 4, 3)),
 ('가디건', '상의', 'basic minimal preppy fem'.split(), 0, '긴소매', '약간', 6.5, 4, (1, 4, 3)),
 ('폴로 셔츠', '상의', 'preppy basic sports'.split(), 0, '반소매', '약간', 5.0, 0, (1, 5, 2)),
 ('슬리브리스', '상의', ['fem', 'sports', 'basic'], 0, '민소매', '좋음', 2.4, -2, (4, 4, 1)),
 ('데님 팬츠', '하의', 'basic street fem minimal work preppy denim'.split(), 0, None, '약간', 6.0, 0, (2, 5, 3)),
 ('슬랙스', '하의', 'basic minimal preppy fem'.split(), 0, None, '약간', 5.5, 0, (2, 5, 2)),
 ('코튼 팬츠', '하의', 'basic minimal preppy work outdoor denim'.split(), 0, None, '약간', 5.0, 0, (1, 5, 3)),
 ('카고 팬츠', '하의', 'street outdoor work'.split(), 0, None, '없음', 6.5, 0, (1, 3, 5)),
 ('조거 팬츠', '하의', 'basic street sports'.split(), 0, None, '좋음', 4.5, -2, (1, 4, 4)),
 ('트레이닝 팬츠', '하의', 'sports street outdoor'.split(), 0, None, '좋음', 4.8, 0, (1, 4, 4)),
 ('숏 팬츠', '하의', 'basic street sports preppy outdoor fem work'.split(), 0, None, '약간', 3.8, -52, (1, 4, 4)),
 ('스커트', '하의', ['fem', 'minimal', 'preppy', 'sports'], 1, None, '약간', 4.6, -30, (3, 5, 1)),
 ('레깅스', '하의', ['sports', 'fem'], 0, None, '좋음', 4.2, 0, (6, 3, 0)),
 ('패딩', '아우터', ALL, 0, '긴소매', '없음', 18, 4, (0, 3, 6)),
 ('숏 패딩', '아우터', 'basic street outdoor sports fem minimal'.split(), 0, '긴소매', '없음', 16, -8, (0, 3, 6)),
 ('블루종', '아우터', 'street basic work preppy'.split(), 0, '긴소매', '없음', 12, -6, (0, 3, 6)),
 ('바람막이', '아우터', 'outdoor sports street basic'.split(), 0, '긴소매', '없음', 9, 0, (0, 4, 5)),
 ('후드 집업', '아우터', 'street sports basic work'.split(), 0, '긴소매', '약간', 7.5, 2, (1, 3, 5)),
 ('플리스 재킷', '아우터', 'outdoor basic street'.split(), 0, '긴소매', '약간', 8.5, 0, (0, 3, 6)),
 ('코트', '아우터', 'basic minimal preppy fem'.split(), 0, '긴소매', '없음', 22, 25, (1, 4, 4)),
 ('트렌치 코트', '아우터', 'minimal preppy fem basic'.split(), 0, '긴소매', '없음', 20, 30, (1, 5, 3)),
 ('블레이저', '아우터', 'minimal preppy basic fem'.split(), 0, '긴소매', '없음', 14, 6, (2, 5, 3)),
 ('데님 재킷', '아우터', 'street work basic denim'.split(), 0, '긴소매', '약간', 10, -4, (1, 4, 4)),
 ('레더 재킷', '아우터', ['street', 'minimal'], 0, '긴소매', '없음', 28, -4, (2, 5, 2)),
 ('트위드 재킷', '아우터', ['fem', 'preppy'], 1, '긴소매', '없음', 16, -2, (2, 5, 2)),
 ('미니 원피스', '원피스', ['fem', 'minimal', 'sports', 'basic'], 1, '반소매', '약간', 5.5, 0, (4, 4, 1)),
 ('롱 원피스', '원피스', ['fem', 'minimal', 'basic', 'preppy'], 1, '반소매', '없음', 7.0, 0, (1, 5, 3)),
 ('셔츠 원피스', '원피스', ['fem', 'minimal', 'basic', 'preppy'], 1, '긴소매', '없음', 6.5, 0, (1, 5, 3)),
 ('니트 원피스', '원피스', ['fem', 'minimal', 'basic'], 1, '긴소매', '좋음', 7.5, 0, (4, 4, 1)),
 ('슬리브리스 원피스', '원피스', ['fem', 'minimal', 'sports'], 1, '민소매', '약간', 5.8, 0, (3, 4, 1)),
]
CATW = {'basic': (.36, .26, .22, .16), 'street': (.38, .28, .32, .02), 'fem': (.30, .22, .14, .34), 'minimal': (.28, .24, .24, .24), 'outdoor': (.26, .22, .50, .02),
        'sports': (.38, .32, .26, .04), 'preppy': (.34, .25, .25, .16), 'work': (.34, .30, .36, 0), 'denim': (.30, .38, .32, 0)}
ADJ = {'basic': ['베이직', '에센셜', '데일리', '소프트', '릴렉스드', '컴포트', '클린'], 'street': ['오버사이즈', '와이드', '그래픽', '워싱', '빈티지', '로고', '헤비'],
       'fem': ['페미닌', '리본', '퍼프', '스퀘어넥', '플레어', '러블리', '소프트'], 'minimal': ['클린', '모던', '미니멀', '세미오버', '텍스처드', '심플', '라이트'],
       'outdoor': ['테크', '라이트웨이트', '트레일', '기능성', '방풍', '써모', '하이킹'], 'sports': ['퍼포먼스', '에어로', '드라이핏', '트랙', '클럽', '러닝', '액티브'],
       'preppy': ['클래식', '옥스포드', '케이블', '스트라이프', '컬리지', '헤리티지', '체크'], 'work': ['워크', '헤비', '더블니', '치노', '오버롤', '유틸리티', '캔버스'],
       'denim': ['워시드', '인디고', '스트레이트', '빈티지', '데일리', '클래식', '와이드']}
COLORS = {'basic': ['블랙', '화이트', '네이비', '그레이', '베이지', '아이보리', '카키', '차콜'], 'street': ['블랙', '화이트', '차콜', '카키', '그레이', '브라운', '네이비', '베이지'],
          'fem': ['블랙', '화이트', '아이보리', '핑크', '베이지', '브라운', '스카이블루', '와인', '민트'], 'minimal': ['블랙', '화이트', '아이보리', '베이지', '그레이', '네이비', '차콜', '브라운'],
          'outdoor': ['블랙', '네이비', '카키', '그레이', '오렌지', '그린', '차콜', '베이지'], 'sports': ['블랙', '화이트', '네이비', '그레이', '블루', '레드', '차콜', '그린'],
          'preppy': ['네이비', '화이트', '베이지', '그린', '와인', '블루', '아이보리', '그레이'], 'work': ['블랙', '카키', '브라운', '베이지', '네이비', '차콜', '그린'],
          'denim': ['진청', '연청', '블랙', '그레이', '화이트', '베이지', '네이비']}

# ---------- 앱의 핏 모델(src/app1.js)과 같은 상수 ----------
SZ = ['XS', 'S', 'M', 'L', 'XL']
PARTS = {'상의': ['어깨', '가슴', '소매', '총장'], '아우터': ['어깨', '가슴', '소매', '총장'], '하의': ['허리', '힙', '허벅지', '총장'], '원피스': ['어깨', '가슴', '허리', '총장']}
TARGET = {'상의': {'어깨': 1.5, '가슴': 14, '소매': 4}, '아우터': {'어깨': 3, '가슴': 22, '소매': 6}, '하의': {'허리': 4, '힙': 7, '허벅지': 5}, '원피스': {'어깨': 1.5, '가슴': 12, '허리': 14}}
PREF_K = {'슬림 핏': -1, '기본 핏': 0, '여유 핏': 1.2}
PREF_SCALE = {'어깨': 1.2, '가슴': 5, '허리': 3, '힙': 3, '허벅지': 2.5, '소매': 0}
TOL = {'어깨': 1.6, '가슴': 4.5, '허리': 3, '힙': 3, '허벅지': 2.5, '소매': 2.5}
W = {'상의': {'어깨': .25, '가슴': .75}, '아우터': {'어깨': .3, '가슴': .7}, '하의': {'허리': .4, '힙': .4, '허벅지': .2}, '원피스': {'어깨': .15, '가슴': .45, '허리': .4}}
INC = {'어깨': 1.2, '가슴': 6, '허리': 4, '힙': 4, '허벅지': 3, '소매': 1, '총장': 1.5}
LENR = {'상의': .378, '아우터': .397, '원피스': .6, '하의': .6}; LENTOL = {'상의': 3.5, '아우터': 5, '원피스': 6, '하의': 4}
r1 = lambda x: round(x * 2) / 2


def body(h, w):
    chest = h * .5 + (w - 52) * .6 + 2; hip = h * .575 + (w - 52) * .6
    return {'h': h, '어깨': h * .238, '가슴': chest, '허리': h * .4 + (w - 52) * .6, '힙': hip, '허벅지': hip * .595, '소매': h * .3375}


REF = {'여성': (163, 54), '남성': (176, 72), '공용': (170, 62)}
FITADJ = {'슬림': -1.0, '레귤러': 0.0, '오버': 1.6}
OVER_LEN = {'오버': 3, '슬림': 0, '레귤러': 0}
DRESS_LEN = {'미니 원피스': .5, '롱 원피스': .8, '셔츠 원피스': .62, '니트 원피스': .6, '슬리브리스 원피스': .58}


def wchoice(items, weights):
    return rng.choices(items, weights=weights, k=1)[0]


# ---------- 브랜드 ----------
brands = []
for i, (kr, en, url, fl, gm, sty, tend, tier) in enumerate(BR, 1):
    brands.append({'brand_id': f'BR{i:03d}', 'name_kr': kr, 'name_en': en, 'site_url': url, 'size_guide_url': None, 'genders': [], 'categories': [], 'styles': sty,
                   'size_tendency': tend, 'price_tier': tier,
                   'meta': {'source': 'official_site' if kr in PREV_SITE else 'manual', 'source_url': url, 'real': ['name_kr', 'name_en', 'site_url'],
                            'dummy': ['styles', 'size_tendency', 'price_tier', 'genders', 'categories'], 'site_verified': False, 'api': False, 'collected_at': TODAY}})

# ---------- 상품 ----------
products = []; pc = 0
SIZES_F = ['XS', 'S', 'M', 'L', 'XL']
for bi, (kr, en, url, fl, gm, sty, tend, tier) in enumerate(BR):
    bid = brands[bi]['brand_id']; n = 10 + rng.choice([0, 0, 1, 1, 2, 3]); used = set()
    catw = CATW[fl]; subs = [c for c in CAT if fl in c[2]]
    bias = {'작게 나옴': -1, '정사이즈': 0, '크게 나옴': 1}[tend]
    tries = 0
    while sum(1 for p in products if p['brand_id'] == bid) < n and tries < 400:
        tries += 1
        cat = wchoice(['상의', '하의', '아우터', '원피스'], catw)
        cand = [c for c in subs if c[1] == cat]
        if not cand: continue
        sub = rng.choice(cand); sname, _, _, fonly, sleeve, stretch, price0, ladj, fw = sub
        g = wchoice(['여성', '남성', '공용'], GM[gm])
        if fonly: g = '여성'
        if sname == '레깅스' and g == '남성': g = '공용'
        if cat == '원피스': g = '여성'
        adj = rng.choice(ADJ[fl]); nm = f'(가상) {adj} {sname}'
        if (nm, g) in used: continue
        used.add((nm, g)); pc += 1; pid = f'P{pc:04d}'
        fit = wchoice(['슬림', '레귤러', '오버'], fw)
        if fl in ('street', 'sports') and rng.random() < .35: fit = '오버'
        sizes = SIZES_F if g in ('여성', '공용') else (SIZES_F if rng.random() < .25 else ['S', 'M', 'L', 'XL'])
        rh, rw = REF[g]; bv = body(rh, rw); chart = {}
        bb = {'작게 나옴': -2.0, '정사이즈': 0.0, '크게 나옴': 3.0}[tend]
        base = {}
        for p in PARTS[cat]:
            if p == '총장':
                if cat == '하의': v = rh * LENR['하의'] + ladj
                elif cat == '원피스': v = rh * DRESS_LEN[sname]
                else: v = rh * LENR[cat] + ladj + OVER_LEN[fit]
                v += rng.gauss(0, 1.2)
            else:
                e = TARGET[cat][p] + FITADJ[fit] * (PREF_SCALE[p] if PREF_SCALE[p] else 2.0) * (1.0 if p != '소매' else 1.0)
                v = bv[p] + e + (bb * (1 if p in ('가슴', '허리', '힙', '허벅지') else .25)) + rng.gauss(0, 1.0)
            base[p] = v
        for s in sizes:
            d = SZ.index(s) - 2; chart[s] = {p: r1(base[p] + INC[p] * d) for p in PARTS[cat]}
        pr = price0 * 10000 * TIER[tier] * rng.uniform(.78, 1.3)
        pr = int(round(pr / 1000) * 1000); pr = max(pr - 100, 9900) if rng.random() < .6 else max(pr, 9000)
        cols = rng.sample(COLORS[fl], rng.randint(2, 5))
        rd = f'{rng.choice([2025, 2025, 2026, 2026, 2026])}-{rng.randint(1, 12):02d}-{rng.randint(1, 28):02d}'
        if rd > '2026-10-31': rd = '2026-10-15'
        products.append({'product_id': pid, 'brand_id': bid, 'name': nm, 'category': cat, 'sub_category': sname, 'gender': g, 'fit_type': fit, 'sleeve_type': sleeve, 'stretch': stretch,
                         'price': pr, 'colors': cols, 'sizes': sizes, 'size_chart': chart, 'release_date': rd, 'product_url': None,
                         'meta': {'source': 'generated', 'source_url': None, 'real': [], 'dummy': ['name', 'sub_category', 'gender', 'fit_type', 'sleeve_type', 'stretch', 'price', 'colors', 'sizes', 'size_chart', 'release_date'], 'api': False, 'collected_at': TODAY}})
    for b in [brands[bi]]:
        ps = [p for p in products if p['brand_id'] == bid]
        gs = set()
        for p in ps:
            if p['gender'] == '공용': gs |= {'여성', '남성'}
            else: gs.add(p['gender'])
        b['genders'] = [x for x in ['여성', '남성'] if x in gs]
        b['categories'] = [c for c in ['상의', '하의', '아우터', '원피스'] if any(p['category'] == c for p in ps)]

# ---------- 리뷰어 풀 ----------
ADJN = ['조용한', '느긋한', '바쁜', '귀여운', '단단한', '포근한', '가벼운', '든든한', '졸린', '반짝이는', '차분한', '엉뚱한', '빠른', '수줍은', '말랑한', '씩씩한']
NOUN = ['고양이', '토끼', '여우', '곰돌이', '다람쥐', '펭귄', '수달', '참새', '오리', '판다', '햄스터', '사슴', '고래', '너구리', '강아지', '부엉이']
HP = ['mj', 'sy', 'hy', 'jw', 'dh', 'yj', 'sh', 'jh', 'eun', 'min', 'soo', 'ara', 'jin', 'ha', 'woo', 'da']
users = []; seen_h = set()
for i in range(1, 1601):
    g = '여성' if rng.random() < .62 else '남성'
    if g == '여성': h = int(round(rng.gauss(162, 5.2))); bmi = rng.gauss(20.8, 2.4); h = min(max(h, 148), 178)
    else: h = int(round(rng.gauss(175, 5.5))); bmi = rng.gauss(23.0, 2.7); h = min(max(h, 160), 192)
    w = int(round(bmi * (h / 100) ** 2)); w = min(max(w, 38 if g == '여성' else 50), 105)
    pref = wchoice(['슬림 핏', '기본 핏', '여유 핏'], (.2, .55, .25))
    while True:
        hd = f'{rng.choice(HP)}{rng.randint(10, 99)}_{rng.randint(1000, 9999)}'
        if hd not in seen_h: seen_h.add(hd); break
    users.append({'id': f'U{i:04d}', 'nick': f'{rng.choice(ADJN)}{rng.choice(NOUN)}{rng.randint(10, 99)}', 'handle': hd, 'g': g, 'h': h, 'w': w, 'pref': pref})
UF = [u for u in users if u['g'] == '여성']; UM = [u for u in users if u['g'] == '남성']

# ---------- 후기 ----------
PNOUN = {'어깨': '어깨가', '가슴': '가슴이', '소매': '소매가', '허리': '허리가', '힙': '힙이', '허벅지': '허벅지가'}
EXTRA = {'상의': ['원단이 부드러워요.', '색감이 사진이랑 비슷해요.', '세탁 후에도 크게 변하지 않았어요.', '두께감은 적당해요.', '데일리로 입기 좋아요.', '봉제가 깔끔해요.'],
         '하의': ['원단이 생각보다 탄탄해요.', '허리 밴딩이 편해요.', '색이 예뻐요.', '세탁 후에도 형태가 유지돼요.', '핏이 깔끔하게 떨어져요.', '데일리로 자주 입어요.'],
         '아우터': ['보온성이 괜찮아요.', '안감이 부드러워요.', '무게가 가벼워서 좋아요.', '레이어드하기 좋아요.', '마감이 깔끔해요.', '활용도가 높아요.'],
         '원피스': ['원단이 가볍고 편해요.', '실루엣이 예뻐요.', '사진이랑 색이 비슷해요.', '비침은 거의 없어요.', '하객룩으로도 입을 만해요.', '데일리로 입기 좋아요.']}
CLOSE_OK = ['착용 사이즈 그대로 추천해요.', '이 사이즈 추천합니다.', '재구매 의사 있어요.', '만족스러워요.']
THICK = ['얇아요', '적당한 두께', '도톰해요']; TOUCH = ['부드러워요', '까슬해요', '뻣뻣해요', '따뜻해요', '시원해요']; SITU = ['데일리', '출근', '운동', '하객·모임']; REASON = ['비슷한 체형 후기 보고', '브랜드 신뢰', '핏 사진 참고']
STRK = {'없음': '안 늘어나요', '약간': '적당히 늘어나요', '좋음': '잘 늘어나요'}


def intended(cat, p, fit):  # 상품이 의도한 핏(슬림/오버)을 반영한 기준 여유분
    return TARGET[cat][p] + FITADJ[fit] * (PREF_SCALE[p] if PREF_SCALE[p] else 2.0)


def score(cat, g, bv, pref, fit):
    s = 0
    for p in PARTS[cat]:
        if p == '총장': continue
        d = (g[p] - bv[p]) - (intended(cat, p, fit) + PREF_K[pref] * PREF_SCALE[p])
        if W[cat].get(p): s += W[cat][p] * abs(d) / TOL[p]
    return s


def make_review(prod, rid, u, dt):
    cat = prod['category']; bv = body(u['h'], u['w']); sizes = prod['sizes']
    sc = {s: score(cat, prod['size_chart'][s], bv, u['pref'], prod['fit_type']) for s in sizes}
    best = min(sizes, key=lambda s: sc[s]); bi = sizes.index(best); r = rng.random()
    buy = best if r < .66 else sizes[max(0, min(len(sizes) - 1, bi + rng.choice([-1, 1])))] if r < .94 else rng.choice(sizes)
    g = prod['size_chart'][buy]; fd = {}; signed = 0; verdict = {}
    for p in PARTS[cat]:
        if p == '총장':
            exp = u['h'] * LENR[cat]; d = g[p] - exp; t = LENTOL[cat]
            v = 'short' if d < -t else 'long' if d > t else 'ok'
            verdict[p] = v; fd[p] = {'short': '타이트', 'ok': '적당', 'long': '여유'}[v]
        else:
            d = (g[p] - bv[p]) - intended(cat, p, prod['fit_type']); t = TOL[p]
            v = 'tight' if d < -t else 'loose' if d > t else 'ok'
            verdict[p] = v; fd[p] = {'tight': '타이트', 'ok': '적당', 'loose': '여유'}[v]
            if W[cat].get(p): signed += W[cat][p] * d / t
    op = '작은 편' if signed <= -.9 else '큰 편' if signed >= .9 else '정사이즈'
    lv = verdict['총장']; lo = {'short': '짧은 편', 'ok': '적당', 'long': '긴 편'}[lv]
    mis = abs(sizes.index(buy) - bi)
    rt = 5 if rng.random() < .45 else 4
    if mis: rt -= rng.choice([1, 1, 2])
    if op != '정사이즈' and rng.random() < .35: rt -= 1
    if rng.random() < .06: rt -= 1
    rt = max(1, min(5, rt))
    # 텍스트
    intro = rng.choice([f'{u["h"]}cm/{u["w"]}kg {buy} 착용했어요.', f'키 {u["h"]}에 {u["w"]}kg, {buy} 사이즈 샀어요.', f'{u["h"]}/{u["w"]} {buy} 입었습니다.'])
    sizeline = {'작은 편': ['생각보다 작게 나왔어요.', '정사이즈인 줄 알았는데 꽤 작아요.', '좀 타이트하게 입는 느낌이에요.'], '정사이즈': ['정사이즈로 잘 맞아요.', '딱 적당해요.', '평소 사이즈 그대로 샀는데 맞아요.'],
                '큰 편': ['생각보다 크게 나왔어요.', '넉넉하다 못해 좀 커요.', '여유 있게 입기엔 좋은데 정핏은 아니에요.']}[op]
    parts = []
    for p in PARTS[cat]:
        if p == '총장': continue
        if verdict[p] == 'tight': parts.append(f'{PNOUN[p]} ' + rng.choice(['좀 끼어요', '꽉 껴요', '타이트해요']))
        elif verdict[p] == 'loose': parts.append(f'{PNOUN[p]} ' + rng.choice(['넉넉해요', '남는 편이에요', '여유 있어요']))
    rng.shuffle(parts); parts = parts[:2]
    lenline = {'short': '기장은 짧은 편이에요.', 'ok': '기장은 적당해요.', 'long': '기장은 긴 편이에요.'}[lv]
    close = rng.choice(CLOSE_OK) if mis == 0 else (f'{best}가 더 맞았을 것 같아요.' if rng.random() < .8 else '사이즈 선택이 조금 아쉬워요.')
    seg = [intro, rng.choice(sizeline)] + ([', '.join(parts) + '.'] if parts else []) + [lenline] + ([rng.choice(EXTRA[cat])] if rng.random() < .65 else []) + [close]
    if rng.random() < .15: seg = [intro, rng.choice(sizeline), close]
    kw = ['정사이즈 추천' if (op == '정사이즈') else '한 치수 업 추천' if op == '작은 편' else '한 치수 다운 추천']
    kmap = {('어깨', 'tight'): '어깨 좁아요', ('어깨', 'loose'): '어깨 넉넉해요', ('가슴', 'tight'): '가슴 답답해요', ('허리', 'tight'): '허리 꽉 껴요', ('허리', 'loose'): '허리 남아요', ('힙', 'tight'): '힙 꽉 껴요', ('허벅지', 'tight'): '허벅지 꽉 껴요'}
    for p in PARTS[cat]:
        k = kmap.get((p, verdict[p]))
        if k: kw.append(k)
    if lv == 'long': kw.append('기장 길어요')
    if lv == 'short': kw.append('기장 짧아요')
    kw.append({'슬림': rng.choice(['슬림해요', '몸에 붙어요']), '레귤러': '레귤러해요', '오버': rng.choice(['루즈해요', '박시해요'])}[prod['fit_type']])
    for pool in (THICK, TOUCH, SITU, REASON):
        if rng.random() < .35: kw.append(rng.choice(pool))
    if rng.random() < .3: kw.append(STRK[prod['stretch']])
    kw = list(dict.fromkeys(kw))[:6]
    return {'review_id': rid, 'product_id': prod['product_id'], 'reviewer_id': u['id'], 'reviewer_nick': u['nick'], 'reviewer_handle': u['handle'], 'review_date': dt, 'rating': rt,
            'height_cm': u['h'], 'weight_kg': u['w'], 'fit_preference': u['pref'], 'purchased_size': buy, 'color': rng.choice(prod['colors']), 'size_opinion': op, 'length_opinion': lo,
            'fit_details': fd, 'fitted_size': best, 'review_text': ' '.join(seg), 'keywords': kw, 'data_type': 'dummy',
            'meta': {'source': 'generated', 'real': []}}


def d_between(a, b):
    import datetime as D
    d0 = D.date.fromisoformat(a); d1 = D.date.fromisoformat(b); return (d0 + D.timedelta(days=rng.randint(0, max(0, (d1 - d0).days)))).isoformat()


reviews = []; rc = 0; usedby = collections.defaultdict(set)
for p in products:
    r = rng.random(); n = rng.randint(5, 6) if r < .60 else rng.randint(6, 8) if r < .92 else rng.randint(10, 16)
    pool_f = {'여성': .93, '남성': .06, '공용': .58}[p['gender']]
    for _ in range(n):
        for _t in range(30):
            u = rng.choice(UF if rng.random() < pool_f else UM)
            if u['id'] not in usedby[p['product_id']]: break
        usedby[p['product_id']].add(u['id']); rc += 1
        reviews.append(make_review(p, f'R{rc:05d}', u, d_between(max(p['release_date'], '2025-06-01'), '2026-11-15')))
reviews.sort(key=lambda x: (x['review_date'], x['review_id']))

# ---------- 테스트 파일 ([테스트] 접두어, 앱 기본 화면에서는 로드하지 않음) ----------
test = {'note': '교안 9주차 테스트용. 본 데이터와 섞지 않는다. 앱 기본 화면은 로드하지 않음.',
        'products': [
            {'product_id': 'T0001', 'brand_id': 'BR001', 'name': '[테스트] 사이즈표 없음 티셔츠', 'category': '상의', 'sub_category': '티셔츠', 'gender': '공용', 'fit_type': '레귤러', 'sleeve_type': '반소매', 'stretch': '약간', 'price': 19900, 'colors': ['블랙'], 'sizes': ['M'], 'size_chart': None, 'release_date': '2026-10-01', 'product_url': None, 'meta': {'source': 'generated', 'source_url': None, 'real': [], 'dummy': ['all'], 'api': False, 'collected_at': TODAY}},
            {'product_id': 'T0002', 'brand_id': 'BR002', 'name': '[테스트] ' + '이름이 아주아주 긴 상품 ' * 6, 'category': '아우터', 'sub_category': '패딩', 'gender': '공용', 'fit_type': '오버', 'sleeve_type': '긴소매', 'stretch': '없음', 'price': 1990000, 'colors': ['블랙'], 'sizes': ['S', 'M', 'L', 'XL'], 'size_chart': None, 'release_date': '2026-10-01', 'product_url': None, 'meta': {'source': 'generated', 'source_url': None, 'real': [], 'dummy': ['all'], 'api': False, 'collected_at': TODAY}}],
        'reviews': [],
        'zero_result_filters': [
            {'desc': '원피스 + 남성', 'filter': {'category': '원피스', 'gender': '남성'}},
            {'desc': '아우터 + 최대 가격 10,000원', 'filter': {'category': '아우터', 'price_max': 10000}},
            {'desc': '존재하지 않는 검색어', 'filter': {'q': 'zzzzzz'}},
            {'desc': '키 148cm 이하 + 몸무게 105kg 이상 후기', 'filter': {'review': {'h': '<=148', 'w': '>=105'}}}]}

json.dump(brands, open(OUT / 'brands.json', 'w'), ensure_ascii=False, indent=1)
json.dump(products, open(OUT / 'products.json', 'w'), ensure_ascii=False, indent=1)
with open(OUT / 'reviews.json', 'w') as f:
    f.write('[\n' + ',\n'.join(json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in reviews) + '\n]\n')
json.dump(test, open(OUT / 'test_cases.json', 'w'), ensure_ascii=False, indent=1)

c = collections.Counter
print('brands', len(brands), 'products', len(products), 'reviews', len(reviews))
print('per brand min/max', min(c(p['brand_id'] for p in products).values()), max(c(p['brand_id'] for p in products).values()))
print('per product reviews min/max/avg', min(c(r['product_id'] for r in reviews).values()), max(c(r['product_id'] for r in reviews).values()), round(len(reviews) / len(products), 1))
print(c(p['gender'] for p in products), c(p['category'] for p in products))
print('style coverage', {s: sum(1 for b in brands if s in b['styles']) for s in STYLES})
print('rating', sorted(c(r['rating'] for r in reviews).items()), c(r['size_opinion'] for r in reviews))
print('mismatch buy!=best', round(sum(1 for r in reviews if r['purchased_size'] != r['fitted_size']) / len(reviews), 2))
