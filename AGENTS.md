# Repository Guidelines

## Project

This repository contains the MVP for **달서 AI 내 주소 영향 요약 서비스**.

The app uses local JSON data instead of uploading to Supabase. Collected data is stored under `data/`, and the Next.js API reads `data/impact-items.json`.

## Commands

```bash
npm run collect:data
npm run dev
npm run lint
npm run build
```

Run `npm run collect:data` before demos when the local public-data snapshot should be refreshed.

## Data

- `data/raw/*.html`: collected source HTML
- `data/sources.json`: source collection metadata
- `data/impact-items.json`: normalized data consumed by `/api/impacts`
- `data/SOURCE_NOTES.md`: source notes and limitations

Do not commit secrets or local `.env*` files. The MVP does not require runtime environment variables.

## Implementation Notes

- Keep the map client-only via dynamic import because Leaflet depends on browser APIs.
- Keep coordinates and `impact_radius_m` explicit in normalized data until a geocoding pipeline is added.
- If database storage is restored later, use `supabase/schema.sql` as the migration reference.
