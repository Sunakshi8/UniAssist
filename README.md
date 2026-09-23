

# 🎓 UniAssist
### AI-Powered College Support Chatbot

A full-stack RAG chatbot that answers college-specific questions accurately — grounded in your institution's own knowledge base, not the model's guesses.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)



---

## Table of Contents

- [Why RAG?](#why-rag)
- [Features](#features)
- [How It Works](#how-it-works--rag-pipeline)
- [Tech Stack](#tech-stack)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Authentication Flow](#authentication-flow)
- [Semantic Search](#semantic-search-not-keyword-search)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Deployment](#deployment)
- [Performance Notes](#performance-notes)
- [Example Questions](#example-questions)
- [Roadmap](#roadmap)
- [Why This Project Stands Out](#why-this-project-stands-out)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Why RAG?

Generic chatbots often hallucinate when asked institution-specific questions — wrong deadlines, invented policies, made-up fees. UniAssist avoids that by:

- Retrieving relevant college documents **before** generating an answer
- Using **semantic search** instead of keyword matching
- Grounding every response in verified knowledge-base content
- **Citing the source** used for each answer

> "When does the Fall semester start?"
> "What's the late payment fee?"
> "Do I have to live on campus as a freshman?"

---

## Features

| | |
|---|---|
| 🤖 **AI-Powered Chat** | Google Gemini integration · context-aware, multi-turn conversations · persistent history per user · source-backed answers |
| 🔍 **RAG Pipeline** | Local embeddings (zero per-query API cost) · semantic search · cosine-similarity retrieval with a relevance threshold · never guesses — says so when it doesn't know |
| 🔐 **Authentication** | JWT-based auth · bcrypt password hashing · protected routes via middleware · role-based access (`student` / `admin`) |
| 📚 **Knowledge Management** | Admin CRUD for knowledge base entries · automatic embedding on insert · MongoDB storage · bulk ingestion script with sample data included |
| 🛡️ **Security** | Environment-variable secrets · CORS restricted to a configured origin · JWT verification on every protected route · passwords never stored in plaintext |

---

## How It Works — RAG Pipeline

| Step | Process |
|---|---|
| 1 | User sends a question from the chat UI |
| 2 | Question is converted into a vector embedding (locally, via MiniLM) |
| 3 | Cosine similarity retrieves the most relevant knowledge chunks from MongoDB |
| 4 | Context + question + recent chat history are assembled into a prompt |
| 5 | Gemini generates a grounded response |
| 6 | Answer and its sources are stored in MongoDB and returned to the client |

### Flow diagram

```
 ┌────────────┐
 │  React UI   │
 │ (chat page) │
 └──────┬──────┘
        │ 1. POST /api/chat  { message }
        ▼
 ┌───────────────────────┐
 │   Express API           │
 │   (JWT protected)       │
 └───────────┬─────────────┘
             │ 2. embed the question locally
             ▼
 ┌─────────────────────────────┐
 │ Embedding service              │
 │ @xenova/transformers (MiniLM)   │
 └──────────────┬────────────────┘
                │ question vector
                ▼
 ┌─────────────────────────────┐
 │ Retrieval service                │
 │ cosine similarity vs. every        │
 │ KnowledgeChunk in MongoDB          │
 └──────────────┬────────────────┘
                │ 3. top-K relevant chunks (score ≥ threshold)
                ▼
 ┌─────────────────────────────┐
 │ Gemini service                     │
 │ prompt = context + question         │
 │         + recent chat history        │
 └──────────────┬────────────────┘
                │ 4. grounded answer
                ▼
 ┌─────────────────────────────┐
 │ MongoDB                            │
 │ save ChatMessage (+ sources)        │
 └──────────────┬────────────────┘
                │ 5. answer + sources
                ▼
 ┌────────────┐
 │  React UI   │  ← displayed with "Sources: ..." under the reply
 └────────────┘
```

### Request lifecycle (sequence)

```
User        Frontend        Backend API      Embedding Model    MongoDB        Gemini
 │  types      │                 │                   │              │              │
 │────────────▶│                 │                   │              │              │
 │             │── POST /chat ──▶│                   │              │              │
 │             │                 │── embed(q) ──────▶│              │              │
 │             │                 │◀── vector ─────────│              │              │
 │             │                 │── find chunks ────────────────▶│              │
 │             │                 │◀── chunks+embeddings ──────────│              │
 │             │                 │  (cosine similarity in JS)     │              │
 │             │                 │── prompt(context, q) ─────────────────────▶│
 │             │                 │◀── generated answer ───────────────────────│
 │             │                 │── save ChatMessage ────────────▶│              │
 │             │◀── answer + sources ─│                   │              │              │
 │◀── shown ───│                 │                   │              │              │
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router + Axios |
| Backend | Node.js + Express.js (REST API) |
| Database | MongoDB Atlas + Mongoose |
| AI — generation | Google Gemini API |
| AI — embeddings | `@xenova/transformers` (Xenova MiniLM, local, free) |
| Retrieval | Cosine similarity, computed in JS |
| Auth | JWT + bcrypt |
| Deployment | Backend → Render/Railway · Frontend → Vercel/Netlify · DB → MongoDB Atlas |

---

## API Reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Health check |
| `POST` | `/auth/register` | — | Create an account, returns a JWT |
| `POST` | `/auth/login` | — | Log in, returns a JWT |
| `POST` | `/chat` | ✅ | Send a message → retrieve context → call Gemini → save + return the answer |
| `GET` | `/chat/sessions` | ✅ | List the current user's chat sessions |
| `GET` | `/chat/sessions/:id` | ✅ | Get full message history for a session |
| `POST` | `/knowledge` | ✅ admin | Add a knowledge chunk (auto-embedded) |
| `GET` | `/knowledge` | ✅ admin | List all knowledge chunks |
| `DELETE` | `/knowledge/:id` | ✅ admin | Remove a knowledge chunk |

**Example request:**
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "When does the Fall semester start?"}'
```

**Example response:**
```json
{
  "sessionId": "66f1a2...",
  "answer": "The Fall 2026 semester begins on August 24th and ends on December 12th.",
  "sources": [
    { "sourceTitle": "Academic Calendar 2026", "score": 0.81 }
  ]
}
```

---

## Database Schema

| Collection | Purpose |
|---|---|
| `users` | Accounts, password hashes, roles (`student`/`admin`) |
| `chatsessions` | One document per conversation thread |
| `chatmessages` | Every user/assistant message, with `sourcesUsed` for citations |
| `knowledgechunks` | Embedded college documents used for retrieval |

---

## Authentication Flow

```
 Register / Login
        │
        ▼
 bcrypt.compare(password, storedHash)
        │
        ├── fail ──▶ 401 Invalid email or password
        │
        ▼ success
 jwt.sign({ id, email, role }) ──▶ token returned to client
        │
        ▼
 Client stores token, sends it as
 "Authorization: Bearer <token>" on every request
        │
        ▼
 requireAuth middleware verifies token
        │
        ▼
 requireAdmin middleware (knowledge routes only)
 checks role === "admin"
```

1. User registers or logs in with email + password
2. Password is checked against the stored hash with **bcrypt**
3. A **JWT** is issued (`Authorization: Bearer <token>`)
4. The client stores the token and attaches it to every API request
5. `requireAuth` middleware verifies the token on protected routes; `requireAdmin` additionally gates knowledge-base management routes

---

## Semantic Search, Not Keyword Search

UniAssist matches on **meaning**, not exact wording. A student asking about *"hostel charges"* retrieves the same document as one asking about *"dorm fees"* — because their embeddings land close together in vector space, even though no words overlap.

---

## Folder Structure

```
uniassist/
├── client/                         React frontend (Vite)
│   └── src/
│       ├── api/                    Axios client
│       ├── components/             ChatWindow, MessageBubble, ChatInput, TypingIndicator
│       ├── context/                AuthContext
│       └── pages/                  Login, ChatPage
│
├── server/                         Express backend
│   ├── src/
│   │   ├── controllers/            auth, chat, knowledge
│   │   ├── middleware/             JWT auth
│   │   ├── models/                 User, KnowledgeChunk, ChatSession, ChatMessage
│   │   ├── routes/
│   │   └── services/                embedding, retrieval, gemini
│   ├── data/                        sample_knowledge.json
│   └── scripts/                     ingestKnowledgeBase.js
│
└── README.md
```

---

## Installation

### Prerequisites
- Node.js 18+ (native `fetch` required)
- A MongoDB Atlas cluster (or local MongoDB)
- A free Gemini API key → https://aistudio.google.com/app/apikey

### 1 — Backend

```bash
cd server
npm install
cp .env.example .env
```

Fill in `server/.env`:

| Variable | Description |
|---|---|
| `PORT` | Port the API listens on (default `5000`) |
| `MONGO_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Any long random string, used to sign tokens |
| `GEMINI_API_KEY` | Your Gemini API key |
| `GEMINI_MODEL` | Defaults to `gemini-1.5-flash` |
| `EMBEDDING_MODEL` | Defaults to `Xenova/all-MiniLM-L6-v2` |
| `CLIENT_ORIGIN` | Frontend URL, for CORS |

Run it:
```bash
npm run dev
```

Expected output:
```
[db] MongoDB connected
[embedding] loading model: Xenova/all-MiniLM-L6-v2 (first call only)
[embedding] model ready
[server] UniAssist API listening on port 5000
```

### 2 — Seed the knowledge base

```bash
npm run ingest
```

Embeds every entry in `server/data/sample_knowledge.json` locally and stores it in MongoDB. Swap in your own college's real content and re-run whenever it changes.

### 3 — Promote an admin

Register normally through the app, then in MongoDB:
```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

### 4 — Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

`client/.env` defaults to:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Open the URL Vite prints (default `http://localhost:5173`), register an account, and start chatting.

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel / Netlify |
| Backend | Render / Railway |
| Database | MongoDB Atlas |

- Frontend build command: `npm run build` → output dir `dist`
- Backend build/start: `npm install` → `npm start`
- Set the same env vars on the host as in your local `.env`
- Whitelist your backend's IP in Atlas Network Access
- Point `VITE_API_BASE_URL` at your deployed backend, and `CLIENT_ORIGIN` (backend) at your deployed frontend, so CORS lines up
- Re-run `npm run ingest` against your production `MONGO_URI` to seed the live DB

---

## Performance Notes

- Local embedding model avoids per-query embedding API cost or rate limits
- MiniLM model loads once at server startup and stays cached in memory
- Cosine similarity over a JS array is fast up to a few thousand chunks — migrate to MongoDB Atlas Vector Search if the knowledge base grows large
- Context sent to Gemini is capped to the top-K most relevant chunks, keeping token usage (and cost) low

---

## Example Questions

| Question | What Happens |
|---|---|
| "When does the semester begin?" | Retrieves the academic calendar entry |
| "What's the late payment fee?" | Retrieves the fee structure entry |
| "Do freshmen have to live on campus?" | Retrieves the housing guide entry |
| "How do makeup exams work?" | Retrieves the examination policy entry |

Every answer includes which source document(s) it drew from.

---

## Roadmap

- [ ] PDF upload → auto-chunk → auto-embed pipeline for admins
- [ ] Streaming AI responses (token-by-token)
- [ ] MongoDB Atlas Vector Search for large-scale retrieval
- [ ] Multi-language support
- [ ] Faculty/admin analytics dashboard
- [ ] Voice input
- [ ] Mobile app

---

## Why This Project Stands Out

UniAssist combines several industry-relevant concepts in one project:

- Full-stack React + Node.js architecture
- MongoDB schema design for chat + vector storage
- JWT authentication with role-based access
- Retrieval-Augmented Generation (RAG)
- Local embeddings via Transformers.js — zero embedding API cost
- Semantic search with cosine similarity
- Google Gemini integration
- A real, documented production deployment workflow

These are practical, in-demand skills for modern AI-powered web applications, making this a solid portfolio piece.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `GEMINI_API_KEY is not set` | Check `server/.env` exists and restart the server after editing it |
| `MONGO_URI is not set` | Same — check `.env` and restart |
| Every answer says *"I don't have that information"* | The knowledge base is empty — run `npm run ingest` in `server/` |
| CORS errors in the browser console | `CLIENT_ORIGIN` in the backend `.env` must exactly match your frontend's URL, including port |
| First request feels slow | Expected — that's the embedding model warming up. Every request after that is fast |

---


Built with React, Express, MongoDB, local embeddings, and Google Gemini.

