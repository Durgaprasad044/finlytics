Tech Stack for Google-Agentic-AI

Frontend
- Framework: React 18
  - Evidence: `package.json` dependency `"react": "^18.2.0"`
  - Evidence: `src/main.tsx` imports React and renders `<App />`
- Language: TypeScript
  - Evidence: `package.json` devDependency `"typescript"`
  - Evidence: `tsconfig.json` present with `"strict": true`
- Bundler / Dev server: Vite
  - Evidence: `package.json` scripts use `vite` and `vite.config.ts` exists
- Styling: Tailwind CSS
  - Evidence: `package.json` devDependency `"tailwindcss"`; `tailwind.config.js` present
- UI & Libraries: framer-motion, lucide-react, recharts, react-hook-form, react-router-dom, react-hot-toast
  - Evidence: listed in `package.json` dependencies

Backend
- Framework: FastAPI (Python)
  - Evidence: `requirements.txt` includes `fastapi>=0.104.0`
  - Evidence: `backend/main.py` imports and configures `FastAPI`
- ASGI server: Uvicorn
  - Evidence: `requirements.txt` includes `uvicorn[standard]`
- Language: Python
  - Evidence: Python package list in `requirements.txt` and many `.py` files under `backend/`
- Auth/security: python-jose, passlib, HTTPBearer usage
  - Evidence: `requirements.txt` and `backend/main.py` using HTTPBearer and token verification

Machine Learning, Vision & NLP
- Core libs: numpy, pandas, scikit-learn, scipy
  - Evidence: `requirements.txt`
- Deep learning & transformers: torch, transformers
  - Evidence: `requirements.txt`
- Time-series / forecasting: prophet
  - Evidence: `requirements.txt`
- Computer vision / OCR: opencv-python, Pillow, pytesseract, easyocr, google-cloud-vision
  - Evidence: `requirements.txt`
- NLP: nltk
  - Evidence: `requirements.txt`

Cloud & Integrations
- Firebase (frontend): `package.json` dependency `firebase`
  - Evidence: `package.json` and `src/config/firebase.ts`
- AWS / S3 (boto3) and Google Cloud Vision client
  - Evidence: `requirements.txt` includes `boto3` and `google-cloud-vision`

Data, Realtime & Persistence
- Database abstraction: `backend/utils/database.py` and `DatabaseManager` used in `backend/main.py`
- Realtime sync: `backend/services/realtime_sync.py` and `src/hooks/useRealtimeSync.ts`

Dev tooling
- Lint & format: ESLint, Prettier, @typescript-eslint
  - Evidence: `package.json` devDependencies
- Concurrent dev: `concurrently` used in `package.json` (`dev:full` script starts both backend & frontend)
- Build: `tsc && vite build` defined in `package.json` build script
- Python deps: `requirements.txt` lists all backend packages

Structure highlights
- Frontend entry: `src/main.tsx`
- Backend entry: `backend/main.py` and `start_backend.py` at repo root
- Agents: folder `backend/agents/` contains specialized agent modules

Notes & next steps
- If you want this added to the `README.md` instead of a separate file, I can update `README.md`.
- I can also generate a small architecture diagram or a badge for the README.

Last updated: 2025-10-21
