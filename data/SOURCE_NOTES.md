# Local Data Source Notes

이 MVP는 Supabase 업로드 없이 로컬 파일로 데이터를 수집·정규화한다.

## 수집 파일

- `data/raw/*.html`: 공식 웹페이지 원문 HTML
- `data/sources.json`: 수집 출처, HTTP 상태, 원문 파일 위치
- `data/impact-items.json`: 앱 API가 읽는 정규화 생활영향 데이터

## 활용 출처

- 달서구청 고시공고: https://dalseo.daegu.kr/index.do?menu_id=10000104
- 달서구 도시관리계획/새올 고시공고 상세: https://eminwon.dalseo.daegu.kr/
- 달서구의회 영상회의록: http://tv.dalseocouncil.daegu.kr/
- 대구교통종합정보: https://car.daegu.go.kr/
- 대구 주차정보: https://dgparking.daegu.go.kr/
- 생활안전지도: https://www.safemap.go.kr/
- 공공데이터포털: https://www.data.go.kr/

## 현재 정규화 범위

- 교통통제·혼잡 영향권
- 공영주차장·생활주차 영향권
- 무더위쉼터·복지시설 접근 영향권
- 공공시설 혼잡·접근 영향권
- 학교·전통시장 주변 보행안전 영향권
- 하천 주변 환경·악취 민원 영향권

## 한계

- 일부 공식 사이트는 TLS 인증서 또는 동적 화면 문제로 원문 목록 파싱이 제한된다.
- 현재 좌표는 MVP 시연을 위한 생활권 중심 좌표이며, 실제 서비스에서는 도로명주소 API 또는 VWorld 지오코딩으로 자동 보정해야 한다.
- `impact_radius_m`는 공공데이터의 위치와 생활영향 성격을 바탕으로 둔 MVP 추정값이다.
