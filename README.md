
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

## Code Quality & Linting

This project uses ESLint and Prettier to maintain code quality and consistency.

### Available Scripts

From the root directory:

```sh
# Lint all workspaces (client and server)
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is properly formatted
npm run format:check
```

From individual workspaces:

```sh
# Client
cd client
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Server
cd server
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

### Linting Rules

The project follows these coding standards:
- **ESLint**: JavaScript code quality and style
- **Prettier**: Code formatting consistency
- **EditorConfig**: Consistent editor settings

### Key Rules
- 2-space indentation
- Single quotes for strings
- Semicolons always required
- Trailing commas in multi-line structures
- Maximum line length: 120 characters
- Consistent spacing and formatting

### IDE Integration

Most modern editors support ESLint and Prettier automatically. Make sure to:
1. Install the ESLint and Prettier extensions
2. Configure your editor to format on save
3. The `.editorconfig` file ensures consistent settings across different editors

### Pre-commit Hooks (Optional)

Consider setting up pre-commit hooks to automatically lint and format code before commits:

```sh
# Install husky and lint-staged
npm install --save-dev husky lint-staged

# Set up pre-commit hook
npx husky add .husky/pre-commit "npm run lint:fix && npm run format"
```
