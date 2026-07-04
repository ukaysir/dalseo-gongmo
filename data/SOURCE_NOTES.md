# Local Data Source Notes

이 MVP는 로컬 파일로 데이터를 수집·정규화한 뒤 Supabase에 동기화한다. 런타임은 Supabase를 먼저 읽고, 설정이 없으면 로컬 JSON으로 fallback하며, 사용 가능한 공공 API 결과를 검색 응답에 추가 병합한다.

## 수집 파일

- `data/sources.json`: 수집 출처, HTTP 상태, 원문 파일 위치
- `data/source-catalog.json`: 수집 대상 출처, 예상 필드, 수집 리스크
- `data/collection-report.json`: 수집 결과, 카테고리별 건수, 검증 요약
- `data/impact-items.json`: 앱 API가 읽는 정규화 생활영향 데이터

재생성 가능한 원문 HTML과 심화 수집 산출물은 Git에 커밋하지 않는다.

## 런타임 연결 API

- 대구광역시_돌발 교통정보 조회 서비스(신)
  - Endpoint: `https://apis.data.go.kr/6270000/service/rest/dgincident`
  - 사용: 사고, 공사, 행사, 기상 등 돌발 교통 상황을 `openapi_live` 생활영향 항목으로 변환
- 대구광역시_교통소통정보(신)
  - Endpoint: `https://apis.data.go.kr/6270000/service/rest1/linkspeed`
  - 사용: 달서구 주요 장소와 매칭되는 서행 구간만 교통 영향 항목으로 변환
- 대구광역시 달서구 교통 데이터 API
  - Base Endpoint: `https://apis.data.go.kr/3470000/dalseoTransport`
  - 상태: 어린이보호구역, 주차장, 불법주정차, 노인장애인보호구역 데이터를 정기 동기화 후보로 관리한다. 제공된 키로 접근 제한이 확인되어 현재 런타임 병합에는 포함하지 않는다.

## 활용 출처

- 달서구청 고시공고: https://dalseo.daegu.kr/index.do?menu_id=10000104
- 달서구 공지사항: https://www.dalseo.daegu.kr/index.do?menu_id=10000102
- 달서구 구민참여·행사·공모 정보: https://www.dalseo.daegu.kr/index.do?menu_id=10000106
- 달서구 행사·강좌: https://www.dalseo.daegu.kr/index.do?menu_id=00001851
- 달서구소식지: https://www.dalseo.daegu.kr/index.do?menu_id=00000682
- 달서구 정책연구용역 결과: https://www.dalseo.daegu.kr/index.do?menu_id=00002552
- 달서구 감사결과 공개: https://www.dalseo.daegu.kr/index.do?menu_id=10000219
- 달서구 주차장 현황: https://www.dalseo.daegu.kr/index.do?menu_id=20000380
- 달서구 보건소 공지사항: https://www.dalseo.daegu.kr/healthcenter/index.do?menu_id=30001083
- 달서구 보건소 의료기관 안내: https://www.dalseo.daegu.kr/healthcenter/index.do?menu_id=00002665
- 달서구 감염병 알림: https://www.dalseo.daegu.kr/healthcenter/index.do?menu_id=00004251
- 달서구의회 영상회의록: http://tv.dalseocouncil.daegu.kr/
- 대구교통종합정보: https://car.daegu.go.kr/
- 대구광역시 통합주차정보시스템: https://pis.daegu.go.kr/
- 대구광역시 무더위 쉼터: https://www.daegu.go.kr/safety/index.do?menu_id=00934271
- 생활안전지도: https://www.safemap.go.kr/
- 공공데이터포털: https://www.data.go.kr/
- 대구광역시 달서구_공영주차장 운영 현황: https://www.data.go.kr/data/15110071/fileData.do?recommendDataYn=Y
- 대구광역시 달서구_민영주차장 운영 현황: https://www.data.go.kr/data/15110080/fileData.do
- 대구광역시 달서구_개방공유주차장 운영 현황: https://www.data.go.kr/data/15110065/fileData.do
- 대구광역시 달서구_개발행위허가정보: https://www.data.go.kr/data/15099461/fileData.do
- 대구광역시_돌발 교통정보 조회 서비스: https://www.data.go.kr/data/15126267/openapi.do
- 대구광역시_교통소통정보: https://www.data.go.kr/data/15126266/openapi.do
- 대구광역시 달서구_어린이보호구역 현황: https://www.data.go.kr/data/15110063/fileData.do?recommendDataYn=Y
- 대구광역시 달서구_노인보호구역 현황: https://www.data.go.kr/data/15110064/fileData.do
- 대구광역시 달서구_CCTV 설치 위치: https://www.data.go.kr/data/15083776/fileData.do
- 대구광역시_어린이 보호구역 위험요소 조회 서비스: https://www.data.go.kr/data/15097855/openapi.do
- 대구광역시 달서구_경로당 현황: https://www.data.go.kr/data/3040548/fileData.do
- 전국무더위쉼터표준데이터: https://www.data.go.kr/data/15013199/standard.do
- 전국마을회관및경로당표준데이터: https://www.data.go.kr/data/15114136/standard.do
- 대구광역시 달서구_문화시설현황: https://www.data.go.kr/data/15077166/fileData.do
- 대구광역시 달서구_비상대피시설: https://www.data.go.kr/data/15136227/fileData.do?recommendDataYn=Y
- 대구광역시 달서구_계약현황: https://www.data.go.kr/data/15063250/fileData.do
- 대구광역시 달서구_공공데이터 목록: https://www.data.go.kr/data/15136269/fileData.do?recommendDataYn=Y
- 한국환경공단_에어코리아_대기오염정보: https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15073861
- D-데이터허브 달서구 의안정보: https://data.daegu.go.kr/open/data/dataView.do?dataSetDetailId=150380741c00e601efe4e&dataSetId=15038074&provdMethod=FILE
- D-데이터허브 달서구 의료기관: https://data.daegu.go.kr/open/data/dataView.do?dataSetDetailId=3040172d369e45fa690&dataSetId=3040172&provdMethod=FILE
- D-데이터허브 달서구 장애인 관련 시설: https://data.daegu.go.kr/open/data/dataView.do?dataSetDetailId=3073036d9ad12dc000d&dataSetId=3073036&provdMethod=FILE
- D-데이터허브 달서구 체육시설: https://data.daegu.go.kr/open/data/dataView.do?dataSetDetailId=150532712b1db1c6b742a&dataSetId=15053271&provdMethod=FILE
- D-데이터허브 달서구 석면조사대상 건축물: https://data.daegu.go.kr/open/data/dataView.do?dataSetDetailId=304728018bcfc0904343_201602191519&dataSetId=3047280&provdMethod=FILE
- 대구광역시 고시공고: https://www.daegu.go.kr/index.do?menu_id=00940170&menu_link=%2Ffront%2FdaeguSidoGosi%2FdaeguSidoGosiList.do
- 대구 도시관리계획: https://www.daegu.go.kr/build/index.do?menu_id=00933156
- 대구 공공심야약국: https://www.daegu.go.kr/health/index.do?menu_id=00933164
- 대구 소아 야간·휴일 진료기관: https://www.daegu.go.kr/health/index.do?menu_id=00936060

## 현재 정규화 범위

- 교통통제·혼잡 영향권
- 공영주차장·생활주차 영향권
- 무더위쉼터·복지시설 접근 영향권
- 공공시설 혼잡·접근 영향권
- 학교·전통시장 주변 보행안전 영향권
- 하천 주변 환경·악취 민원 영향권
- 전통시장·행사 혼잡 영향권
- 통학로·어린이보호구역 안전 영향권
- 경로당·무더위쉼터·복지 접근성 영향권
- 공공시설·문화시설 방문 혼잡 영향권
- 개발행위허가·도시계획 영향권
- 계약현황 기반 공사 가능 영향권
- CCTV·노인보호구역 기반 생활안전 영향권
- 보건소·의료기관·심야약국 접근 영향권
- 소식지·정책연구·감사결과 기반 장기 정책 맥락
- D-데이터허브 파일형 공공데이터 메타데이터

## 심화 수집 결과

`npm run collect:deep -- --minutes=20` 또는 `node scripts/deep-collect-web.mjs --minutes=20`은 기존 정규화 데이터를 덮어쓰지 않고 별도 증거 파일을 생성한다.

- `data/deep-collection-report.json`: 수집 시작/종료 시각, 실제 소요 시간, 수집 페이지 수, 링크 수, 다운로드 후보 수
- `data/deep-links.json`: 수집된 링크 인벤토리
- `data/deep-raw/*.html`: 심화 수집 원문 HTML

2026-07-04 실행 기준 심화 수집은 1,202초 동안 210페이지, 22,787개 링크, 다운로드 후보 51개를 수집했다.

## 검증 규칙

`npm run validate:data`는 다음 항목을 확인한다.

- 필수 필드 누락 여부
- 카테고리 enum 일치 여부
- `source_id`와 `data/sources.json` 연결 여부
- 좌표가 달서구 인근 범위에 있는지
- 날짜 형식과 시작/종료일 순서
- 영향 태그 누락/중복 여부
- 원문 URL 절대 경로 여부
- 수집 출처의 HTTP 상태와 원문 미리보기 품질

## 한계

- 일부 공식 사이트는 TLS 인증서, 동적 화면, 공공데이터포털 활용신청 문제로 행 단위 원자료 자동 수집이 제한된다.
- 공공데이터포털 API/파일 원자료 중 일부는 인증키 또는 다운로드 링크 처리가 필요하다. 현재는 공식 메타데이터와 출처 URL을 보존하고, 달서구 생활권 중심 레퍼런스 데이터로 정규화한다.
- 현재 좌표는 MVP 시연을 위한 생활권 중심 좌표이며, 실제 서비스에서는 도로명주소 API 또는 VWorld 지오코딩으로 자동 보정해야 한다.
- `impact_radius_m`는 공공데이터의 위치와 생활영향 성격을 바탕으로 둔 MVP 추정값이다.
- 요약은 이해를 돕기 위한 참고 정보이며, 최종 내용은 원문과 담당 부서 확인이 필요하다.
