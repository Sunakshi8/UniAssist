# 🎓 UniAssist — AI College Support Chatbot

A full-stack AI chatbot that answers college-specific questions accurately using **Retrieval-Augmented Generation (RAG)**.

Unlike generic AI assistants that rely only on pretrained knowledge, UniAssist first retrieves relevant information from a curated college knowledge base, then produces context-aware, source-backed answers through **Google Gemini**.

---

## Why RAG?

Generic chatbots often hallucinate when asked institution-specific questions — wrong deadlines, invented policies, made-up fees. UniAssist avoids that by:

- Retrieving relevant college documents **before** generating an answer
- Using **semantic search** instead of keyword matching
- Grounding every response in verified knowledge-base content
- **Citing the source** used for each answer

Ask things like:
> "When does the Fall semester start?"
> "What's the late payment fee?"
> "Do I have to live on campus as a freshman?"

---

## Preview

| Login | Chat |
|---|---|
| ![Login screen](./docs/images/login-preview.svg) | ![Chat interface](./docs/images/chat-ui-preview.svg) |

> These are UI mockups generated for this README, not live screenshots. Once you run the app, swap them out for real screenshots at `docs/images/login-preview.png` and `docs/images/chat-ui-preview.png`.

---

## Features

**AI-Powered Chat**
- Google Gemini integration
- Context-aware, multi-turn conversations
- Persistent chat history per user
- Source-backed responses with citations

**RAG Pipeline**
- Local embeddings (no per-query embedding API cost)
- Semantic search over the knowledge base
- Cosine-similarity retrieval with a relevance threshold
- Falls back to "I don't have that information" instead of guessing

**Authentication**
- JWT-based auth
- bcrypt password hashing
- Protected routes via middleware
- Role-based access (`student` / `admin`)

**Knowledge Management**
- Admin CRUD for knowledge base entries
- Automatic embedding generation on insert
- MongoDB storage
- Bulk ingestion script with a sample dataset included

**Security**
- Environment-variable-based secrets
- CORS restricted to a configured client origin
- JWT verification on every protected route
- Passwords never stored in plaintext

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

![RAG pipeline architecture](./docs/images/architecture.svg)

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

## Database Schema

| Collection | Purpose |
|---|---|
| `users` | Accounts, password hashes, roles (`student`/`admin`) |
| `chatsessions` | One document per conversation thread |
| `chatmessages` | Every user/assistant message, with `sourcesUsed` for citations |
| `knowledgechunks` | Embedded college documents used for retrieval |

---

## Authentication Flow

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
├── client/                        React frontend (Vite)
│   └── src/
│       ├── api/                   Axios client
│       ├── components/            ChatWindow, MessageBubble, ChatInput, TypingIndicator
│       ├── context/                AuthContext
│       └── pages/                  Login, ChatPage
│
├── server/                        Express backend
│   ├── src/
│   │   ├── controllers/            auth, chat, knowledge
│   │   ├── middleware/             JWT auth
│   │   ├── models/                 User, KnowledgeChunk, ChatSession, ChatMessage
│   │   ├── routes/
│   │   └── services/                embedding, retrieval, gemini
│   ├── data/                       sample_knowledge.json
│   └── scripts/                    ingestKnowledgeBase.js
│
└── README.md
```

---

## Installation

### Prerequisites
- Node.js 18+ (native `fetch` required)
- A MongoDB Atlas cluster (or local MongoDB)
- A free Gemini API key → https://aistudio.google.com/app/apikey

### Backend

```bash
cd server
npm install
cp .env.example .env
```

Fill in `server/.env`:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_string
GEMINI_API_KEY=your_gemini_api_key
```

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

### Seed the knowledge base

```bash
npm run ingest
```

Embeds every entry in `server/data/sample_knowledge.json` locally and stores it in MongoDB. Swap in your own college's real content and re-run.

### Promote an admin

Register normally, then in MongoDB:
```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

### Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Defaults to:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

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

## Future Improvements

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

## License

MIT License.

---

## Troubleshooting

- **`GEMINI_API_KEY is not set`** → check `server/.env` exists and the server was restarted after editing it.
- **`MONGO_URI is not set`** → same fix, check `.env` and restart.
- **Every answer says "I don't have that information"** → the knowledge base is empty. Run `npm run ingest` in `server/`.
- **CORS errors in the browser console** → `CLIENT_ORIGIN` in the backend `.env` must exactly match your frontend's URL (including port).
- **First request feels slow** → expected — that's the embedding model warming up. Every request after that is fast.
