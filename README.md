# UniAssist — AI College Support Chatbot

A full-stack RAG chatbot: React frontend, Node/Express backend, MongoDB for storage,
local embeddings via `@xenova/transformers`, and Google Gemini for answer generation.

This zip contains **working, runnable code** for both the backend and frontend.
You still need to supply your own **MongoDB connection string** and **Gemini API key** —
those are secrets specific to your accounts and can't be baked into the code.

---

## 1. Prerequisites

- Node.js 18+ (required for native `fetch` used by the Gemini service)
- A MongoDB Atlas cluster (or local MongoDB) — connection string
- A free Google Gemini API key: https://aistudio.google.com/app/apikey

---

## 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` and fill in:
```
MONGO_URI=your MongoDB Atlas connection string
JWT_SECRET=any long random string
GEMINI_API_KEY=your Gemini API key
```

Start the server:
```bash
npm run dev      # with nodemon, auto-restarts on changes
# or
npm start
```

You should see:
```
[db] MongoDB connected
[embedding] loading model: Xenova/all-MiniLM-L6-v2 (first call only)
[embedding] model ready
[server] UniAssist API listening on port 5000
```

> The first time the embedding model loads, it downloads (~90MB) and caches locally —
> this can take a minute on first run, then it's instant afterward.

### Seed the knowledge base

A sample college knowledge base (admissions, academics, fees, exams, housing, library,
career services) is included at `server/data/sample_knowledge.json`. Ingest it:

```bash
npm run ingest
```

This embeds each entry locally and stores it in MongoDB. Replace or extend that JSON
file with your own college's real content, then re-run `npm run ingest`.

### Create an admin user

Register normally through the app, then promote yourself to admin directly in MongoDB
(e.g. via Atlas UI or `mongosh`):
```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```
Admin accounts can use the `/api/knowledge` routes to add/list/delete knowledge chunks.

---

## 3. Frontend setup

In a new terminal:
```bash
cd client
npm install
cp .env.example .env
```

`client/.env` defaults to pointing at `http://localhost:5000/api` — change
`VITE_API_BASE_URL` if your backend runs elsewhere.

Start the dev server:
```bash
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). Register an account, then
start chatting — try asking things like:
- "When does the fall semester start?"
- "What's the late payment fee?"
- "Do I have to live on campus as a freshman?"

Each answer should cite which knowledge base source it drew from.

---

## 4. How the RAG pipeline works

1. User sends a message from the React chat UI.
2. Backend embeds the question locally with `@xenova/transformers` (no API call, free).
3. Backend computes cosine similarity between the question vector and every stored
   `KnowledgeChunk` embedding, keeps the top 4 above a similarity threshold.
4. Those chunks + the question + recent chat history are assembled into a prompt sent
   to Gemini.
5. Gemini's answer, plus which sources were used, is saved to MongoDB and returned to
   the frontend.

See `server/src/services/` for the three core pieces: `embedding.service.js`,
`retrieval.service.js`, `gemini.service.js`.

---

## 5. Deployment

- **Backend** → Render or Railway. Set the same environment variables as your local
  `.env` in their dashboard. Build command: `npm install`. Start command: `npm start`.
- **Frontend** → Vercel or Netlify. Set `VITE_API_BASE_URL` to your deployed backend's
  URL (e.g. `https://your-app.onrender.com/api`). Build command: `npm run build`,
  output directory: `dist`.
- **Database** → MongoDB Atlas. Whitelist your backend host's IP (or `0.0.0.0/0` for
  simplicity while testing) in Atlas Network Access.
- After deploying the backend, re-run the ingestion script pointed at your production
  `MONGO_URI` to seed the live database.
- Update `CLIENT_ORIGIN` in the backend's env to your deployed frontend URL so CORS
  allows it.

---

## 6. Project structure

```
uniassist/
├── client/     React frontend (Vite)
├── server/     Express backend + RAG pipeline
└── README.md   This file
```

See each folder for more detail — the backend is organized as
models / routes / controllers / services / middleware, and the frontend as
components / pages / context / api.

---

## 7. Troubleshooting

- **"GEMINI_API_KEY is not set"** → check `server/.env` exists and the server was
  restarted after editing it.
- **"MONGO_URI is not set"** → same, check `.env` and restart.
- **Chat returns "I don't have that information"** for everything → the knowledge base
  is empty or the ingestion script wasn't run. Run `npm run ingest` in `server/`.
- **CORS errors in the browser console** → make sure `CLIENT_ORIGIN` in the backend
  `.env` matches your frontend's actual URL exactly (including port).
- **First request is slow** → normal, that's the local embedding model loading and
  warming up. Subsequent requests are fast.
