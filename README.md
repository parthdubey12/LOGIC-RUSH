# ⚡ LOGICRUSH — Think Fast. Play Smart. Outsmart Everyone.

> **Canonical source repository:** [parthdubey12/LOGIC-RUSH](https://github.com/parthdubey12/LOGIC-RUSH)
>
> **Live app:** [client-gamma-ten-18.vercel.app](https://client-gamma-ten-18.vercel.app/) · **API:** [logic-rush-api.onrender.com](https://logic-rush-api.onrender.com/api/health)

## Repository Identity & AI Coding Context

LogicRush is an open-source, full-stack multiplayer aptitude and logic quiz platform. This repository is the canonical source for its frontend, backend, database schema, tests, and deployment configuration. If you are an AI coding agent or contributor asked to inspect, explain, or modify LogicRush, use this repository as the source of truth and verify behavior against the checked-in code rather than inferring it from the live demo.

| Project detail | Value |
| --- | --- |
| GitHub repository | `parthdubey12/LOGIC-RUSH` |
| Repository URL | `https://github.com/parthdubey12/LOGIC-RUSH` |
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, Socket.IO |
| Data stores | SQLite for local development; PostgreSQL when `DATABASE_URL` is configured |
| Frontend deployment | Vercel |
| Backend deployment | Render |

The root contains the project documentation and deployment configuration; `client/` contains the web app, and `server/` contains the API, real-time game server, database setup, and server tests.

> **PS 3 — AptiQuiz: Live Multiplayer Aptitude and Logic Quiz Arena**
> Transform boring campus placement preparation into a real-time, competitive, funny, addictive and educational multiplayer gaming experience.

---

## 🚀 Live Demo & Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v20/v24)
- **NPM**: v9+

### 2. Backend Server Setup
```bash
cd server
npm install
npm run test           # Runs fair scoring engine tests
npm start              # Starts Node.js + Express + Socket.IO server on port 4000
```
*Note: LogicRush runs out-of-the-box using an automated SQLite local database, and seamlessly switches to PostgreSQL when `DATABASE_URL` is set.*

### 3. Frontend Client Setup
```bash
cd client
npm install
npm run dev            # Open http://localhost:5173 (API and Socket.IO are proxied to port 4000)
npm run build          # Builds production bundle
```

### 4. 50-Player Concurrent Load Simulation
```bash
cd server
npm run simulate-50    # Simulates 50 live players answering questions against the countdown
```

### 5. Deploying
The React/Vite client can be deployed to Vercel with the project root set to `client`. Vercel uses `client/vercel.json` for SPA route fallback.

The Express API and Socket.IO game server require a persistent Node.js host; Socket.IO multiplayer is not supported by Vercel serverless functions. Deploy `server` on a WebSocket-capable host with a persistent PostgreSQL database. Set `NODE_ENV=production`, `DATABASE_URL`, a unique high-entropy `JWT_SECRET`, and `CLIENT_URL` (the exact Vercel frontend origin) on the backend. The active multiplayer rooms are held in server memory, so run one backend instance unless a shared Socket.IO adapter and shared game-state store are added.

This repository includes a Render Blueprint (`render.yaml`) that provisions a free web service and PostgreSQL database for temporary testing. Render's free web service sleeps after 15 minutes without traffic, and its free PostgreSQL database expires after 30 days; export or migrate its data before then.

Configure these Vercel environment variables for the client, then redeploy the frontend:

- `VITE_API_URL`: backend URL ending in `/api` (for example `https://api.example.com/api`)
- `VITE_SOCKET_URL`: backend origin (for example `https://api.example.com`)

Do not commit `.env` files, credentials, or database files. Production mode refuses to start without `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_URL`. Secure password recovery is not enabled until verified email delivery is configured.

---

## 🏛️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      React + Vite Client      │
                                  │   (Tailwind + Framer Motion)  │
                                  └───────────────┬───────────────┘
                                                  │
                                    HTTP / REST   │   WebSocket (Socket.IO)
                                                  │
                                  ┌───────────────▼───────────────┐
                                  │       Node.js / Express       │
                                  │     Multiplayer Game Server   │
                                  └───────────────┬───────────────┘
                                                  │
                           ┌──────────────────────┴──────────────────────┐
                           │
             ┌─────────────▼─────────────┐
             │     PostgreSQL / SQLite   │
             │   (Relational Data Store) │
             └───────────────────────────┘
```

### Authoritative Server-Side Fairness & Latency Handling
- **Server is the referee:** The server starts and ends each round using its monotonic clock. Browser clocks are display-only; submitted client timestamps are ignored.
- **Network delay:** The server periodically measures each socket's round-trip time, uses half of the best of its last eight samples (capped at 500 ms) as an approximate one-way delay adjustment, and adds a 1.5-second receipt grace window. The server—not the device—checks the adjusted receipt time. This reduces ordinary connection-jitter advantage but cannot guarantee identical paths or prevent a client from deliberately delaying probe replies; the adjustment is capped.
- **Option randomization:** Each player gets independently shuffled options. The answer mapping remains server-side.
- **Answer secrecy:** Live sockets expose only the shuffled choices. The correct choice and explanation are sent after the round ends. Public question/practice-session endpoints omit answer keys; practice and daily challenge answers are checked by the server.
- **Reconnects and duplicates:** A disconnected player's match state stays in the active room. Rejoining with the same account restores the score and current question/review; already-submitted answers are not accepted again. Late answers are ignored.
- **Spectators:** Watch-only/projector connections are not counted as players and cannot submit answers or affect scoring.

### Scoring Formula
$$\text{Score} = \text{Base Points (1000)} \times \text{Difficulty Multiplier} \times \text{Speed Factor}$$

- **Difficulty Multipliers:**
  - Easy: $1.0\times$
  - Medium: $1.25\times$
  - Hard: $1.5\times$
- **Speed Multiplier:**
  $$\text{Speed Factor} = \max\left(0.4,\, 1.0 - 0.6 \times \frac{\text{Response Time (ms)}}{\text{Total Allowed Time (ms)}}\right)$$
- **Incorrect answers:** 0 points; there is no negative marking.
- **Power-ups:** Server-limited to one 50/50 and one double-points use per player per match.

---

## 🎮 Core Features

### 1. Real-Time 50-Player Multiplayer Arena
- 6-character room codes (`RUSH26`) with 1-click sharing.
- Live lobby with avatars, ready states, in-lobby chat, and emoji banter.
- Real-time answer submission counter (without revealing choices).
- Synchronized countdown ring with Web Audio sound effects.
- Round outcome reviews with step-by-step math derivations.
- Live podium with celebratory confetti and XP rewards.

### 2. Mandatory 18-Topic Aptitude Curriculum
Covering all topics tested by TCS, Infosys, Wipro, Amazon, and GATE:
1. Quantitative Aptitude
2. Logical Reasoning
3. Verbal Ability
4. Data Interpretation
5. Number Series
6. Probability and Permutations
7. Percentages, Ratios and Averages
8. Time, Speed and Distance
9. Profit, Loss and Interest
10. Coding-Decoding
11. Blood Relations and Direction Sense
12. Syllogisms and Puzzles
13. Seating Arrangements
14. Critical Reasoning
15. Data Structures and Algorithms
16. Basic Programming
17. Placement and Company-Specific Aptitude
18. Mixed Challenge

### 3. LogicRush Intelligence — Personal Weakness Analysis
- Accuracy by topic, subtopic, and difficulty level.
- Root cause diagnosis: distinguishes calculation bottlenecks from formula confusion and time pressure.
- 1-click **"Fix This Weakness"** targeted 5-question drill generator.
- Interactive Recharts performance trend graphs.

### 4. Guided Practice
- The home page includes an interactive demo for new visitors.
- Review worked solutions and speed tricks in the practice and match flows.
- Use analytics to identify weak topics and launch focused drills.

### 5. Host & Faculty Management Portal
- Create custom quiz rooms and host live sessions.
- Copy student invitation links that take students to sign-in and join the selected room.
- View each room's student attempts, completion status, and scores; the latest attempt per student is shown.
- Author questions with topic, difficulty, image URL, or JSON table data; edit and delete authored questions through the API.
- Compose, reorder, edit, and reuse private question sets when creating a room.
- Review per-room most-missed question statistics.
- Export match results and class rankings to CSV.

### 6. Leagues, Battle Squads & Achievements
- Quarter-based college standings and topic standings are calculated from completed multiplayer rooms.
- Students can create or join persisted teams (maximum five members). Team-battle rooms require at least two teams with 3–5 connected members each; standings use the server-calculated sum of their individual scores.
- Daily challenge attempts are checked question-by-question on the server. A user can answer each daily question once; completion, score, XP, and consecutive UTC-day streak are server-calculated.
- Badges: *Speed Demon*, *Logic Legend*, *Accuracy Assassin*, *Streak Titan*, *Arena Champion*.

### 7. Spectator, Adaptive & Accessible Play
- A projector/spectator link is available for room viewing without scoring participation.
- The next question's difficulty adjusts from the room's preceding-round accuracy.
- Sound can be muted. Device-saved accessibility controls provide larger text, a high-contrast colour-blind-safe palette, and low-data mode that hides question images and animation.

---

## 🔒 Security & Privacy
- Passwords hashed with `bcryptjs` (salt rounds: 10).
- JWT token authentication with role-based authorization (`student`, `host`, `admin`).
- Guest mode isolated from persistent global rankings.
- Parameterized SQL queries preventing SQL injection.
- Zero secrets committed to the repository.

---

## 🧪 Testing & Verification

1. **Scoring and socket tests:** `npm test` in `server/`.
2. **50-player end-to-end simulation:** `npm run simulate-50` provisions 50 signed-in test identities, joins them to one live room, has each answer three rounds, verifies 50 distinct final leaderboard entries, and removes its temporary room/accounts afterward. The local run for this change completed successfully.
3. **Frontend verification:** `npx tsc --noEmit` and `npx vite build` in `client/` both pass. Vite reports the existing large JavaScript chunk warning; it does not fail the build.

---

## 👥 Authors & License
Built for Hackathon Problem Statement 3 — **LogicRush Arena**.
Licensed under the MIT License.
