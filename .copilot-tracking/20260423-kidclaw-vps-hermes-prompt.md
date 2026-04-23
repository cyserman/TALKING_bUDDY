# 🚀 Hermes Build Prompt: KidClaw VPS Deployment

**Priority:** CRITICAL  
**Timeline:** 1-2 weeks  
**Target:** Self-hosted VPS (24GB RAM, 200GB SSD, Ubuntu 24.04)  
**Deliverable:** Production-ready kids' AI app + parental dashboard  

---

## 🎯 Mission

Build a **voice-first, game-rich AI companion app** for 5-year-old twin boys on a private VPS.

**What they get:**
- ✅ Talk to KidClaw (voice in/out via Web Speech API)
- ✅ Play curated games (physics, quizzes, puzzles)
- ✅ Learn geography, math, phonics from a safe, locked-down knowledge base
- ✅ Android tablet access over home network or domain
- ✅ Zero cloud dependencies (except Gemini API)

**What the parent (cyserman) gets:**
- ✅ Parental dashboard to manage content, track progress, send messages
- ✅ Easy content updates (JSON files, no code changes)
- ✅ Peace of mind: fully controlled, no third-party tracking

---

## 📋 Scope & Architecture

### Frontend (React)
- **Base:** Fork from `cyserman/kidclaw` (already has 80% of UI/games)
- **Customizations:**
  - Lock down to parental-curated topics only
  - Add offline mode (Service Workers + IndexedDB)
  - Tablet-optimized touch targets (min 44px)
  - Android Chrome compatibility verified

### Backend (Node.js/Express)
- **Core:**
  - Express server running on VPS
  - Gemini API integration with strict system prompts
  - SQLite database for progress tracking + parent messages
  - WebSocket for real-time chat between parent and kids
  
- **Endpoints needed:**
  - `POST /api/chat` — kids ask questions → KidClaw responds
  - `POST /api/quiz` — generate quiz questions (Gemini)
  - `GET /api/progress` — fetch learning progress
  - `GET /api/library` — fetch curated facts/games
  - `POST /api/parent/message` — parent sends message to kids
  - `GET /api/parent/dashboard` — parent dashboard data

### Deployment
- **Docker Compose** for easy VPS deployment
- **Nginx** reverse proxy (HTTPS, caching, static files)
- **PM2** for process management
- **Let's Encrypt** for SSL (via Caddy or Certbot)

### Data Structure
```
/app
├── /frontend (React build)
├── /backend (Node.js Express server)
├── /data
│   ├── curriculum.json (topics, facts, questions)
│   ├── games.json (game definitions)
│   └── kids.db (SQLite: progress, chat history)
└── docker-compose.yml
```

---

## 🛠️ Development Checklist

### Phase 1: Backend Setup (Days 1-3)

- [ ] Initialize Node.js + Express project
- [ ] Set up `.env` file with:
  - `GEMINI_API_KEY`
  - `DATABASE_URL` (SQLite path)
  - `PORT` (3001 for backend)
  - `PARENT_PASSWORD` (for dashboard auth)
  
- [ ] Create database schema:
  ```sql
  CREATE TABLE kids (
    id PRIMARY KEY,
    name TEXT,
    age INTEGER,
    created_at TIMESTAMP
  );
  
  CREATE TABLE progress (
    id PRIMARY KEY,
    kid_id TEXT,
    topic TEXT,
    score INTEGER,
    completed_at TIMESTAMP
  );
  
  CREATE TABLE messages (
    id PRIMARY KEY,
    from_role TEXT (parent|kid),
    to_role TEXT,
    content TEXT,
    created_at TIMESTAMP
  );
  
  CREATE TABLE chat_history (
    id PRIMARY KEY,
    kid_id TEXT,
    question TEXT,
    response TEXT,
    created_at TIMESTAMP
  );
  ```

- [ ] Implement `/api/chat` endpoint:
  - Accept kid's question + kid_id
  - Call Gemini with SYSTEM_PROMPT (below)
  - Save to chat_history
  - Return response + audio URL

- [ ] Implement `/api/quiz` endpoint:
  - Accept topic (e.g., "stars", "numbers")
  - Generate 3 multiple-choice options via Gemini
  - Return question + options

- [ ] Add Gemini integration module:
  ```javascript
  const SYSTEM_PROMPT = `
  You are KidClaw, a cheerful, friendly exploring robot who loves teaching 5-year-old twin boys.
  
  CONSTRAINTS:
  1. Never speak more than 3 sentences.
  2. Use simple words. Explain sounds like 'buh' for B, 'cuh' for C.
  3. Math: Use objects (apples, stars, toy cars). Explain groups and doubles.
  4. Topics: Geography, Astronomy, Early Math, Phonics, Physics (gravity, friction).
  5. NEVER answer questions outside these topics.
  6. NEVER mention: YouTube, Internet, other apps, external websites.
  7. Always sound happy and encouraging.
  `;
  ```

### Phase 2: Frontend Customization (Days 2-4)

- [ ] Clone `cyserman/kidclaw` to new branch: `kidclaw-vps`
- [ ] Remove hardcoded AI Studio references
- [ ] Update `vite.config.ts` to point to local backend:
  ```typescript
  define: {
    'process.env.API_URL': JSON.stringify('http://localhost:3001/api')
  }
  ```
- [ ] Add Service Worker for offline caching:
  - Cache `/api/library` responses
  - Cache UI assets
  - Sync chat when connection restored

- [ ] Lock down navigation:
  - Remove links to external resources
  - Only show topics parent has curated
  - Add kid-safety guardrails

- [ ] Test on Android Chrome:
  - Web Speech API works ✅
  - Touch targets >= 44px ✅
  - Microphone permissions prompt ✅

### Phase 3: Content Curation (Days 3-5)

- [ ] Create `curriculum.json`:
  ```json
  {
    "topics": [
      {
        "id": "stars",
        "name": "Stars & Planets",
        "description": "Learn about space!",
        "facts": [
          "The sun is a star that keeps us warm.",
          "Stars twinkle because of Earth's atmosphere."
        ],
        "quiz_prompt": "Generate a 3-option quiz about {topic}"
      }
    ]
  }
  ```

- [ ] Create `games.json` with game definitions (physics sandbox, driving quiz, etc.)
- [ ] Write 10+ facts per topic (geography, math, phonics)
- [ ] Generate sample quiz questions with Gemini

### Phase 4: Parental Dashboard (Days 5-6)

- [ ] Create React dashboard at `/parent`:
  - Login with `PARENT_PASSWORD`
  - View kids' progress (topics completed, quiz scores)
  - View chat history (what they asked, what KidClaw said)
  - Send messages to kids ("Dinner time!" alerts)
  - Add/edit topics and facts (JSON uploader)
  - Set time limits

- [ ] Dashboard endpoints:
  - `GET /api/parent/progress` — all kids' data
  - `POST /api/parent/message` — send alert to kids
  - `POST /api/parent/curriculum` — upload/update curriculum.json
  - `GET /api/parent/chat-log` — view all conversations

### Phase 5: Docker & VPS Deployment (Days 6-7)

- [ ] Create `Dockerfile` for backend:
  ```dockerfile
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  EXPOSE 3001
  CMD ["node", "server.js"]
  ```

- [ ] Create `docker-compose.yml`:
  ```yaml
  version: '3.8'
  services:
    backend:
      build: ./backend
      ports:
        - "3001:3001"
      environment:
        - GEMINI_API_KEY=${GEMINI_API_KEY}
        - DATABASE_URL=/data/kids.db
      volumes:
        - ./data:/data
    
    frontend:
      build: ./frontend
      ports:
        - "80:3000"
      depends_on:
        - backend
  ```

- [ ] Deploy to VPS:
  ```bash
  # SSH into VPS
  ssh root@your-vps-ip
  
  # Clone repo
  git clone https://github.com/cyserman/kidclaw-vps.git /app/kidclaw
  cd /app/kidclaw
  
  # Set environment variables
  echo "GEMINI_API_KEY=your_key_here" > .env
  
  # Start with Docker Compose
  docker-compose up -d
  
  # Verify
  curl http://localhost:3001/api/health
  curl http://localhost/
  ```

- [ ] Set up Nginx + SSL:
  - Reverse proxy port 80 → frontend (3000)
  - Reverse proxy `/api/*` → backend (3001)
  - Auto-renew SSL with Certbot
  - Cache static assets aggressively

- [ ] Set up monitoring:
  - PM2 logs with rotation
  - Health check endpoint
  - Email alerts on crash

### Phase 6: Testing & Launch (Days 7-8)

- [ ] Test on Android tablets (multiple devices):
  - Voice recognition works
  - Voice synthesis plays
  - Games respond to touch
  - Offline mode caches properly

- [ ] Security audit:
  - No external API calls except Gemini
  - No sensitive data in localStorage
  - CORS locked to VPS domain only
  - Parent password hashed (bcrypt)

- [ ] Load testing:
  - Simulate 2-3 kids using simultaneously
  - Database queries < 100ms
  - No memory leaks (PM2 restarts if needed)

- [ ] Documentation:
  - Parent setup guide
  - How to add new topics
  - Troubleshooting guide

---

## 📦 Dependencies to Use

### Backend
```json
{
  "express": "^4.21.0",
  "dotenv": "^17.0.0",
  "@google/generative-ai": "^0.7.0",
  "sqlite3": "^5.1.6",
  "cors": "^2.8.5",
  "ws": "^8.14.0",
  "bcrypt": "^5.1.1"
}
```

### Frontend
- Already in `cyserman/kidclaw`: React 19, Konva.js, Matter.js, motion

---

## 🔑 Key Integration Points

### System Prompt (Critical)
```javascript
const SYSTEM_PROMPT = `
You are KidClaw, a cheerful, friendly exploring robot.
STRICT RULES:
1. Max 3 sentences per response.
2. Simple vocabulary (5-year-old level).
3. Topics only: Geography, Astronomy, Math, Phonics, Physics.
4. NO external links, YouTube, or other apps.
5. Always encouraging and safe.
`;
```

### API Response Format (Standardize)
```json
{
  "success": true,
  "data": {
    "response": "KidClaw's answer here",
    "audioUrl": "data:audio/wav;base64,...",
    "topicId": "stars",
    "confidence": 0.95
  },
  "timestamp": "2026-04-23T14:30:00Z"
}
```

---

## 🚨 Critical Success Factors

1. **Offline-first:** Web Speech API works without internet (system voices)
2. **Content-locked:** No way for kids to ask about arbitrary topics
3. **Parent control:** Easy to curate, update, and monitor
4. **Performance:** Tablets with 2-4GB RAM should run smoothly
5. **Logging:** All conversations saved for safety/oversight

---

## 📍 Deployment Commands (TL;DR)

```bash
# On VPS
cd /app/kidclaw
export GEMINI_API_KEY="your-key"
docker-compose up -d

# Verify
curl http://localhost/
# Should see KidClaw UI

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Update curriculum
curl -X POST http://localhost:3001/api/parent/curriculum \
  -H "Authorization: Bearer $PARENT_PASSWORD" \
  -F "file=@curriculum.json"
```

---

## 🎁 Bonus Features (If Time Allows)

- [ ] Parental time-limit system (auto-shutdown after 30 mins)
- [ ] Daily "Word of the Day" from curriculum
- [ ] Progress badges/celebrations
- [ ] Backup & restore curriculum via parent dashboard
- [ ] Export progress reports as PDF
- [ ] Scheduled learning challenges (Monday = math, Tuesday = geography)

---

## 📞 Communication & Escalation

**If you get stuck:**
1. Check error logs: `docker-compose logs backend`
2. Verify `.env` is set correctly
3. Test Gemini API key: `curl -X POST ... -H "Authorization: Bearer $GEMINI_API_KEY"`
4. Ask Agent Zero / Agent Comms for help on specific API issues

**Handoff to:** cyserman (parent/reviewer)  
**Test on:** Android tablets (Chrome browser)  
**Deploy to:** Your VPS at `your-vps-ip:80`

---

## ✅ Done When

- [ ] Backend accepts requests and returns valid responses
- [ ] Frontend builds and runs locally
- [ ] Voice in (microphone) and voice out (text-to-speech) work on Android Chrome
- [ ] Curriculum.json loads without errors
- [ ] Parent dashboard lets you view progress + send messages
- [ ] Docker containers start and stay healthy
- [ ] Nginx serves HTTPS with valid cert
- [ ] Kids can access via tablet on home network
- [ ] No external API calls except Gemini
- [ ] All docs written and tests passing

---

**Built with ❤️ for the twins to explore the universe safely.**

