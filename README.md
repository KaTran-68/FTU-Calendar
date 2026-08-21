# FTU2 Calendar

A web app that lets FTU2 students paste the class schedule data pulled from the student portal and automatically push the whole semester onto their personal Google Calendar — one color per subject, with a reminder set to fire a chosen number of minutes before each class.

This is a frontend-only project (React + Vite + TypeScript) with no backend — every call to Google Calendar is made straight from the browser via OAuth (Google Identity Services). No server ever holds your data or access token.

## Features

- Paste the schedule JSON → preview how many class sessions and subjects were read.
- Choose how many minutes before each class you want to be reminded (e.g. 45 minutes).
- Creates a dedicated Google Calendar (named `HK-<semester code>`, e.g. `HK-20261`) and pushes every session into it — kept separate from your personal calendar.
- Each subject gets its own color.
- Running it again with the same data won't create duplicate events.

## How to get the schedule data

1. Log in to the FTU2 student portal and open the schedule (thời khoá biểu) page.
2. Open DevTools (F12) → the Network tab, then reload the schedule page.
3. Find the request that returns the schedule JSON (shaped like `{ "data": { "ds_tiet_trong_ngay": [...], "ds_tuan_tkb": [...] }, ... }`) and copy the full response body.
4. Paste it into the input field on the FTU2 Calendar page.

> This data is only ever processed in your browser — it's never sent anywhere except the Google Calendar API.

## Requirements

- Node.js 20+
- A Google Cloud OAuth Client ID (see the guide below)

## Install & run locally

```bash
npm install
cp .env.example .env
# fill in VITE_GOOGLE_CLIENT_ID in .env
npm run dev
```

## Creating a Google OAuth Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) → create a new project (or use an existing one).
2. Go to **APIs & Services → Library** and enable the **Google Calendar API**.
3. Go to **APIs & Services → OAuth consent screen**, choose **External**, fill in the basic info, and add your email to the **Test users** list (while the app is in Testing mode, only these emails can sign in).
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**, and choose **Web application**.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for running the Vite dev server locally)
   - your real domain if you deploy to static hosting (Vercel/Netlify/GitHub Pages…)
6. Copy the generated **Client ID** into your `.env` file:
   ```
   VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   ```

## Scripts

```bash
npm run dev            # start the dev server
npm run build           # production build
npm run preview         # preview the production build
npm run lint             # run ESLint
npm run format           # format the codebase with Prettier
npm run format:check    # check formatting without writing
npm run typecheck       # run the TypeScript compiler
npm test                # run unit tests once (Vitest)
npm run test:watch      # run unit tests in watch mode
```

## Tech stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/) + TypeScript
- [Axios](https://axios-http.com/) for calling the Google Calendar API
- [React Icons](https://react-icons.github.io/react-icons/)
- [Vitest](https://vitest.dev/) + Testing Library

## Privacy notes

- Personal schedule data files (`sample_data.txt` or similar) are never committed to the repo — already covered by `.gitignore`.
- Your Google access token only lives in browser memory (never written to `localStorage`) and is gone on page reload.

---

Made by Ka, for Bống.
