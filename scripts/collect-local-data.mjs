import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, "data");
const rawDir = path.join(dataDir, "raw");
const collectedAt = new Date().toISOString();

const sourceCatalog = [
  {
    id: "dalseo-notices",
    name: "달서구 고시공고",
    url: "https://www.dalseo.daegu.kr/index.do?menu_id=10000104",
    kind: "official_html",
    category: "public_notice",
    priority: "high",
    expected_fields: ["제목", "공고일", "담당부서", "첨부파일", "원문 URL"],
    collection_risk: "게시판 목록과 첨부파일 상세 파싱이 추가로 필요합니다.",
    make_collected_item: true,
  },
  {
    id: "dalseo-general-notices",
    name: "달서구 공지사항",
    url: "https://www.dalseo.daegu.kr/index.do?menu_id=10000102",
    kind: "official_html",
    category: "public_notice",
    priority: "high",
    expected_fields: ["제목", "등록일", "담당부서", "첨부파일", "원문 URL"],
    collection_risk: "일반 공지에는 다양한 주제가 섞여 있어 위치·기간 추출 품질 검증이 필요합니다.",
    make_collected_item: true,
  },
  {
    id: "dalseo-participation",
    name: "달서구 구민참여·공모·생활 신청",
    url: "https://www.dalseo.daegu.kr/index.do?menu_id=10000106",
    kind: "official_html",
    category: "event",
    priority: "medium",
    expected_fields: ["행사명", "접수기간", "장소", "담당부서"],
    collection_risk: "메뉴 통합 페이지라 세부 게시판 URL 분리가 필요합니다.",
    make_collected_item: true,
  },
  {
    id: "dalseo-events-classes",
    name: "달서구 행사·강좌",
    url: "https://www.dalseo.daegu.kr/index.do?menu_id=00001851",
    kind: "official_html",
    category: "event",
    priority: "high",
    expected_fields: ["행사명", "모집기간", "운영기간", "장소", "첨부파일"],
    collection_risk: "모집 공고와 실제 행사 일정이 분리될 수 있어 기간 필드 구분이 필요합니다.",
    make_collected_item: true,
  },
  {
    id: "dalseo-newsletter",
    name: "달서구소식지",
    url: "https://www.dalseo.daegu.kr/index.do?menu_id=00000682",
    kind: "official_html",
    category: "public_notice",
    priority: "medium",
    expected_fields: ["발행월", "PDF", "전자책", "주요 소식"],
    collection_risk: "PDF/e-book에서 비정형 정책·행사 정보를 추출해야 합니다.",
    make_collected_item: true,
  },
  {
    id: "dalseo-policy-research",
    name: "달서구 정책연구용역 결과",
    url: "https://www.dalseo.daegu.kr/index.do?menu_id=00002552",
    kind: "official_html",
    category: "urban_plan",
    priority: "medium",
    expected_fields: ["연구명", "부서", "PDF/HWP", "공개일"],
    collection_risk: "연구보고서는 장문 PDF/HWP 파싱과 위치 추출이 필요합니다.",
    make_collected_item: true,
  },
  {
    id: "dalseo-audit-results",
    name: "달서구 감사결과 공개",
    url: "https://www.dalseo.daegu.kr/index.do?menu_id=10000219",
    kind: "official_html",
    category: "public_notice",
    priority: "medium",
    expected_fields: ["감사명", "대상기관", "PDF", "공개일"],
    collection_risk: "감사 결과는 생활영향보다는 행정 신뢰도 보조 데이터로 쓰는 편이 적절합니다.",
    make_collected_item: true,
  },
  {
    id: "dalseo-official-parking",
    name: "달서구 주차장 현황",
    url: "https://www.dalseo.daegu.kr/index.do?menu_id=20000380",
    kind: "official_html",
    category: "parking",
    priority: "high",
    expected_fields: ["주차장명", "주소", "면수", "운영시간", "요금", "개방구분"],
    collection_risk: "탭형 테이블 구조라 HTML 테이블 파싱이 필요합니다.",
    make_collected_item: true,
  },
  {
    id: "dalseo-health-notices",
    name: "달서구 보건소 공지사항",
    url: "https://www.dalseo.daegu.kr/healthcenter/index.do?menu_id=30001083",
    kind: "official_html",
    category: "welfare",
    priority: "medium",
    expected_fields: ["제목", "등록일", "의료기관/약국 파일", "첨부파일"],
    collection_risk: "명절 진료·약국 등 특정 시점 데이터는 유효기간 관리를 해야 합니다.",
    make_collected_item: true,
  },
  {
    id: "dalseo-health-provider-notices",
    name: "달서구 보건소 의료기관 안내",
    url: "https://www.dalseo.daegu.kr/healthcenter/index.do?menu_id=00002665",
    kind: "official_html",
    category: "welfare",
    priority: "medium",
    expected_fields: ["의료기관", "약국", "주소", "연락처", "첨부파일"],
    collection_risk: "XLSX/PDF 첨부 파싱이 필요합니다.",
    make_collected_item: true,
  },
  {
    id: "dalseo-health-infection-alerts",
    name: "달서구 감염병 알림",
    url: "https://www.dalseo.daegu.kr/healthcenter/index.do?menu_id=00004251",
    kind: "official_html",
    category: "safety",
    priority: "medium",
    expected_fields: ["알림명", "등록일", "예방수칙", "이미지/첨부"],
    collection_risk: "이미지 중심 공지는 OCR 또는 대체 텍스트 확보가 필요합니다.",
    make_collected_item: true,
  },
  {
    id: "dalseo-council-video",
    name: "달서구의회 영상회의록",
    url: "http://tv.dalseocouncil.daegu.kr/",
    kind: "official_html",
    category: "council",
    priority: "medium",
    expected_fields: ["회의명", "안건명", "회의일", "발언 내용"],
    collection_risk: "영상/자막 구조가 동적이면 별도 회의록 페이지 연계가 필요합니다.",
    make_collected_item: true,
  },
  {
    id: "daegu-traffic-home",
    name: "대구교통종합정보",
    url: "https://car.daegu.go.kr/",
    kind: "official_html",
    category: "traffic",
    priority: "high",
    expected_fields: ["돌발유형", "주소", "좌표", "시작시간", "종료시간"],
    collection_risk: "실시간 상세 데이터는 공공데이터 API 활용신청이 필요할 수 있습니다.",
    make_collected_item: true,
  },
  {
    id: "daegu-parking-system",
    name: "대구광역시 통합주차정보시스템",
    url: "https://pis.daegu.go.kr/",
    kind: "official_html",
    category: "parking",
    priority: "high",
    expected_fields: ["주차장명", "주소", "좌표", "잔여면수", "혼잡도"],
    collection_risk: "실시간 주차면수는 화면 내부 API 확인 또는 공식 API가 필요합니다.",
    make_collected_item: true,
  },
  {
    id: "daegu-heat-shelter-page",
    name: "대구광역시 무더위 쉼터",
    url: "https://www.daegu.go.kr/safety/index.do?menu_id=00934271",
    kind: "official_html",
    category: "heat",
    priority: "high",
    expected_fields: ["쉼터명", "주소", "운영시간", "수용인원", "다운로드"],
    collection_risk: "현황표 다운로드 파일을 별도로 받아 파싱해야 정확한 행 단위 데이터가 됩니다.",
    make_collected_item: true,
  },
  {
    id: "data-go-kr-dalseo-public-parking",
    name: "대구광역시 달서구_공영주차장 운영 현황",
    url: "https://www.data.go.kr/data/15110071/fileData.do?recommendDataYn=Y",
    kind: "public_data_metadata",
    category: "parking",
    priority: "high",
    expected_fields: ["주차장명", "주소", "위도", "경도", "운영시간"],
    collection_risk: "파일 다운로드는 포털 다운로드 링크 파싱 또는 수동 파일 반입이 필요합니다.",
  },
  {
    id: "data-go-kr-dalseo-private-parking",
    name: "대구광역시 달서구_민영주차장 운영 현황",
    url: "https://www.data.go.kr/data/15110080/fileData.do",
    kind: "public_data_metadata",
    category: "parking",
    priority: "medium",
    expected_fields: ["주차장명", "주소", "위도", "경도"],
    collection_risk: "파일 다운로드는 포털 다운로드 링크 파싱 또는 수동 파일 반입이 필요합니다.",
  },
  {
    id: "data-go-kr-dalseo-shared-parking",
    name: "대구광역시 달서구_개방공유주차장 운영 현황",
    url: "https://www.data.go.kr/data/15110065/fileData.do",
    kind: "public_data_metadata",
    category: "parking",
    priority: "high",
    expected_fields: ["주차장명", "주소", "위도", "경도", "개방시간", "면수"],
    collection_risk: "개방 가능 시간과 실제 이용 가능 여부를 최신 공지와 함께 확인해야 합니다.",
  },
  {
    id: "data-go-kr-dalseo-development-permits",
    name: "대구광역시 달서구_개발행위허가정보",
    url: "https://www.data.go.kr/data/15099461/fileData.do",
    kind: "public_data_metadata",
    category: "urban_plan",
    priority: "high",
    expected_fields: ["위치", "위도", "경도", "허가일", "면적", "용도지역", "개발행위 목적"],
    collection_risk: "연간 갱신 데이터라 최신 공고와 시차가 있어 고시공고와 조인해야 합니다.",
  },
  {
    id: "data-go-kr-traffic-event",
    name: "대구광역시_돌발 교통정보 조회 서비스(신)",
    url: "https://www.data.go.kr/data/15126267/openapi.do",
    kind: "openapi_metadata",
    category: "traffic",
    priority: "high",
    expected_fields: ["돌발유형", "돌발등급", "좌표", "제보시간", "종료시점"],
    collection_risk: "실제 호출에는 공공데이터포털 활용신청과 인증키가 필요합니다.",
  },
  {
    id: "data-go-kr-traffic-flow",
    name: "대구광역시_교통소통정보(신)",
    url: "https://www.data.go.kr/data/15126266/openapi.do",
    kind: "openapi_metadata",
    category: "traffic",
    priority: "high",
    expected_fields: ["구간명", "도로명", "속도", "거리", "혼잡도"],
    collection_risk: "실제 호출에는 공공데이터포털 활용신청과 인증키가 필요합니다.",
  },
  {
    id: "data-go-kr-dalseo-school-zone",
    name: "대구광역시 달서구_어린이보호구역 현황",
    url: "https://www.data.go.kr/data/15110063/fileData.do?recommendDataYn=Y",
    kind: "public_data_metadata",
    category: "safety",
    priority: "high",
    expected_fields: ["대상시설명", "소재지", "위도", "경도", "CCTV", "도로폭"],
    collection_risk: "1회성 데이터라 기준일자를 명확히 표시해야 합니다.",
  },
  {
    id: "data-go-kr-dalseo-elder-zone",
    name: "대구광역시 달서구_노인보호구역 현황",
    url: "https://www.data.go.kr/data/15110064/fileData.do",
    kind: "public_data_metadata",
    category: "safety",
    priority: "medium",
    expected_fields: ["시설명", "주소", "위도", "경도", "보호구역도로폭", "CCTV"],
    collection_risk: "어린이보호구역과 별도 기준일자를 관리해야 합니다.",
  },
  {
    id: "data-go-kr-dalseo-cctv",
    name: "대구광역시 달서구_CCTV 설치 위치",
    url: "https://www.data.go.kr/data/15083776/fileData.do",
    kind: "public_data_metadata",
    category: "safety",
    priority: "medium",
    expected_fields: ["설치목적", "주소", "위도", "경도", "카메라대수", "촬영방면"],
    collection_risk: "상세 위치 노출은 민감할 수 있어 안전 접근성 파생값으로 사용하는 편이 적절합니다.",
  },
  {
    id: "data-go-kr-school-zone-risk",
    name: "대구광역시_어린이 보호구역 위험요소 조회 서비스",
    url: "https://www.data.go.kr/data/15097855/openapi.do",
    kind: "openapi_metadata",
    category: "safety",
    priority: "medium",
    expected_fields: ["위험요소 유형", "위험도", "위도", "경도", "발생 시간"],
    collection_risk: "실제 호출에는 공공데이터포털 활용신청과 인증키가 필요합니다.",
  },
  {
    id: "data-go-kr-dalseo-senior-centers",
    name: "대구광역시 달서구_경로당 현황",
    url: "https://www.data.go.kr/data/3040548/fileData.do",
    kind: "public_data_metadata",
    category: "welfare",
    priority: "high",
    expected_fields: ["명칭", "주소", "위도", "경도", "전화번호", "행정동"],
    collection_risk: "쉼터/복지시설 용도는 별도 운영정보와 결합해야 합니다.",
  },
  {
    id: "data-go-kr-heat-standard",
    name: "전국무더위쉼터표준데이터",
    url: "https://www.data.go.kr/data/15013199/standard.do",
    kind: "standard_data_metadata",
    category: "heat",
    priority: "high",
    expected_fields: ["쉼터명칭", "상세주소", "이용가능인원", "냉방기", "운영기간"],
    collection_risk: "전국 표준 데이터에서 달서구 행만 필터링해야 합니다.",
  },
  {
    id: "data-go-kr-village-hall-standard",
    name: "전국마을회관및경로당표준데이터",
    url: "https://www.data.go.kr/data/15114136/standard.do",
    kind: "standard_data_metadata",
    category: "welfare",
    priority: "medium",
    expected_fields: ["시설명", "주소", "위도", "경도", "운영상태"],
    collection_risk: "전국 표준 데이터에서 달서구 행만 필터링해야 합니다.",
  },
  {
    id: "data-go-kr-dalseo-cultural-facilities",
    name: "대구광역시 달서구_문화시설현황",
    url: "https://www.data.go.kr/data/15077166/fileData.do",
    kind: "public_data_metadata",
    category: "facility",
    priority: "medium",
    expected_fields: ["시설명", "주소", "위도", "경도", "운영정보"],
    collection_risk: "시설 운영시간과 행사 일정은 별도 출처와 결합해야 합니다.",
  },
  {
    id: "data-go-kr-dalseo-emergency-shelters",
    name: "대구광역시 달서구_비상대피시설",
    url: "https://www.data.go.kr/data/15136227/fileData.do?recommendDataYn=Y",
    kind: "public_data_metadata",
    category: "safety",
    priority: "medium",
    expected_fields: ["시설명", "주소", "위도", "경도", "수용인원"],
    collection_risk: "재난대피 목적 데이터라 평시 생활영향 문구와 분리해야 합니다.",
  },
  {
    id: "data-go-kr-dalseo-contracts",
    name: "대구광역시 달서구_계약현황",
    url: "https://www.data.go.kr/data/15063250/fileData.do",
    kind: "public_data_metadata",
    category: "construction",
    priority: "medium",
    expected_fields: ["계약명", "계약일", "담당부서", "계약구분"],
    collection_risk: "계약명에서 실제 위치를 추출하려면 주소/시설명 매칭이 필요합니다.",
  },
  {
    id: "data-go-kr-dalseo-public-data-catalog",
    name: "대구광역시 달서구_공공데이터 목록",
    url: "https://www.data.go.kr/data/15136269/fileData.do?recommendDataYn=Y",
    kind: "public_data_metadata",
    category: "public_notice",
    priority: "medium",
    expected_fields: ["서비스명", "분류", "제공형태", "갱신주기", "등록일", "수정일"],
    collection_risk: "데이터셋 목록 자체라 개별 생활영향 항목으로 쓰기보다 출처 발견용으로 사용합니다.",
  },
  {
    id: "data-go-kr-airkorea",
    name: "한국환경공단_에어코리아_대기오염정보",
    url: "https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15073861",
    kind: "openapi_metadata",
    category: "environment",
    priority: "medium",
    expected_fields: ["측정소", "PM10", "PM2.5", "O3", "NO2", "측정시각"],
    collection_risk: "달서구 측정소 기준으로 생활권 영향 모델을 별도 계산해야 합니다.",
  },
  {
    id: "d-datahub-dalseo-council-bills",
    name: "D-데이터허브 달서구 의안정보",
    url: "https://data.daegu.go.kr/open/data/dataView.do?dataSetDetailId=150380741c00e601efe4e&dataSetId=15038074&provdMethod=FILE",
    kind: "public_data_metadata",
    category: "council",
    priority: "medium",
    expected_fields: ["의안명", "회기", "처리결과", "제안일"],
    collection_risk: "연간/파일형 데이터라 최신 회의록과 시차가 있을 수 있습니다.",
  },
  {
    id: "d-datahub-dalseo-medical",
    name: "D-데이터허브 달서구 의료기관",
    url: "https://data.daegu.go.kr/open/data/dataView.do?dataSetDetailId=3040172d369e45fa690&dataSetId=3040172&provdMethod=FILE",
    kind: "public_data_metadata",
    category: "welfare",
    priority: "medium",
    expected_fields: ["기관명", "주소", "전화번호", "진료과목"],
    collection_risk: "응급/야간 운영 여부는 별도 보건 페이지와 결합해야 합니다.",
  },
  {
    id: "d-datahub-dalseo-disabled-facilities",
    name: "D-데이터허브 달서구 장애인 관련 시설",
    url: "https://data.daegu.go.kr/open/data/dataView.do?dataSetDetailId=3073036d9ad12dc000d&dataSetId=3073036&provdMethod=FILE",
    kind: "public_data_metadata",
    category: "welfare",
    priority: "medium",
    expected_fields: ["시설명", "주소", "전화번호", "시설유형"],
    collection_risk: "접근성 정보는 시설 종류만으로 부족해 별도 보강이 필요합니다.",
  },
  {
    id: "d-datahub-dalseo-sports-facilities",
    name: "D-데이터허브 달서구 체육시설",
    url: "https://data.daegu.go.kr/open/data/dataView.do?dataSetDetailId=150532712b1db1c6b742a&dataSetId=15053271&provdMethod=FILE",
    kind: "public_data_metadata",
    category: "facility",
    priority: "medium",
    expected_fields: ["시설명", "주소", "운영정보", "시설유형"],
    collection_risk: "행사/예약 일정과 연결해야 실제 혼잡 영향 분석이 가능합니다.",
  },
  {
    id: "d-datahub-dalseo-asbestos",
    name: "D-데이터허브 달서구 석면조사대상 건축물",
    url: "https://data.daegu.go.kr/open/data/dataView.do?dataSetDetailId=304728018bcfc0904343_201602191519&dataSetId=3047280&provdMethod=FILE",
    kind: "public_data_metadata",
    category: "environment",
    priority: "medium",
    expected_fields: ["건축물명", "주소", "조사결과", "기준일"],
    collection_risk: "환경 위험 정보는 과도한 단정 없이 원문 근거와 함께 표시해야 합니다.",
  },
  {
    id: "daegu-city-notices",
    name: "대구광역시 고시공고",
    url: "https://www.daegu.go.kr/index.do?menu_id=00940170&menu_link=%2Ffront%2FdaeguSidoGosi%2FdaeguSidoGosiList.do",
    kind: "official_html",
    category: "public_notice",
    priority: "medium",
    expected_fields: ["제목", "고시번호", "부서", "공고일", "첨부파일"],
    collection_risk: "대구시 전체 공고에서 달서구 관련 항목만 필터링해야 합니다.",
    make_collected_item: true,
  },
  {
    id: "daegu-urban-management-plan",
    name: "대구 도시관리계획",
    url: "https://www.daegu.go.kr/build/index.do?menu_id=00933156",
    kind: "official_html",
    category: "urban_plan",
    priority: "medium",
    expected_fields: ["계획명", "장별 문서", "도시계획 설명"],
    collection_risk: "기본계획 성격이라 개별 주소 영향은 고시공고와 결합해야 합니다.",
  },
  {
    id: "daegu-night-pharmacies",
    name: "대구 공공심야약국",
    url: "https://www.daegu.go.kr/health/index.do?menu_id=00933164",
    kind: "official_html",
    category: "welfare",
    priority: "medium",
    expected_fields: ["약국명", "주소", "전화번호", "운영시간"],
    collection_risk: "달서구 행만 필터링하고 운영시간 변경을 주기적으로 확인해야 합니다.",
    make_collected_item: true,
  },
  {
    id: "daegu-pediatric-night-care",
    name: "대구 소아 야간·휴일 진료기관",
    url: "https://www.daegu.go.kr/health/index.do?menu_id=00936060",
    kind: "official_html",
    category: "welfare",
    priority: "medium",
    expected_fields: ["기관명", "주소", "운영시간", "전화번호"],
    collection_risk: "달서구 행만 필터링하고 명절/휴일 운영 변경을 확인해야 합니다.",
    make_collected_item: true,
  },
];

const referenceItems = [
  traffic("sangin", "상인역네거리 교통통제·혼잡 영향권", "대구광역시 달서구 상인동 상인역네거리", "상인동", 35.8181, 128.5378, ["통행", "대중교통", "주차", "상권"], "상인역 주변은 지하철, 버스, 차량 이동이 겹치는 지점입니다. 통제나 사고가 생기면 출퇴근과 장보기 동선에 영향이 큽니다."),
  traffic("duryu", "두류네거리 행사·교통 혼잡 영향권", "대구광역시 달서구 두류동 두류네거리", "두류동", 35.8561, 128.5582, ["통행", "행사", "주차", "소음"], "두류공원 행사나 도로 통제가 있으면 두류네거리 주변 차량 이동과 주차가 어려워질 수 있습니다."),
  traffic("seongseo", "성서산업단지역 출퇴근 혼잡 영향권", "대구광역시 달서구 갈산동 성서산업단지역", "갈산동", 35.85144, 128.50621, ["통근", "통행", "대중교통"], "성서산업단지역 주변은 출퇴근 시간 차량과 보행 이동이 몰립니다. 공사나 사고가 있으면 통근 지연 영향이 큽니다."),
  traffic("yongsan", "용산역 주변 환승·상권 혼잡 영향권", "대구광역시 달서구 용산동 용산역 일원", "용산동", 35.8494, 128.5284, ["환승", "상권", "주차", "보행"], "용산역 주변은 대중교통 환승과 상가 방문이 겹쳐 퇴근 시간대 보행·주차 혼잡이 생길 수 있습니다."),
  traffic("jukjeon", "죽전역·감삼권 도로 혼잡 영향권", "대구광역시 달서구 감삼동 죽전역 일원", "감삼동", 35.8506, 128.5376, ["통행", "환승", "상권", "주차"], "죽전역 주변은 출퇴근과 상권 방문 수요가 겹치는 곳이라 공사·통제 시 우회 영향이 큽니다."),
  traffic("daegok", "대곡역·도원권 환승 영향권", "대구광역시 달서구 대곡동 대곡역 일원", "대곡동", 35.8092, 128.5109, ["환승", "통행", "보행", "주차"], "대곡역 주변은 버스·지하철 환승과 주거지 이동이 겹쳐 통제 시 주민 이동 불편이 커질 수 있습니다."),
  traffic("wolbae", "월배역·진천역 생활도로 혼잡 영향권", "대구광역시 달서구 진천동 월배역 일원", "진천동", 35.8165, 128.5302, ["통행", "상권", "주차", "보행"], "월배권 역세권은 생활도로와 상권 방문이 겹쳐 저녁 시간대 이동 불편이 커질 수 있습니다."),
  traffic("keimyung", "계명대역 대학가 보행·차량 혼잡 영향권", "대구광역시 달서구 신당동 계명대역 일원", "신당동", 35.8512, 128.4911, ["통행", "야간보행", "상권", "청년"], "계명대역 대학가 주변은 야간 유동인구와 차량 이동이 많아 보행 안전과 교통 흐름 확인이 필요합니다."),

  parking("duryu-park", "두류공원 공영주차장 이용 영향권", "대구광역시 달서구 공원순환로 36", "두류동", 35.85268, 128.55819, ["주차", "행사", "공원", "상권"], "두류공원 주변 행사가 있으면 공영주차장 수요가 빠르게 늘어납니다."),
  parking("wolbae", "월배권 생활주차 수요 영향권", "대구광역시 달서구 월배로 일원", "진천동", 35.8136, 128.5228, ["주차", "상권", "대중교통"], "월배권은 상가, 아파트, 지하철 이용이 겹쳐 특정 시간대 주차 수요가 높습니다."),
  parking("seongseo-industry", "성서산단 주차·물류 동선 영향권", "대구광역시 달서구 성서산업단지 일원", "갈산동", 35.8488, 128.4986, ["주차", "물류", "통근", "상권"], "성서산단은 출퇴근 차량과 물류 차량이 함께 움직여 주차와 도로 점유 영향이 클 수 있습니다."),
  parking("daegok-park", "대곡·도원권 공원 주차 영향권", "대구광역시 달서구 도원동 일원", "도원동", 35.8068, 128.5351, ["주차", "공원", "주말혼잡"], "도원권 공원 주변은 주말 방문과 주거지 주차 수요가 겹쳐 생활도로 혼잡이 생길 수 있습니다."),
  parking("yongsan-market", "용산동 상권 주차 수요 영향권", "대구광역시 달서구 용산동 일원", "용산동", 35.8491, 128.5296, ["주차", "상권", "보행"], "용산동 상권은 퇴근 시간과 주말에 주차 수요가 몰릴 수 있어 방문 전 주차 가능 구역 확인이 필요합니다."),
  parking("seobu-market", "서남시장 주변 보행·주차 안전 영향권", "대구광역시 달서구 감삼동 서남시장 일원", "감삼동", 35.8541, 128.5441, ["전통시장", "보행", "주차", "안전"], "시장 주변은 보행자, 배달 차량, 주차 차량이 섞여 특정 시간대 안전 문제가 생길 수 있습니다."),
  parking("igok", "이곡동 생활주차·공공시설 접근 영향권", "대구광역시 달서구 이곡동 일원", "이곡동", 35.8569, 128.5129, ["주차", "공공시설", "생활편의"], "이곡동 생활권은 공공시설 이용과 주거지 주차 수요가 겹치는 구간이 많습니다."),
  parking("shared-school", "학교·종교시설 개방공유주차 영향권", "대구광역시 달서구 월성동·상인동 일원", "월성동", 35.8268, 128.5331, ["개방주차", "주차", "생활편의"], "개방공유주차장은 특정 시간대에만 이용 가능한 경우가 많아 운영시간 확인이 필요합니다."),

  safety("school-wolseong", "월성권 학교 주변 보행안전 영향권", "대구광역시 달서구 월성동 학교 밀집지역", "월성동", 35.8262, 128.5312, ["통학", "보행", "불법주정차", "안전"], "월성권 학교 주변은 등하교 시간 보행자와 차량이 겹치므로 불법주정차와 우회 동선 영향이 큽니다."),
  safety("school-sangin", "상인권 어린이보호구역 보행안전 영향권", "대구광역시 달서구 상인동 학교 밀집지역", "상인동", 35.8175, 128.5403, ["통학", "보행", "안전", "CCTV"], "상인권 어린이보호구역은 등하교 시간 차량 속도와 보행 동선 관리가 중요합니다."),
  safety("school-daegok", "대곡·도원권 통학로 안전 영향권", "대구광역시 달서구 도원동 학교 밀집지역", "도원동", 35.8073, 128.5321, ["통학", "보행", "불법주정차", "안전"], "대곡·도원권 통학로는 주거지 골목과 학교 접근로가 만나는 구간에서 보행 안전 확인이 필요합니다."),
  safety("night-keimyung", "계명대역 대학가 야간 보행안전 영향권", "대구광역시 달서구 신당동 계명대역 일원", "신당동", 35.8512, 128.4911, ["야간보행", "청년", "상권", "안전"], "계명대역 주변은 야간 유동인구가 많아 조도, CCTV, 보행 동선 정보가 중요합니다."),
  safety("emergency-dalseo-office", "달서구청 주변 비상대피 접근 영향권", "대구광역시 달서구 학산로 45", "월성동", 35.82982, 128.53273, ["재난대피", "공공시설", "안전"], "구청 주변 공공시설은 재난 상황에서 대피 안내와 행정 지원 접근성이 중요합니다."),
  safety("market-wolbae", "월배시장 주변 보행·주차 안전 영향권", "대구광역시 달서구 진천동 월배시장 일원", "진천동", 35.8147, 128.5241, ["전통시장", "보행", "주차", "안전"], "월배시장 주변은 장보기 시간대와 행사일에 보행·주차 수요가 늘어날 수 있습니다."),
  safety("elder-wolbae", "월배권 노인보호구역 보행안전 영향권", "대구광역시 달서구 진천동·상인동 일원", "진천동", 35.8156, 128.5288, ["고령층", "보행", "안전", "속도관리"], "노인보호구역은 보행 속도와 차량 회전 동선이 중요한 생활안전 지점입니다."),
  safety("cctv-duryu", "두류·감삼권 생활안전 CCTV 접근 영향권", "대구광역시 달서구 두류동·감삼동 일원", "두류동", 35.8548, 128.5512, ["안전", "야간보행", "CCTV"], "야간 보행 수요가 많은 생활권은 조도와 CCTV 접근성을 함께 확인하면 안전 체감도가 높아집니다."),

  heat("dalseo-office", "달서구청 주변 폭염쉼터 접근 영향권", "대구광역시 달서구 학산로 45", "월성동", 35.82982, 128.53273, ["폭염", "고령층", "보행", "생활편의"], "폭염특보 때 구청 주변 주민과 보행자는 가까운 실내 공공시설 접근성이 중요합니다."),
  heat("wolseong-welfare", "월성권 복지시설·무더위쉼터 접근 영향권", "대구광역시 달서구 월성동 일원", "월성동", 35.8277, 128.5284, ["폭염", "복지", "고령층"], "월성동 고령층과 보행약자는 폭염 시 가까운 복지·공공시설 이용 가능 여부가 중요합니다."),
  heat("dowon", "도원동 고령층 폭염 대응 영향권", "대구광역시 달서구 도원동 행정복지센터 일원", "도원동", 35.8056, 128.5326, ["폭염", "고령층", "복지", "보행"], "폭염일에는 도원동 고령층이 가까운 공공시설까지 안전하게 이동할 수 있는지가 중요합니다."),
  heat("igok", "이곡동 무더위쉼터 접근 영향권", "대구광역시 달서구 이곡동 행정복지센터 일원", "이곡동", 35.8569, 128.5129, ["폭염", "복지", "생활편의"], "이곡동은 주거지와 상권이 가까워 폭염 시 가까운 실내 쉼터 안내가 중요합니다."),
  heat("janggi", "장기동 폭염 취약계층 접근 영향권", "대구광역시 달서구 장기동 행정복지센터 일원", "장기동", 35.8441, 128.5299, ["폭염", "1인가구", "복지"], "장기동 1인가구와 고령층은 폭염특보 시 가까운 쉼터와 행정복지센터 안내가 필요합니다."),
  heat("seongseo", "성서권 근로자 폭염 휴식 접근 영향권", "대구광역시 달서구 신당동 일원", "신당동", 35.8566, 128.4948, ["폭염", "근로자", "공공시설"], "성서권 산업단지 근로자는 폭염 시 휴식 공간과 대중교통 접근성이 함께 중요합니다."),

  facility("dalseo-library", "달서구립도서관 주변 혼잡·접근 영향권", "대구광역시 달서구 학산로 140", "본동", 35.8344, 128.5367, ["공공시설", "보행", "주차", "학습"], "도서관 행사나 시험 기간에는 주변 보행·주차 수요가 늘 수 있습니다."),
  facility("seongseo-library", "성서권 공공시설 이용 영향권", "대구광역시 달서구 이곡동 일원", "이곡동", 35.8563, 128.5112, ["공공시설", "주차", "보행"], "성서권 공공시설은 평일 저녁과 주말 이용이 몰릴 수 있어 주차와 보행 접근성을 함께 봐야 합니다."),
  facility("daegu-arboretum", "대구수목원 방문객·주차 영향권", "대구광역시 달서구 화암로 342", "대곡동", 35.8019, 128.5211, ["공공시설", "주차", "보행", "관광"], "대구수목원은 주말과 계절 행사 때 방문객이 몰려 주변 주차와 보행 동선이 혼잡해질 수 있습니다."),
  facility("duryu-park", "두류공원 문화시설 방문 영향권", "대구광역시 달서구 공원순환로 36", "두류동", 35.85268, 128.55819, ["공원", "행사", "주차", "보행"], "두류공원 문화행사와 공원 이용객이 겹치면 보행 동선과 주차장이 혼잡해질 수 있습니다."),
  facility("seon-sa", "선사시대로 문화체험 접근 영향권", "대구광역시 달서구 월성동 선사시대로 일원", "월성동", 35.8236, 128.5315, ["문화시설", "교육", "보행"], "월성권 문화체험 공간은 가족 방문과 교육 프로그램 운영일에 보행·주차 수요가 늘 수 있습니다."),

  welfare("seongseo", "성서권 복지·상담 서비스 접근 영향권", "대구광역시 달서구 신당동 일원", "신당동", 35.8566, 128.4948, ["복지", "청년", "상담", "생활편의"], "성서권은 산업단지와 주거지가 가까워 청년, 근로자, 1인가구 대상 상담·복지 접근성이 중요합니다."),
  welfare("janggi", "장기동 1인가구 생활지원 접근 영향권", "대구광역시 달서구 장기동 일원", "장기동", 35.8441, 128.5299, ["1인가구", "복지", "상담", "생활편의"], "장기동 1인가구는 복지, 상담, 생활 민원 정보를 한 번에 확인할 수 있으면 행정 접근성이 높아집니다."),
  welfare("wolseong", "월성권 고령층 복지시설 접근 영향권", "대구광역시 달서구 월성동 일원", "월성동", 35.8277, 128.5284, ["고령층", "복지", "보행"], "월성권 고령층은 행정복지센터와 경로당 접근성, 보행 안전을 함께 확인해야 합니다."),
  welfare("dowon", "도원동 복지·행정 서비스 접근 영향권", "대구광역시 달서구 도원동 일원", "도원동", 35.8056, 128.5326, ["복지", "행정", "고령층"], "도원동은 주거지와 복지시설 간 이동 거리가 생활 편의에 직접 영향을 줄 수 있습니다."),
  welfare("bonri", "본리동 생활복지·공원 접근 영향권", "대구광역시 달서구 본리동 일원", "본리동", 35.8375, 128.5416, ["복지", "공원", "생활편의"], "본리동 생활권은 공원, 복지시설, 도서관 접근성이 주민 체감 편의와 연결됩니다."),

  environment("daemyeongcheon", "대명천 주변 환경·악취 민원 영향권", "대구광역시 달서구 대천동 대명천 일원", "대천동", 35.8087, 128.5236, ["악취", "환경", "보행", "민원"], "하천 주변은 기온, 강우, 청소 상태에 따라 악취나 보행 불편 민원이 생길 수 있습니다."),
  environment("seongseo", "성서산단 대기·악취 민원 영향권", "대구광역시 달서구 성서산업단지 일원", "갈산동", 35.8465, 128.4934, ["대기", "악취", "민원", "산업단지"], "산업단지 주변은 바람, 기온, 조업 시간에 따라 악취나 대기질 체감 민원이 발생할 수 있습니다."),
  environment("duryu", "두류공원 주변 소음·환경 관리 영향권", "대구광역시 달서구 두류동 두류공원 일원", "두류동", 35.85268, 128.55819, ["소음", "환경", "행사", "공원"], "공원 행사와 방문객 증가가 겹치면 소음, 쓰레기, 보행 환경 관리가 중요해집니다."),
  environment("wolbae-stream", "월배권 생활하천 보행환경 영향권", "대구광역시 달서구 월배권 생활하천 일원", "진천동", 35.8125, 128.5262, ["환경", "보행", "민원"], "생활하천 주변은 악취와 보행 불편 신고가 반복될 수 있어 발생 시간과 위치 기록이 중요합니다."),

  publicNotice("urban-wolseong", "월성권 도시관리계획·주민의견 확인 영향권", "대구광역시 달서구 월성동 일원", "월성동", 35.8293, 128.5304, ["보행", "주차", "상권", "의견제출"], "도시관리계획 관련 공고는 보행, 주차, 상권, 의견 제출 기한을 함께 확인해야 합니다."),
  publicNotice("notice-dalseo-office", "달서구청 고시공고 행정정보 확인 영향권", "대구광역시 달서구 학산로 45", "월성동", 35.82982, 128.53273, ["행정정보", "의견제출", "생활편의"], "달서구 공식 공고는 일정, 담당 부서, 제출 방법이 원문에 있으므로 원문 확인이 필요합니다."),
  publicNotice("contract-road", "생활도로·공사 계약정보 확인 영향권", "대구광역시 달서구 본동·월성동 일원", "본동", 35.8344, 128.5367, ["공사", "보행", "소음", "통행"], "공사 계약이나 발주 정보는 실제 공사 일정과 위치 확인으로 이어질 수 있습니다."),
  publicNotice("budget-participation", "주민참여예산 제안사업 생활권 영향권", "대구광역시 달서구 월성동 일원", "월성동", 35.82982, 128.53273, ["주민참여", "생활편의", "공공시설"], "주민참여예산 사업은 생활 불편 개선과 공공시설 개선 요구를 제안할 수 있는 통로입니다."),

  urbanPlan("development-wolseong", "월성권 개발행위허가 생활환경 영향권", "대구광역시 달서구 월성동 일원", "월성동", 35.8293, 128.5304, ["도시계획", "보행", "상권", "재산권"], "개발행위허가 정보는 주변 토지 이용, 보행 동선, 상권 변화 가능성을 살펴보는 근거가 됩니다."),
  urbanPlan("development-daegok", "대곡·도원권 개발행위허가 영향권", "대구광역시 달서구 대곡동·도원동 일원", "도원동", 35.8068, 128.5351, ["도시계획", "공사", "교통", "환경"], "대곡·도원권 개발행위는 공사 차량 이동과 생활도로 통행에 영향을 줄 수 있습니다."),
  urbanPlan("development-seongseo", "성서산단 주변 개발행위·용도지역 영향권", "대구광역시 달서구 갈산동·신당동 일원", "갈산동", 35.8488, 128.4986, ["도시계획", "산업단지", "환경", "통근"], "성서산단 주변 개발행위는 통근 동선, 물류 차량, 환경 민원과 함께 검토해야 합니다."),
  urbanPlan("development-duryu", "두류권 도시계획·문화시설 영향권", "대구광역시 달서구 두류동 일원", "두류동", 35.85268, 128.55819, ["도시계획", "행사", "주차", "공공시설"], "두류권 도시계획 변화는 공원, 문화시설, 행사 방문 동선에 영향을 줄 수 있습니다."),

  construction("contract-road-wolseong", "월성·본동 생활도로 공사 계약 영향권", "대구광역시 달서구 월성동·본동 일원", "본동", 35.8344, 128.5367, ["공사", "보행", "소음", "통행"], "공사 계약 정보는 향후 실제 공사 일정과 소음·통행 영향 확인의 출발점이 됩니다."),
  construction("contract-park-duryu", "두류권 공원·시설 정비 계약 영향권", "대구광역시 달서구 두류동 일원", "두류동", 35.85268, 128.55819, ["공사", "공원", "주차", "보행"], "공원·시설 정비 계약은 방문객 동선과 임시 통행 제한 가능성을 함께 확인해야 합니다."),
  construction("contract-seongseo", "성서권 도로·산업단지 정비 계약 영향권", "대구광역시 달서구 갈산동 성서산업단지 일원", "갈산동", 35.8488, 128.4986, ["공사", "물류", "통근", "소음"], "성서권 정비 공사는 출퇴근과 물류 차량 흐름에 영향을 줄 수 있어 일정 확인이 중요합니다."),

  event("e-world", "두류공원·이월드 주변 행사 혼잡 영향권", "대구광역시 달서구 두류공원로 200", "두류동", 35.8531, 128.5631, ["행사", "주차", "소음", "상권"], "대형 행사나 주말 방문객이 몰리면 두류공원과 이월드 주변은 주차, 소음, 보행 혼잡이 커질 수 있습니다."),
  event("wolbae-market", "월배시장 장보기·행사 혼잡 영향권", "대구광역시 달서구 진천동 월배시장 일원", "진천동", 35.8147, 128.5241, ["전통시장", "행사", "주차", "보행"], "월배시장 주변은 장보기 시간대와 행사일에 보행·주차 수요가 늘어날 수 있습니다."),
  event("dalseo-festival", "달서구 가족·문화행사 생활권 영향권", "대구광역시 달서구 두류동 일원", "두류동", 35.85268, 128.55819, ["행사", "가족", "주차", "소음"], "대규모 가족·문화행사는 주변 주차장과 생활도로 혼잡을 동반할 수 있습니다."),
  event("seongseo-campus", "성서권 청년·대학가 행사 영향권", "대구광역시 달서구 신당동 계명대역 일원", "신당동", 35.8512, 128.4911, ["행사", "청년", "상권", "야간보행"], "대학가 행사와 상권 이용이 겹치면 야간 보행과 대중교통 혼잡을 확인해야 합니다."),
];

await mkdir(rawDir, { recursive: true });

const fetchedSources = await Promise.all(sourceCatalog.map(fetchSource));
const sourceById = new Map(fetchedSources.map((source) => [source.id, source]));
const collectedItems = fetchedSources
  .filter((source) => source.make_collected_item && source.status >= 200 && source.status < 400)
  .map((source) => buildCollectedItem(source));
const normalizedReferenceItems = referenceItems.map((item) =>
  finalizeItem(item, sourceById.get(item.source_id)),
);
const items = dedupeItems([...collectedItems, ...normalizedReferenceItems]);
const validation = validateItems(items);

await writeJson(path.join(dataDir, "impact-items.json"), {
  collected_at: collectedAt,
  generated_by: "scripts/collect-local-data.mjs",
  collection_mode: "official_web_metadata_plus_normalized_reference",
  validation,
  items,
});

await writeJson(path.join(dataDir, "sources.json"), {
  collected_at: collectedAt,
  sources: fetchedSources,
});

await writeJson(path.join(dataDir, "source-catalog.json"), {
  collected_at: collectedAt,
  sources: sourceCatalog.map((source) => {
    const catalogSource = { ...source };
    delete catalogSource.make_collected_item;
    return catalogSource;
  }),
});

await writeJson(path.join(dataDir, "collection-report.json"), {
  collected_at: collectedAt,
  source_count: fetchedSources.length,
  successful_source_count: fetchedSources.filter((source) => source.status >= 200 && source.status < 400).length,
  item_count: items.length,
  category_counts: countBy(items, "category"),
  source_status_counts: countBy(fetchedSources, "source_status"),
  validation,
  notes: [
    "공식 웹/공공데이터 메타데이터 원문은 data/raw에 저장했습니다.",
    "공공데이터포털 API/파일 원자료는 인증키 또는 다운로드 링크 처리가 필요한 경우가 있어 이번 수집에서는 메타데이터를 근거로 생활영향 레퍼런스 데이터를 정규화했습니다.",
    "요약과 영향권은 주민 이해를 돕기 위한 MVP 데이터이며 최종 판단은 원문과 담당 부서 확인이 필요합니다.",
  ],
});

console.log(
  `Saved ${items.length} impact items from ${fetchedSources.length} sources. Validation errors: ${validation.error_count}.`,
);

async function fetchSource(source) {
  const rawFile = `${source.id}.html`;
  let status = 0;
  let html = "";
  let error_message = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; DalseoAIImpactMVP/0.2; local data collector)",
      },
    });
    clearTimeout(timeout);
    status = response.status;
    html = await response.text();
  } catch (error) {
    html = `수집 실패: ${formatError(error)}`;
    error_message = formatError(error);
  }

  const text = normalizeText(stripHtml(html));
  const title = extractTitle(html) ?? source.name;

  await writeFile(path.join(rawDir, rawFile), html, "utf8");

  return {
    ...source,
    status,
    source_status: status >= 200 && status < 400 ? "collected" : status > 0 ? `http_${status}` : "fetch_error",
    error_message,
    raw_file: `data/raw/${rawFile}`,
    title,
    text_preview: text.slice(0, 360),
    collected_at: collectedAt,
  };
}

function buildCollectedItem(source) {
  const base = sourceDefaults(source.category);
  const location = defaultLocationForCategory(source.category);
  const statusSummary =
    source.text_preview.length > 0
      ? `${source.name} 원문을 수집했습니다. 원문 미리보기: ${source.text_preview.slice(0, 120)}`
      : `${source.name} 원문을 수집했습니다.`;

  return finalizeItem(
    {
      id: `web-${source.id}`,
      source_id: source.id,
      title: `${source.name} 원문 수집`,
      category: source.category,
      source_name: source.name,
      source_url: source.url,
      address: location.address,
      dong: location.dong,
      lat: location.lat,
      lng: location.lng,
      starts_at: null,
      ends_at: null,
      opinion_due_at: inferDate(source.text_preview),
      summary: statusSummary,
      plain_summary: `${source.name}에서 확인한 공식 또는 공공 원문입니다. 주민은 원문에서 세부 일정, 위치, 담당 부서, 제출 방법을 확인해야 합니다.`,
      impacts: base.impacts,
      action_guide: base.action_guide,
      department: base.department,
      contact: "원문 출처 확인",
      impact_radius_m: base.impact_radius_m,
      location_confidence: "source_default",
      summary_confidence: "source_preview",
      is_demo: false,
    },
    source,
  );
}

function traffic(id, title, address, dong, lat, lng, impacts, plainSummary) {
  return reference("traffic", "data-go-kr-traffic-event", id, title, address, dong, lat, lng, impacts, plainSummary, 750);
}

function parking(id, title, address, dong, lat, lng, impacts, plainSummary) {
  return reference("parking", "data-go-kr-dalseo-public-parking", id, title, address, dong, lat, lng, impacts, plainSummary, 650);
}

function safety(id, title, address, dong, lat, lng, impacts, plainSummary) {
  return reference("safety", "data-go-kr-dalseo-school-zone", id, title, address, dong, lat, lng, impacts, plainSummary, 550);
}

function heat(id, title, address, dong, lat, lng, impacts, plainSummary) {
  return reference("heat", "data-go-kr-heat-standard", id, title, address, dong, lat, lng, impacts, plainSummary, 550);
}

function facility(id, title, address, dong, lat, lng, impacts, plainSummary) {
  return reference("facility", "data-go-kr-dalseo-cultural-facilities", id, title, address, dong, lat, lng, impacts, plainSummary, 600);
}

function welfare(id, title, address, dong, lat, lng, impacts, plainSummary) {
  return reference("welfare", "data-go-kr-dalseo-senior-centers", id, title, address, dong, lat, lng, impacts, plainSummary, 600);
}

function environment(id, title, address, dong, lat, lng, impacts, plainSummary) {
  return reference("environment", "dalseo-notices", id, title, address, dong, lat, lng, impacts, plainSummary, 800);
}

function publicNotice(id, title, address, dong, lat, lng, impacts, plainSummary) {
  return reference("public_notice", "dalseo-notices", id, title, address, dong, lat, lng, impacts, plainSummary, 500);
}

function event(id, title, address, dong, lat, lng, impacts, plainSummary) {
  return reference("event", "dalseo-participation", id, title, address, dong, lat, lng, impacts, plainSummary, 850);
}

function urbanPlan(id, title, address, dong, lat, lng, impacts, plainSummary) {
  return reference("urban_plan", "data-go-kr-dalseo-development-permits", id, title, address, dong, lat, lng, impacts, plainSummary, 650);
}

function construction(id, title, address, dong, lat, lng, impacts, plainSummary) {
  return reference("construction", "data-go-kr-dalseo-contracts", id, title, address, dong, lat, lng, impacts, plainSummary, 650);
}

function reference(category, sourceId, id, title, address, dong, lat, lng, impacts, plainSummary, impactRadiusM) {
  const base = sourceDefaults(category);
  const idCategory = category.replace(/_/g, "-");
  return {
    id: `${idCategory}-${id}`,
    source_id: sourceId,
    title,
    category,
    source_name: base.source_name,
    source_url: base.source_url,
    address,
    dong,
    lat,
    lng,
    starts_at: null,
    ends_at: null,
    opinion_due_at: null,
    summary: `${base.source_name}와 관련 공개데이터 메타데이터를 기반으로 ${dong} 생활권 영향을 정규화했습니다.`,
    plain_summary: plainSummary,
    impacts,
    action_guide: base.action_guide,
    department: base.department,
    contact: "원문 출처 확인",
    impact_radius_m: impactRadiusM,
    location_confidence: "curated_public_reference",
    summary_confidence: "rule_based_reference",
    is_demo: false,
  };
}

function finalizeItem(item, source) {
  const urgency = calculateUrgency(item);

  return {
    ...item,
    source_name: source?.name ?? item.source_name,
    source_url: source?.url ?? item.source_url,
    source_type: source?.kind ?? "normalized_reference",
    source_status: source?.source_status ?? "metadata_reference",
    collected_at: collectedAt,
    updated_at: collectedAt,
    raw_text_path: source?.raw_file ?? null,
    urgency,
  };
}

function sourceDefaults(category) {
  const defaults = {
    traffic: {
      source_name: "대구광역시_돌발 교통정보 조회 서비스",
      source_url: "https://www.data.go.kr/data/15126267/openapi.do",
      impacts: ["통행", "대중교통", "주차"],
      action_guide: "교통정보 원문에서 통제 위치와 시간을 확인하고 출퇴근·방문 경로를 조정합니다.",
      department: "교통행정과",
      impact_radius_m: 750,
    },
    parking: {
      source_name: "대구광역시 달서구_공영주차장 운영 현황",
      source_url: "https://www.data.go.kr/data/15110071/fileData.do?recommendDataYn=Y",
      impacts: ["주차", "상권", "보행"],
      action_guide: "방문 전 공영주차장 위치와 혼잡 가능성을 확인하고 대중교통 이용도 함께 검토합니다.",
      department: "교통행정과",
      impact_radius_m: 650,
    },
    safety: {
      source_name: "대구광역시 달서구_어린이보호구역 현황",
      source_url: "https://www.data.go.kr/data/15110063/fileData.do?recommendDataYn=Y",
      impacts: ["안전", "보행", "통학"],
      action_guide: "등하교 시간대 차량 진입을 줄이고 위험 구간은 사진과 위치를 포함해 제보합니다.",
      department: "교통행정과",
      impact_radius_m: 550,
    },
    heat: {
      source_name: "전국무더위쉼터표준데이터",
      source_url: "https://www.data.go.kr/data/15013199/standard.do",
      impacts: ["폭염", "복지", "생활편의"],
      action_guide: "폭염특보 때 가장 가까운 쉼터와 운영시간을 먼저 확인합니다.",
      department: "안전도시과",
      impact_radius_m: 550,
    },
    facility: {
      source_name: "대구광역시 달서구_문화시설현황",
      source_url: "https://www.data.go.kr/data/15077166/fileData.do",
      impacts: ["공공시설", "보행", "주차"],
      action_guide: "방문 전 운영시간, 행사 여부, 주차 가능 여부를 함께 확인합니다.",
      department: "평생교육과",
      impact_radius_m: 600,
    },
    welfare: {
      source_name: "대구광역시 달서구_경로당 현황",
      source_url: "https://www.data.go.kr/data/3040548/fileData.do",
      impacts: ["복지", "고령층", "생활편의"],
      action_guide: "거주지 주변 복지시설과 행정복지센터 상담 가능 여부를 확인합니다.",
      department: "복지정책과",
      impact_radius_m: 600,
    },
    environment: {
      source_name: "달서구 환경·민원 공개정보",
      source_url: "https://www.dalseo.daegu.kr/index.do?menu_id=10000104",
      impacts: ["환경", "민원", "생활편의"],
      action_guide: "악취나 쓰레기 문제는 발생 시간과 위치를 기록해 민원으로 제출하면 원인 파악에 도움이 됩니다.",
      department: "환경보호과",
      impact_radius_m: 800,
    },
    public_notice: {
      source_name: "달서구 고시공고",
      source_url: "https://www.dalseo.daegu.kr/index.do?menu_id=10000104",
      impacts: ["행정정보", "의견제출", "생활편의"],
      action_guide: "원문 출처를 열어 세부 일정, 담당 부서, 제출 방법을 확인합니다.",
      department: "홍보전산과",
      impact_radius_m: 500,
    },
    event: {
      source_name: "달서구 구민참여·행사 정보",
      source_url: "https://www.dalseo.daegu.kr/index.do?menu_id=10000106",
      impacts: ["행사", "주차", "보행"],
      action_guide: "행사일에는 대중교통을 우선 이용하고 차량 방문은 주변 주차 가능 구역을 미리 확인합니다.",
      department: "문화관광과",
      impact_radius_m: 850,
    },
    urban_plan: {
      source_name: "대구광역시 달서구_개발행위허가정보",
      source_url: "https://www.data.go.kr/data/15099461/fileData.do",
      impacts: ["도시계획", "공사", "재산권"],
      action_guide: "원문에서 허가 위치, 용도지역, 면적, 허가일을 확인하고 생활권 영향이 있으면 담당 부서에 문의합니다.",
      department: "도시디자인과",
      impact_radius_m: 650,
    },
    construction: {
      source_name: "대구광역시 달서구_계약현황",
      source_url: "https://www.data.go.kr/data/15063250/fileData.do",
      impacts: ["공사", "통행", "소음"],
      action_guide: "계약명과 담당 부서를 확인한 뒤 실제 착공 일정, 현장 위치, 통행 제한 여부를 확인합니다.",
      department: "건설과",
      impact_radius_m: 650,
    },
  };

  return defaults[category] ?? defaults.public_notice;
}

function defaultLocationForCategory(category) {
  if (category === "traffic") {
    return {
      address: "대구광역시 달서구 상인동 상인역네거리",
      dong: "상인동",
      lat: 35.8181,
      lng: 128.5378,
    };
  }

  if (category === "parking" || category === "event") {
    return {
      address: "대구광역시 달서구 공원순환로 36",
      dong: "두류동",
      lat: 35.85268,
      lng: 128.55819,
    };
  }

  if (category === "heat" || category === "welfare") {
    return {
      address: "대구광역시 달서구 학산로 45",
      dong: "월성동",
      lat: 35.82982,
      lng: 128.53273,
    };
  }

  return {
    address: "대구광역시 달서구 학산로 45",
    dong: "월성동",
    lat: 35.82982,
    lng: 128.53273,
  };
}

function calculateUrgency(item) {
  if (item.opinion_due_at) {
    return "확인 필요";
  }

  if (item.category === "traffic" || item.category === "safety") {
    return "확인 필요";
  }

  if (item.category === "heat") {
    return "계절 확인";
  }

  return "참고";
}

function validateItems(items) {
  const errors = [];
  const warnings = [];
  const seenIds = new Set();
  const validCategories = new Set([
    "traffic",
    "construction",
    "urban_plan",
    "council",
    "public_notice",
    "event",
    "safety",
    "parking",
    "heat",
    "facility",
    "welfare",
    "environment",
  ]);

  for (const item of items) {
    if (seenIds.has(item.id)) {
      errors.push(`${item.id}: duplicate id`);
    }
    seenIds.add(item.id);

    for (const field of [
      "id",
      "title",
      "category",
      "source_name",
      "source_url",
      "address",
      "dong",
      "summary",
      "plain_summary",
      "action_guide",
      "department",
      "contact",
      "updated_at",
    ]) {
      if (item[field] === undefined || item[field] === null || item[field] === "") {
        errors.push(`${item.id}: missing ${field}`);
      }
    }

    if (!validCategories.has(item.category)) {
      errors.push(`${item.id}: invalid category ${item.category}`);
    }

    if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) {
      errors.push(`${item.id}: invalid coordinates`);
    } else if (item.lat < 35.75 || item.lat > 35.9 || item.lng < 128.45 || item.lng > 128.6) {
      warnings.push(`${item.id}: coordinates outside expected Dalseo/nearby bounds`);
    }

    if (!Array.isArray(item.impacts) || item.impacts.length === 0) {
      errors.push(`${item.id}: impacts must be non-empty`);
    }

    if (!String(item.source_url).startsWith("http")) {
      errors.push(`${item.id}: source_url must be absolute`);
    }
  }

  return {
    item_count: items.length,
    error_count: errors.length,
    warning_count: warnings.length,
    errors,
    warnings,
  };
}

function dedupeItems(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function extractTitle(html) {
  const ogTitle = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  );

  if (ogTitle?.[1]) {
    return decodeEntities(ogTitle[1]).trim();
  }

  const title = html.match(/<title[^>]*>(.*?)<\/title>/is);
  return title?.[1] ? decodeEntities(stripHtml(title[1])).trim() : null;
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function normalizeText(text) {
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function inferDate(text) {
  const match = text.match(/(\d{4})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row[key] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function formatError(error) {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const cause = error.cause instanceof Error ? ` (${error.cause.message})` : "";
  return `${error.message}${cause}`;
}
