# Connecting Frontend to Backend

This project is set up so the **React frontend** talks to the **FastAPI backend** with minimal config.

## Quick start

### 1. Backend (from repo root)

```bash
cd jointlly_backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env           # then edit .env with your DB and secrets
alembic upgrade head           # if using DB migrations
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Backend runs at **http://127.0.0.1:8001**  
API docs: **http://127.0.0.1:8001/docs**

### 2. Frontend (from repo root)

```bash
npm install
npm run dev
```

Frontend runs at **http://localhost:8080** (see `vite.config.ts`).

### 3. How they connect

- **Development:** The Vite dev server proxies `/api` to `http://127.0.0.1:8001`. You do **not** need to set `VITE_API_URL`; the frontend uses relative URLs (`/api/v1/...`) and the proxy forwards them to the backend.
- **Optional:** To call the backend directly (e.g. different port), create a `.env` file in the frontend root and set:
  ```env
  VITE_API_URL=http://127.0.0.1:8001
  ```
- **Production:** Set `VITE_API_URL` to your deployed API URL (e.g. `https://api.jointlly.in`) before building.

## What’s already wired

- **Auth:** Login, register, refresh, and `/me` use `src/lib/api.ts` and the Auth page uses them.
- **CORS:** Backend allows all origins in dev; frontend can call it directly if you set `VITE_API_URL`.
- **Tokens:** Access and refresh tokens are stored in `localStorage` and sent via the `Authorization: Bearer` header for protected routes.

## Troubleshooting

| Issue | Check |
|-------|--------|
| "Network Error" or CORS | Backend running on 8001? In dev, prefer **no** `VITE_API_URL` so the proxy is used. |
| 401 on /me | User logged in? Token in localStorage? Try login again. |
| Backend not starting | `.env` in `jointlly_backend` with `DATABASE_URL`, `JWT_SECRET_KEY`, and Razorpay keys (see `jointlly_backend/.env.example`). |
