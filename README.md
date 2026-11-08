# MechResearch Global

Mobile-first research discovery app for mechanical-engineering students and researchers.

## Current MVP
- Research-paper search via Semantic Scholar through a FastAPI backend.
- Researcher search and profile lookup.
- Global institution search via OpenAlex.
- Session-only saved papers.
- Illustrative lab categories (not a verified live lab directory).

## Project status
This repository is being initialized from the prepared source project. The current handoff is an MVP, not a published or production-ready app. Backend tests passed (2/2), but mobile dependency installation timed out in the build environment; Expo Doctor, full TypeScript typecheck, signed Android APK/AAB builds, public backend deployment, and physical-device testing remain outstanding.

## Architecture
- `mobile/`: Expo / React Native / TypeScript app
- `backend/`: FastAPI service
- `render.yaml`: Render deployment blueprint

## Backend API
- `GET /health`
- `GET /api/papers?query=...`
- `GET /api/authors?query=...`
- `GET /api/authors/{author_id}`
- `GET /api/universities?query=...`

## Deployment
Deploy the `backend/` service using the included Dockerfile and Render blueprint. Then set `EXPO_PUBLIC_API_URL` in the Expo/EAS build environment to the public HTTPS backend URL.

## Android builds
The Expo EAS profiles are configured for:
- Preview: installable APK
- Production: Google Play AAB

An authenticated Expo/EAS owner session is required to create signed builds. No APK or AAB is committed here.

## Important limitations
No user accounts, cloud sync, push notifications, admin dashboard, supervisor-contact workflow, or verified live lab database are implemented. Researcher and university metadata should be checked against official institution sources.
