# DualMind — AI-Powered Mock Interview Room

> Real-time collaborative coding interview platform with a role-aware AI co-pilot that behaves differently for each participant.

🔗 **Live Demo:** [mock-interview-room-gold.vercel.app](https://mock-interview-room-gold.vercel.app)

---

## What makes this unique

Most AI tools give the same response to everyone. DualMind reads the user's role from their JWT token and builds a completely different AI prompt:

- **Candidate** gets Socratic hints only — guided thinking, never the solution
- **Interviewer** gets live scoring, code analysis, and follow-up question suggestions

Same room. Same code. Completely different AI. That's the core idea.

---

## Features

- **Live code editor** — Monaco Editor (same as VS Code) shared between both users in real time
- **Role-aware AI co-pilot** — Claude/Groq Llama 3.3 70B responds differently based on JWT role
- **AI token streaming** — responses appear word by word via Socket.io, no waiting
- **Real-time sync** — every keystroke syncs between interviewer and candidate in under 50ms
- **Session transcript** — full session logged to PostgreSQL for post-interview review
- **JWT role auth** — cryptographically signed tokens prevent role spoofing
- **Multi-language support** — JavaScript, Python, Java, C++

---

## Try it yourself

**As Interviewer:**
1. Go to [mock-interview-room-gold.vercel.app](https://mock-interview-room-gold.vercel.app)
2. Enter your name and a coding question
3. Click **Create Room** — copy the room URL

**As Candidate:**
1. Go to `https://mock-interview-room-gold.vercel.app/?roomId=PASTE-ROOM-ID-HERE`
2. Enter your name → click **Join Room**

**Solo testing:**
Open Chrome as interviewer and Edge as candidate simultaneously — they use separate sessionStorage so roles never conflict.

---

## Tech Stack

| Technology | Why I chose it |
|---|---|
| **Node.js + Express** | REST API server — handles room creation, auth, HTTP routes |
| **Socket.io** | Real-time bidirectional communication — built-in room support, WebSocket with polling fallback |
| **PostgreSQL** | Permanent storage — rooms, session transcripts, AI interaction logs with relational integrity |
| **Redis (Memurai)** | Sub-millisecond live room state — current code and language survive page refreshes |
| **JWT** | Stateless role-based auth on both HTTP and WebSocket connections — no DB lookup per event |
| **Groq API (Llama 3.3 70B)** | Free, fast AI streaming — tokens arrive 3x faster than most providers |
| **Monaco Editor** | VS Code's editor as an npm package — syntax highlighting for 40+ languages |
| **React + Vite** | Frontend UI — manages streaming AI text and live code state |
| **Railway** | Backend deployment — runs Node.js, PostgreSQL and Redis in one platform |
| **Vercel** | Frontend deployment — CDN distribution, loads fast globally, free forever |

---

## Architecture

```
Browser (Interviewer)          Browser (Candidate)
        |                               |
        |     Socket.io WebSocket       |
        |-------------------------------|
                      |
              Node.js Server (Railway)
                      |
        +-------------+-------------+
        |             |             |
     Express       Socket.io      Groq API
     REST API       Rooms         (AI Streaming)
        |             |
        |      +------+------+
        |      |             |
     PostgreSQL           Redis
    (permanent)          (live state)
```

**Request flow when candidate asks AI:**
1. Candidate types question → clicks Ask AI
2. Socket emits `ai:ask` event to server
3. Server reads `socket.user.role` from verified JWT → `candidate`
4. Fetches current code from Redis + question from PostgreSQL
5. Builds candidate-specific prompt: *"hints only, no solution, Socratic guidance"*
6. Groq API streams tokens back
7. Each token emitted via `socket.emit('ai:stream')` to that socket only
8. React appends each token to state — typewriter effect in UI

---

## How role-aware AI works

```js
// server/ai/prompts.js
function buildPrompt({ role, question, code, language, userQuery }) {
  const base = `Interview question: ${question}\nCurrent code:\n${code}`;

  if (role === 'candidate') {
    return base + `
      NEVER give the full solution.
      Give conceptual hints only.
      Ask Socratic questions to guide thinking.
      Keep response under 80 words.
      Question: ${userQuery}`;
  }

  if (role === 'interviewer') {
    return base + `
      1. SCORE: Rate out of 10 for correctness, efficiency, code quality
      2. ANALYSIS: What candidate did well and what is missing
      3. FOLLOW-UP QUESTIONS: 2-3 probing questions
      4. OPTIMAL SOLUTION: Best approach with explanation
      Request: ${userQuery}`;
  }
}
```

---

## Running locally

**Prerequisites:** Node.js v18+, PostgreSQL, Redis (or Memurai on Windows)

**1. Clone the repo**
```bash
git clone https://github.com/Pawanmehra01/mock-interview-room.git
cd mock-interview-room
```

**2. Set up server**
```bash
cd server
npm install
```

Create `server/.env`:
```
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/interviewdb
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=your-groq-key-from-console.groq.com
JWT_SECRET=your-long-random-secret
PORT=4000
CLIENT_URL=http://localhost:5173
```

**3. Create database tables**
```bash
psql -U postgres -d interviewdb
```
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  language VARCHAR(30) DEFAULT 'javascript',
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE session_events (
  id SERIAL PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  role VARCHAR(20),
  event_type VARCHAR(30),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**4. Start server**
```bash
npm run dev
```

**5. Set up client**
```bash
cd ../client
npm install
```

Create `client/.env`:
```
VITE_SERVER_URL=http://localhost:4000
```

**6. Start client**
```bash
npm run dev
```

Open `http://localhost:5173` in Chrome and Edge simultaneously.

---

## Project Structure

```
mock-interview-room/
├── server/
│   ├── ai/
│   │   ├── prompts.js          # Role-aware prompt builder
│   │   └── streamer.js         # Groq API streaming
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── redis/
│   │   └── client.js           # Redis connection
│   ├── routes/
│   │   ├── rooms.js            # POST /api/rooms, GET /api/rooms/:id
│   │   └── auth.js             # POST /api/auth/join
│   ├── socket/
│   │   ├── index.js            # Socket.io setup
│   │   ├── middleware.js       # JWT auth on WebSocket connect
│   │   └── handlers/
│   │       ├── roomHandler.js  # Join, leave, room state
│   │       ├── codeHandler.js  # Real-time code sync
│   │       └── aiHandler.js    # AI request handling
│   ├── db.js                   # PostgreSQL pool
│   └── index.js                # Express + Socket.io server
└── client/
    └── src/
        ├── hooks/
        │   └── useSocket.js    # Socket connection hook
        ├── pages/
        │   ├── JoinRoom.jsx    # Create/join room page
        │   └── Room.jsx        # Live interview room
        └── config.js           # Server URL config
```

---

## Key technical decisions

**Why sessionStorage over localStorage?**
localStorage is shared across all tabs — both users showed as the same role. sessionStorage is isolated per tab, so interviewer and candidate tokens never conflict.

**Why Redis AND PostgreSQL?**
Redis for live state (sub-millisecond reads, perfect for real-time sync). PostgreSQL for permanent data (survives restarts, supports complex queries for session replay).

**Why Groq over OpenAI?**
Free tier with no credit card, Llama 3.3 70B is genuinely competitive for coding tasks, and token generation is significantly faster — important for streaming UX.

**Why Railway over Heroku?**
Railway bundles PostgreSQL + Redis + Node.js hosting in one dashboard with automatic deploys. Heroku removed its free tier in 2022.

---

## Bugs fixed during development

| Bug | Cause | Fix |
|---|---|---|
| Both users showed as candidate | localStorage shared across tabs | Switched to sessionStorage |
| Socket connected and disconnected repeatedly | React StrictMode running effects twice | Added guard check in useSocket + removed StrictMode |
| CORS blocking Vercel → Railway | CLIENT_URL env var not loaded | Hardcoded Vercel URL in CORS config |
| JWT invalid after server recreation | JWT_SECRET changed | Cleared sessionStorage, regenerated tokens |

---

## Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | mock-interview-room-gold.vercel.app |
| Backend | Railway | mock-interview-room-production.up.railway.app |
| Database | Railway PostgreSQL | Internal to Railway |
| Cache | Railway Redis | Internal to Railway |

---

## What I learned

- WebSocket authentication using JWT on socket handshake
- Role-based AI prompt engineering — same model, different behaviour
- Dual storage strategy — Redis for speed, PostgreSQL for permanence
- React state management for streaming token-by-token AI responses
- Production deployment — Railway + Vercel with auto-deploy on git push
- Debugging CORS, StrictMode side effects, and sessionStorage isolation

---

## Author

**Pawan Singh Mehra**
- GitHub: [@Pawanmehra01](https://github.com/Pawanmehra01)
- Project built: 2026

---

*Built as a portfolio project to demonstrate real-time systems, AI integration, and full-stack deployment.*
