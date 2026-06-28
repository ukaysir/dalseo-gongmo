# 달서 AI 내 주소 영향 요약 MVP

달서구 고시공고, 도시계획, 구의회 회의록, 교통통제 데이터를 주민 주소 기준으로 요약하는 공공서비스 MVP입니다.

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
- `data/raw/*.html`: 공식 사이트 원문 HTML
- `data/SOURCE_NOTES.md`: 활용 출처와 데이터 한계

`/api/impacts` 응답의 `source` 값이 `local_file`이면 로컬 수집 데이터를 읽고 있는 상태입니다. `data/impact-items.json`이 없으면 앱은 MVP 시연용 샘플 데이터로 동작합니다.

## 데이터 수집 MVP 방향

- 1단계: 달서구 고시공고, 달서구의회, 대구 교통정보 원문을 `data/raw`에 저장
- 2단계: 원문에서 제목, 출처, 위치, 영향 유형을 뽑아 `data/impact-items.json` 생성
- 3단계: 공공데이터포털, 대구교통종합정보, 대구 주차정보, 생활안전지도 기반 생활영향 항목을 지도 표시용 데이터로 정규화
- 4단계: 목록 API가 확인되는 출처는 수집기를 확장해 최신 공고를 자동 추가
- 5단계: DB가 필요해지는 시점에 `supabase/schema.sql` 구조로 이관

## 지도 기능

- 사용자가 입력한 기준 위치를 지도에 표시
- 선택한 검색 반경을 원으로 표시
- 각 이슈의 위치와 예상 영향범위(`impact_radius_m`)를 원으로 표시
- 목록에서 이슈를 선택하면 지도 초점과 상세 요약이 함께 바뀜

## 운영 확인

```bash
npm run lint
npm run build
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
