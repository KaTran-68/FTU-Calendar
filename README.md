# FTU2 Calendar - By Ka, for Bống

A web app that lets FTU2 students upload the class schedule Excel file exported from the student portal and automatically push the whole semester onto their personal Google Calendar — one color per subject, with a reminder set to fire a chosen number of minutes before each class.

This is a frontend-only project (React + Vite + TypeScript) with no backend — every call to Google Calendar is made straight from the browser via OAuth (Google Identity Services). No server ever holds your data or access token.

## Features

- Sign in with Google, upload the schedule Excel file, and push the whole semester onto your calendar in one click.
- Choose how many minutes before each class you want to be reminded (e.g. 45 minutes).
- Creates a dedicated Google Calendar (named `HK-<semester code>`, e.g. `HK-20261`) and pushes every session into it — kept separate from your personal calendar.
- Each subject gets its own color.
- Shows live progress as events are created.
- Running it again with the same data won't create duplicate events.

## How to get the schedule data

1. Log in to the FTU2 student portal and open the schedule (thời khoá biểu) page.
2. Export/download it as an Excel file (`.xlsx`) — columns: `Mã MH`, `Tên môn học`, `Nhóm tổ`, `Số tín chỉ`, `Lớp`, `Thứ`, `Tiết bắt đầu`, `Số tiết`, `Phòng`, `Giảng viên`, `Thời gian học`.
3. Upload that file on the FTU2 Calendar page.

> This file is only ever processed in your browser — it's never sent anywhere except the Google Calendar API.

## Requirements

- Node.js 20+
- A Google Cloud OAuth Client ID

## Install & run locally

```bash
npm install
cp .env.example .env
# fill in VITE_GOOGLE_CLIENT_ID in .env
npm run dev
```

## Deployment

This is a static site (no backend), so any static host works: Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc.

```bash
npm run build
```

This produces a `dist/` folder ready to deploy. Whichever host you use:

1. Set the `VITE_GOOGLE_CLIENT_ID` environment variable in your host's project settings (same value as in your local `.env`).
2. Add the deployed URL (e.g. `https://ftu2-calendar.vercel.app`) to **Authorized JavaScript origins** on your OAuth Client ID in the [Google Cloud Console](https://console.cloud.google.com/), otherwise Google sign-in will fail on the live site.

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
- [SheetJS (xlsx)](https://sheetjs.com/) for reading the schedule Excel file
- [React Icons](https://react-icons.github.io/react-icons/)
- [Vitest](https://vitest.dev/) + Testing Library

## Privacy notes

- Personal schedule files (`sample_data.txt`, `*.xlsx`, or similar) are never committed to the repo — already covered by `.gitignore`.
- Your Google access token only lives in browser memory (never written to `localStorage`) and is gone on page reload.

---

Made by Ka, for Bống.
