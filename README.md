# ⚡ LOGICRUSH — Think Fast. Play Smart. Outsmart Everyone.

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
- **Server-Side Timers:** The server sets the official question start timestamp (`startTime`) and end deadline. Client clocks are never trusted as the scoring authority.
- **Latency Tolerance Window:** A 1.5-second buffer is granted to accommodate variable network latencies without penalizing high-ping participants.
- **Option Randomization:** Answer option order is shuffled deterministically/randomly per player while preserving the correct option mapping on the server.
- **Answer Secrecy:** The correct answer index and explanations are never sent over the network until the server officially closes the round.

### Scoring Formula
$$\text{Score} = \text{Base Points (1000)} \times \text{Difficulty Multiplier} \times \text{Speed Factor}$$

- **Difficulty Multipliers:**
  - Easy: $1.0\times$
  - Medium: $1.25\times$
  - Hard: $1.5\times$
- **Speed Multiplier:**
  $$\text{Speed Factor} = \max\left(0.4,\, 1.0 - 0.6 \times \frac{\text{Response Time (ms)}}{\text{Total Allowed Time (ms)}}\right)$$
- **Negative Marking:** Optional host setting ($-250$ points for incorrect answers).

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
- Question bank builder (Add, edit, delete, categorize).
- Host-reviewed question authoring and management.
- Export match results and class rankings to CSV.

### 6. Leagues, Battle Squads & Achievements
- Global and Inter-College League standings.
- Campus teams and battle squads.
- Daily challenges with consecutive streak tracking.
- Badges: *Speed Demon*, *Logic Legend*, *Accuracy Assassin*, *Streak Titan*, *Arena Champion*.

---

## 🔒 Security & Privacy
- Passwords hashed with `bcryptjs` (salt rounds: 10).
- JWT token authentication with role-based authorization (`student`, `host`, `admin`).
- Guest mode isolated from persistent global rankings.
- Parameterized SQL queries preventing SQL injection.
- Zero secrets committed to the repository.

---

## 🧪 Testing & Verification

1. **Scoring Engine Tests:** `npm test` in `server/` verifies base points, difficulty multipliers, speed decay, and negative marking.
2. **50-Player Load Simulation:** `node tests/simulate_50_players.js` verifies concurrent room joins, synchronized question delivery, and podium computation.
3. **Frontend Build:** `npm run build` in `client/` produces a production bundle with 0 errors.

---

## 👥 Authors & License
Built for Hackathon Problem Statement 3 — **LogicRush Arena**.
Licensed under the MIT License.
