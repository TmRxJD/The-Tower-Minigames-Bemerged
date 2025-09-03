
# BeMerged

BeMerged is a Discord Activity game inspired by merge and match-3 mechanics, where players combine modules in a race to get all 16 epics to 5 star ancestral. The game features textures based on The Tower, backgrounds, and a mine and boss mechanic. Playable directly in Discord Activities, BeMerged is built with Vite, Express, and the Discord Embedded App SDK.

## Gameplay Overview

- **Merge modules** on a grid to upgrade them and earn points (shards).
- **Module types**: Cannon, Generator, Armor, Core, each with unique shapes and rarities (Common, Rare, Epic, Legendary, Mythic, Ancestral).
- **Special modules**: Unique Epic modules, mines (hazards), and a boss that can spawn and must be defeated by matching.
- **Dev tools**: Built-in debug/dev console for advanced users.
- **Backgrounds**: Selectable sci-fi backgrounds and visual effects.

## Features

- Fast-paced, single-player puzzle gameplay
- Unique module upgrade and merge system
- Boss battles and mine hazards
- Discord authentication and integration
- Customizable backgrounds and assets
- Built-in developer/debug tools

## Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### 1. Clone the repository
```sh
git clone <your-repo-url>
cd bemerged
```

### 2. Install dependencies

Install client dependencies:
```sh
cd client
npm install
```

Install server dependencies:
```sh
cd ../server
npm install
```

### 3. Configure environment variables

Copy `example.env` to `.env` in the root folder and fill in your Discord application credentials:
```sh
copy example.env .env
```
Edit `.env` and set:
- `VITE_DISCORD_CLIENT_ID` (your Discord app client ID)
- `DISCORD_CLIENT_SECRET` (your Discord app client secret)

### 4. Run the game locally

Start the server:
```sh
cd server
npm start
```

Start the client (in a new terminal):
```sh
cd client
npm run dev
```

The client will be available at the port specified in your Vite config

## How to Play

1. Launch BeMerged as a Discord Activity (or open in browser for local testing).
2. Merge modules by swapping tiles to form groups of 3+ of the same rarity/type.
3. Earn shards, upgrade modules, and defeat the boss when it appears.
4. Avoid mines and use dev tools for advanced options.

## Project Structure

- `client/` — Frontend code (Vite, main game logic, assets, backgrounds)
- `server/` — Backend API (Express, Discord OAuth/token exchange)
- `assets/` — Game images, modules, backgrounds
- `helpers/` — Game logic helpers (e.g., boss logic)

## Discord Integration

The game uses the Discord Embedded App SDK for authentication and Activity integration. You must register a Discord application and set the client ID/secret in your `.env` file.
