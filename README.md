# MechResearch Global

A mobile-first research discovery app for mechanical-engineering students and researchers.

## Mobile app
The Expo / React Native app provides four main areas:
- **Papers:** search Semantic Scholar for papers, abstracts, authors, publication years, venues and citation counts; open paper links and save useful papers.
- **Researchers:** search authors, view affiliations and metrics, and open researcher profiles.
- **Universities:** search the OpenAlex institution index and open official institution websites when listed.
- **Saved:** session-only reading list.

## Backend
FastAPI service endpoints:
- `GET /health`
- `GET /api/papers?query=...`
- `GET /api/authors?query=...`
- `GET /api/authors/{author_id}`
- `GET /api/universities?query=...`

## Run locally
1. Start the API from `backend/` using the included requirements and Dockerfile.
2. Set `EXPO_PUBLIC_API_URL` to the API base URL. The default `http://10.0.2.2:8000` is for the Android emulator only.
3. In `mobile/`, install dependencies with `npm install`, then run `npx expo start`.

## Deployment and Android builds
- `render.yaml` defines the Render backend service. Deploy the repository through a Render account and set any required Semantic Scholar API key.
- Set `EXPO_PUBLIC_API_URL` to the deployed HTTPS API URL in the EAS build environment.
- `mobile/eas.json` includes a preview APK profile and production Android App Bundle profile.
- Signed Android builds require an authenticated Expo/EAS account and have not yet been generated.

## Automated checks
GitHub Actions runs backend tests and mobile TypeScript / Expo Doctor checks on pushes and pull requests.

## Limitations
This is an MVP, not a production release. Saved papers are stored only in app memory and are lost when the app restarts. No accounts, cloud sync, push notifications, admin dashboard, supervisor-contact workflow or verified worldwide lab directory are included. Semantic Scholar and OpenAlex data can be incomplete; verify affiliations, current roles, admissions and supervisor availability on official institution websites.
