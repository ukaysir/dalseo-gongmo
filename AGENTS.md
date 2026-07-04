# AGENTS.md

## Project Identity

This repository is the MVP for **달서 AI 내 주소 영향 요약**.

The product is a Korean civic-tech public-service demo for Dalseo-gu, Daegu. A resident enters an address or nearby place, selects a search radius, and sees public administration issues around that location with a map, easy Korean summaries, source links, and resident action guidance.

The MVP should be positioned as:

> 달서구 주민이 주소를 입력하면 반경 내 행정, 교통, 안전, 복지, 환경 이슈를 지도에서 확인하고, 각 이슈가 내 생활에 미치는 영향을 쉬운 말 요약과 행동 가이드로 확인하는 서비스.

Do not treat this as a generic landing page or marketing site. Build and maintain it as a usable dashboard-style public-service web app.

## Confirmed MVP Features

These features define the current product scope. Prioritize these before adding larger platform features.

### 1. Address-Based Impact Search

Users can search by address or known Dalseo-gu place name.

Required behavior:

- Address/place search input.
- Quick location chips such as `달서구청`, `상인역`, `월성동`, `두류공원`, `성서산업단지역`.
- Radius selector: `500m`, `1km`, `2km`.
- Resolve the search input to a center coordinate.
- Filter impact items by distance from the center.
- Show distance and relevance score for each result.

Current limitation:

- The MVP does not have a real geocoding pipeline.
- Unknown addresses may fall back to a default Dalseo-gu coordinate.
- If working on UX copy, make this limitation clear without making the service feel broken.

### 2. Nearby Issue List

Show administrative/public issues as resident-facing cards, not raw public-document records.

Each issue card should include:

- Category badge.
- Distance from searched location.
- Relevance score.
- Title.
- Easy Korean summary.
- Impact tags such as `통행`, `주차`, `소음`, `보행`, `상권`, `통학`, `안전`.
- Opinion-deadline status when available.
- Source name or source type.

Supported categories:

- `traffic`: 교통통제
- `construction`: 공사
- `urban_plan`: 도시계획
- `council`: 의회
- `public_notice`: 고시공고
- `event`: 행사
- `safety`: 안전
- `parking`: 주차
- `heat`: 무더위쉼터
- `facility`: 공공시설
- `welfare`: 복지
- `environment`: 환경

### 3. Map-Based Impact View

The map is a core feature and should remain prominent.

Required behavior:

- Show the searched location marker.
- Show the selected search-radius circle.
- Show issue markers.
- Show each issue's expected impact radius using `impact_radius_m`.
- Selecting an issue in the list focuses or highlights the related marker.
- Selecting a marker updates the selected issue detail.

Implementation note:

- Leaflet must stay client-only because it depends on browser APIs.
- Use dynamic import for the map component.

### 4. Resident-Friendly Impact Summary

The summary panel should explain the search result in plain Korean.

Required behavior:

- Show how many relevant issues were found.
- Mention the nearest issue distance.
- Summarize the most common impact types.
- Highlight whether any issue has an opinion submission deadline.
- Provide concrete next actions.

Important wording:

- The current app does not call a real LLM.
- Avoid overstating "AI" behavior in code comments or UX copy unless an actual AI API is added.
- Good labels: `생활영향 요약`, `쉬운말 요약`, `다음 행동`.
- Acceptable brand text: `달서 AI 내 주소 영향 요약`, because it is the service name.

### 5. Issue Detail Panel

The selected issue detail should help a resident decide what to do next.

Required fields:

- Title.
- Source name.
- Source URL.
- Address.
- Distance.
- Period.
- Opinion due date.
- Department.
- Contact.
- Plain summary.
- Resident action guide.
- Original source button: `원문 출처 열기`.

### 6. Source Transparency

The MVP uses mixed local data, collected source HTML, and demo-normalized public-data items. Make the source status transparent.

Required behavior when working on data/UI:

- Show source name.
- Show original source link.
- Show collected or updated date when available.
- Keep a disclaimer that summaries are for reference and the original source is authoritative.

Useful copy:

> 요약은 이해를 돕기 위한 참고 정보이며, 최종 내용은 원문과 담당 부서 확인이 필요합니다.

## Near-Term Enhancements

After the confirmed MVP features are solid, prioritize these additions.

### Category Filter

Add filtering by issue category:

- 전체
- 교통
- 주차
- 도시계획
- 안전
- 복지
- 환경
- 공공시설
- 의견 제출 가능

### Urgency Badge

Add a simple urgency/status label to issue cards:

- `긴급`: starts soon, deadline soon, or safety/traffic issue nearby.
- `확인 필요`: has deadline, active period, or strong resident impact.
- `참고`: lower urgency informational item.
- `마감 임박`: opinion deadline is close.

### Better Address Coverage

Expand `addressCandidates` with more Dalseo-gu places before integrating a full geocoding API.

Future geocoding candidates:

- VWorld
- 행정안전부 도로명주소 API
- Kakao or Naver local search API, if allowed for the deployment context.

## Later-Stage Features

Do not implement these before the MVP dashboard is stable unless explicitly requested.

### Real AI Summarization

If an AI API is added, it should transform official source text into structured `ImpactItem` fields:

- `plain_summary`
- `impacts`
- `address`
- `starts_at`
- `ends_at`
- `opinion_due_at`
- `department`
- `contact`
- `action_guide`

The AI output must be treated as draft data and should preserve source links.

### Opinion Draft Generation

A future feature may allow users to generate an opinion submission draft for a selected issue.

Recommended inputs:

- Selected issue.
- User concern type: 주차, 소음, 통행, 안전, 상권, 보행.
- User stance: 찬성, 반대, 개선 요청.

### Saved Address Alerts

Future alert features require persistence and possibly authentication/contact handling:

- Save an interested address.
- Set radius.
- Notify on new nearby public notice.
- Notify before opinion deadline.
- Notify before traffic-control start.

Do not add this to the MVP without also addressing privacy and data retention.

## Current Architecture

The app reads Supabase first, falls back to local JSON data, and merges selected live public API records when credentials are available.

Runtime data flow:

1. User searches from the dashboard.
2. The client calls `/api/impacts`.
3. The API reads Supabase through `src/lib/data-source.ts`.
4. If Supabase is unavailable or empty, the API reads `data/impact-items.json`.
5. If local data is missing, the API falls back to sample data.
6. `src/lib/live-impact-data.ts` adds compatible public API items such as Daegu incident traffic data and slow traffic segments.
7. Distance and relevance are calculated in `src/lib/geo.ts`.
8. Search insight text is generated in `src/lib/insight.ts`.
9. The dashboard renders summary, map, issue list, detail panel, and lifestyle coach.

Important files:

- `src/app/page.tsx`: main dashboard UI.
- `src/app/api/impacts/route.ts`: impact search API.
- `src/app/api/sources/route.ts`: local source collection status API.
- `src/app/api/collection-report/route.ts`: local collection report API.
- `src/components/ImpactMap.tsx`: Leaflet map.
- `src/lib/types.ts`: shared data types.
- `src/lib/geo.ts`: address resolution, distance, relevance scoring.
- `src/lib/insight.ts`: resident-facing result summary.
- `src/lib/local-data.ts`: local JSON reader.
- `src/lib/data-source.ts`: Supabase-first data access with local fallback.
- `src/lib/live-impact-data.ts`: public API integration and normalization.
- `src/lib/supabase.ts`: server Supabase client.
- `src/lib/sample-data.ts`: fallback sample data and known address candidates.
- `data/impact-items.json`: normalized local MVP data.
- `data/sources.json`: source metadata.
- `scripts/collect-local-data.mjs`: local data collection/generation script.
- `scripts/sync-supabase-data.mjs`: uploads normalized local JSON to Supabase.
- `supabase/schema.sql`: database schema.

## Commands

Use these commands from the repository root:

```bash
npm run collect:data
npm run collect:deep -- --minutes=20
npm run validate:data
node scripts/sync-supabase-data.mjs
npm run dev
npm run lint
npm run build
```

Run `npm run collect:data` before demos when the local public-data snapshot should be refreshed.

Run `npm run collect:deep -- --minutes=20` when a traceable long-form web collection inventory is needed. It writes ignored raw/deep artifacts without replacing the normalized app data.

Run `npm run validate:data` after collection to check item schema, source linkage, coordinates, dates, and source health.

Run `npm run lint` and `npm run build` after meaningful source changes.

## Data Guidelines

Data files:

- `data/sources.json`: source collection metadata.
- `data/source-catalog.json`: source catalog, expected fields, and collection risks.
- `data/collection-report.json`: collection counts and validation summary.
- `data/impact-items.json`: normalized data consumed by `/api/impacts`.
- `data/SOURCE_NOTES.md`: source notes and limitations.

Ignored generated artifacts:

- `data/raw/*.html`: collected source HTML.
- `data/deep-collection-report.json`: long-form web collection timing and page/link counts.
- `data/deep-links.json`: collected official/public link inventory.
- `data/deep-raw/*.html`: long-form web collection raw HTML.

Rules:

- Keep coordinates explicit until a geocoding pipeline is added.
- Keep `impact_radius_m` explicit for map display.
- Preserve original source URLs.
- Do not remove source transparency copy.
- Do not commit secrets or local `.env*` files.
- Supabase-backed runtime uses `NEXT_PUBLIC_SUPABASE_URL` and a server key. Local JSON fallback still works without them.
- Do not expose source-collection placeholder records as resident results. Search results must describe the possible real-life impact, not the crawler state.

## Supabase Notes

Supabase is used at runtime when configured. Keep the fallback path intact so demos work without remote credentials.

Live public API credentials use `DATA_GO_KR_SERVICE_KEY`. The currently connected runtime endpoints are:

- `https://apis.data.go.kr/6270000/service/rest/dgincident`
- `https://apis.data.go.kr/6270000/service/rest1/linkspeed`

The Dalseo transport endpoint `https://apis.data.go.kr/3470000/dalseoTransport` is documented as a next integration target, but keep it out of runtime merges until the service key returns successful responses for the requested operations.

## UX And Design Direction

The UI should feel like a real Korean local-government pilot service:

- Practical, trustworthy, and easy to scan.
- Dashboard-first, not landing-page-first.
- Korean copy should be concise and resident-friendly.
- Keep visual hierarchy clear: search, summary, map, issue list, detail.
- Use subtle civic green/teal accents with neutral backgrounds.
- Use category colors meaningfully, especially on map markers and badges.
- Avoid decorative layouts that reduce dashboard usability.

## AI Positioning

The current MVP does not call a generative AI API. Treat the visible summaries as data-driven, rule-based resident guidance generated from official/public source metadata and normalized local records.

Use `달서 AI 내 주소 영향 요약` only as the service name. In functional copy, prefer `생활영향 요약`, `쉬운말 요약`, and `공식·공공 데이터 기반 요약`. Do not claim that the current runtime performs LLM summarization unless an actual AI API and review flow are added.

## Non-Goals For The Current MVP

Do not prioritize these unless explicitly requested:

- Full authentication.
- Saved user profiles.
- Notification delivery.
- Admin dashboard.
- Large-scale crawler architecture.
- Vector database or RAG pipeline.
- Opinion draft generation.

These are valid future features, but they should not distract from making the current address-impact dashboard reliable and demo-ready.
