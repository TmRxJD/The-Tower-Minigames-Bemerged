# BeMerged

BeMerged is a browser-based merge puzzle game inspired by The Tower modules.

## What changed

This project is now browser-first:
- Discord Activity SDK integration removed
- Discord OAuth token exchange endpoint removed
- Client runs directly with Vite
- Client and server source are TypeScript (`.ts`)
- Optional server now serves built static files only

## Run locally (development)

From the repository root:

```sh
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

## Build

```sh
npm run build
```

## Preview production build

```sh
npm run preview --workspace=client
```

## Optional static server

Build first, then run:

```sh
npm run build
npm run server
```

This serves `client/dist` at `http://localhost:3002` by default.

## Project structure

- `client/main.ts` — game runtime entry and startup API
- `client/game/*` — game rules, matching, spawn, and merge logic
- `client/entities/*` — module, mine, boss, and inventory domain logic
- `client/ui/*` — board, inventory, score, controls, and debug UI
- `client/utils/*` — reusable helpers, timer, storage, and formatting
- `server/server.ts` — static file serving for built client

## Vue + TypeScript host integration

The game runtime now exports:

- `startBemergedGame()` from `client/main.ts`

Your parent Vue/TS site can mount the game container (`#app`) and call that function once the game bundle is loaded.
