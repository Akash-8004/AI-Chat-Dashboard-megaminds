# Megaminds AI Chat Dashboard

A full-stack, multi-turn AI chat application built for the **Megaminds Full-Stack AI Developer Take-Home Task (Option B)**.

---

## 🚀 Overview & Option Selected

**Option B — AI Chat Dashboard**
- **Frontend**: React + TypeScript + Vite (Responsive Dark-Mode Glassmorphism UI)
- **Backend**: Python + FastAPI REST API
- **AI Integration**: Groq Cloud API (`llama-3.3-70b-versatile` model) with fallback mock mode
- **Database**: Persistent chat history per user in SQLite via SQLAlchemy ORM
- **Authentication**: JWT token-based authentication with bcrypt password hashing

---

## ✨ Features

- **User Authentication**: Secure Registration & Login flow with JWT token persistence.
- **AI Persona Switching**: Select between different personas (*Productivity Coach*, *Technical Mentor*, *Friendly Support*), each with distinct system prompts.
- **Multi-Turn Conversation Memory**: Full message history is preserved per user and passed to the LLM to maintain conversation context across turns.
- **Groq LLM Integration**: Powered by Groq's high-speed LLaMA 3.3 70B model.
- **Mock Fallback Mode**: Works out-of-the-box even without an external API key.
- **Responsive UI**: Glassmorphism design with real-time state indicators and auto-scrolling chat history.

---

## 🛠️ Project Structure

```text
Megaminds/
├── client/                     # React 19 Frontend
│   ├── src/
│   │   ├── App.tsx             # Main Chat Dashboard UI & Auth flow
│   │   ├── api.ts              # Fetch client wrapper & error handling
│   │   ├── types.ts            # TypeScript interfaces
│   │   └── style.css           # Custom Glassmorphism design system
│   ├── package.json
│   └── vite.config.ts
├── server/                     # FastAPI Backend
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint & CORS setup
│   │   ├── config.py           # Pydantic environment settings
│   │   ├── database.py         # SQLAlchemy engine & session
│   │   ├── models.py           # User, Persona, Conversation, Message models
│   │   ├── schemas.py          # Pydantic request/response schemas
│   │   ├── deps.py             # JWT auth & user dependencies
│   │   ├── routes/             # API route handlers (auth, personas, conversations)
│   │   └── services/
│   │       └── llm.py          # Groq / OpenAI / Mock LLM service
│   ├── .env                    # Local environment config (Git-ignored)
│   ├── .env.example            # Environment template
│   ├── seed.py                 # Database seed script
│   └── requirements.txt        # Python dependencies
├── docs/
│   ├── PROJECT_REPORT.md       # Final project report for submission
│   └── video-walkthrough-checklist.md  # Talking points for 3-5 min video
├── .gitignore                  # Git ignore rules protecting secrets & build artifacts
├── .env.example                # Root environment template
├── package.json                # Root workspace configuration
└── README.md                   # Setup & documentation
```

---

## 💻 How to Run the Project Locally

### 1. Prerequisites
- **Node.js**: v18 or higher
- **Python**: v3.10 or higher

### 2. Setup Environment Variables

Create `server/.env` inside the `server/` directory (or copy from `.env.example`):

```bash
# Server Configuration
PORT=4000
JWT_SECRET=megaminds-super-secret-jwt-key-2026
DATABASE_URL=sqlite:///./dev.db
CLIENT_ORIGIN=http://localhost:5173

# LLM Provider Configuration ("groq", "openai", or "mock")
LLM_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.3-70b-versatile

```

### 3. Install Dependencies

**Frontend Dependencies:**
```bash
npm run install:all
```

**Backend Dependencies:**
```bash
cd server
python -m pip install -r requirements.txt
cd ..
```

### 4. Run the Application

**Option A: Run Frontend & Backend separately**

- **Start Backend API Server** (Port 4000):
  ```bash
  npm run dev:server
  ```
- **Start Frontend React Client** (Port 5173):
  ```bash
  npm run dev:client
  ```

**Option B: Manual Terminal Execution**

- Backend: `cd server && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 4000`
- Frontend: `cd client && npm run dev`

Open your browser at **`http://localhost:5173`** to access the AI Chat Dashboard!

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Backend health check | No |
| `POST` | `/api/auth/register` | Create new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | No |
| `GET` | `/api/personas` | List all available AI personas | No |
| `GET` | `/api/conversations` | List conversations for current user | Yes |
| `POST` | `/api/conversations` | Start new conversation with a persona | Yes |
| `GET` | `/api/conversations/:id/messages` | Get full message history for conversation | Yes |
| `POST` | `/api/conversations/:id/messages` | Send user prompt & get AI assistant reply | Yes |

---

## 📦 How to Push to GitHub

Before pushing your repository to GitHub, verify that API keys and local database files are ignored:

1. **Verify `.gitignore` is active**:
   Make sure `server/.env`, `.env`, and `server/dev.db` are listed in `.gitignore`.
2. **Initialize Git & Commit**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete Megaminds Option B AI Chat Dashboard with Groq API integration"
   ```
3. **Link Remote & Push**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   git push -u origin main
   ```

---

## 📋 Submission Checklist (Megaminds Assignment)

- [x] **GitHub Repository**: Code committed with clean history and `.gitignore` configured.
- [x] **Working App**: Full-stack multi-turn chatbot with authentication and per-user database storage.
- [x] **Groq AI Integration**: Integrated with `gsk_...` key and `llama-3.3-70b-versatile`.
- [x] **Project Report**: Complete 1-2 page report available in [`docs/PROJECT_REPORT.md`](file:///c:/Users/Admin/Desktop/LOCAL/Megaminds/docs/PROJECT_REPORT.md).
- [x] **Video Walkthrough Checklist**: Guidelines available in [`docs/video-walkthrough-checklist.md`](file:///c:/Users/Admin/Desktop/LOCAL/Megaminds/docs/video-walkthrough-checklist.md).
