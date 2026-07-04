# 달서 AI 내 주소 영향 요약 MVP

달서구 고시공고, 도시계획, 구의회 회의록, 교통통제, 주차, 안전, 복지, 환경 데이터를 주민 주소 기준으로 요약하는 공공서비스 MVP입니다.

현재 구현은 생성형 AI API를 호출하지 않습니다. 서비스명에는 `AI`가 포함되어 있지만, MVP 런타임은 공식·공공 데이터 수집본과 규칙 기반 거리/긴급도/출처 점수로 생활영향 요약을 생성합니다. 실제 AI 원문 요약은 API 키, 원문 파서, 검수 흐름이 준비된 뒤 붙이는 다음 단계입니다.

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local JSON data store
- Vercel

## 로컬 실행

```bash
npm install
npm run collect:data
npm run validate:data
npm run dev
```

## 로컬 데이터 수집

현재 MVP는 Supabase에 업로드하지 않고 로컬 파일에 데이터를 저장합니다.

```bash
npm run collect:data
```

생성되는 파일:

- `data/impact-items.json`: 앱 API가 읽는 정규화 데이터
- `data/sources.json`: 수집 출처, HTTP 상태, 원문 파일 위치
- `data/source-catalog.json`: 출처별 예상 필드와 수집 리스크
- `data/collection-report.json`: 수집 결과와 검증 요약
- `data/raw/*.html`: 공식 사이트 원문 HTML
- `data/SOURCE_NOTES.md`: 활용 출처와 데이터 한계

`/api/impacts` 응답의 `source` 값이 `local_file`이면 로컬 수집 데이터를 읽고 있는 상태입니다. `data/impact-items.json`이 없으면 앱은 MVP 시연용 샘플 데이터로 동작합니다.

추적 가능한 장시간 수집 인벤토리는 별도 명령으로 생성합니다.

```bash
npm run collect:deep -- --minutes=20
```

생성되는 파일:

- `data/deep-collection-report.json`: 실제 수집 시작/종료 시각, 소요 시간, 페이지/링크/다운로드 후보 수
- `data/deep-links.json`: 수집된 공식·공공 링크 인벤토리
- `data/deep-raw/*.html`: 심화 수집 원문 HTML

## 데이터 수집 MVP 방향

- 1단계: 달서구청, 달서구의회, 대구시, 공공데이터포털, D-데이터허브 출처를 `data/source-catalog.json`에 정리
- 2단계: 공식 웹/공공데이터 메타데이터 원문을 `data/raw`에 저장
- 3단계: 출처별 제목, 수집 상태, 원문 링크, 위치, 영향 유형을 `data/impact-items.json`으로 정규화
- 4단계: 공공데이터포털, 대구교통종합정보, 대구 주차정보, 생활안전지도 기반 생활영향 항목을 지도 표시용 데이터로 정규화
- 5단계: `npm run validate:data`로 스키마, 출처 연결, 좌표, 날짜, URL을 검증
- 6단계: 목록 API가 확인되는 출처는 수집기를 확장해 최신 공고를 자동 추가
- 7단계: DB가 필요해지는 시점에 `supabase/schema.sql` 구조로 이관

## API

- `GET /api/impacts?address=달서구청&radius=1000`: 주소 기반 생활영향 검색
- `GET /api/sources`: 수집 출처, 출처 유형, 수집 상태 목록
- `GET /api/collection-report`: 최근 로컬 수집 리포트

## 지도 기능

- 사용자가 입력한 기준 위치를 지도에 표시
- 선택한 검색 반경을 원으로 표시
- 각 이슈의 위치와 예상 영향범위(`impact_radius_m`)를 원으로 표시
- 목록에서 이슈를 선택하면 지도 초점과 상세 요약이 함께 바뀜

## 운영 확인

```bash
npm run lint
npm run build
npm run validate:data
```

배포 API 확인:

```bash
curl "https://dalseo-ai-impact.vercel.app/api/impacts?address=달서구청&radius=1000"
```

응답 예시:

```json
{
  "source": "local_file",
  "radius_m": 1000,
  "items": []
}
```

## 배포

Vercel에서 새 프로젝트로 import한 뒤 배포합니다. 로컬 수집 파일을 포함해 배포하면 배포 환경에서도 같은 데이터로 동작합니다.

```bash
vercel
vercel --prod
```
