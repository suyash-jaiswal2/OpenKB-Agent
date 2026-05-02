# AI Knowledge Base — Prototype

A locally-run, searchable AI knowledge base built with OpenKB, OpenRouter, FastAPI, and React.
Upload Markdown documents, index them using an LLM, and query across them through a chat interface.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React + Vite, react-markdown, axios |
| Backend   | FastAPI, Python                     |
| KB Engine | OpenKB (VectifyAI)                  |
| LLM API   | OpenRouter (Mistral 7B / Llama 3.3) |

---

## Project Structure
# AI Knowledge Base — Prototype

A locally-run, searchable AI knowledge base built with OpenKB, OpenRouter, FastAPI, and React.
Upload Markdown documents, index them using an LLM, and query across them through a chat interface.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React + Vite, react-markdown, axios |
| Backend   | FastAPI, Python                     |
| KB Engine | OpenKB (VectifyAI)                  |
| LLM API   | OpenRouter (Mistral 7B / Llama 3.3) |

---

## Project Structure# AI Knowledge Base — Prototype

A locally-run, searchable AI knowledge base built with OpenKB, OpenRouter, FastAPI, and React.
Upload Markdown documents, index them using an LLM, and query across them through a chat interface.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React + Vite, react-markdown, axios |
| Backend   | FastAPI, Python                     |
| KB Engine | OpenKB (VectifyAI)                  |
| LLM API   | OpenRouter (Mistral 7B / Llama 3.3) |

---

## Project Structure
```
openkb-demo/
├── backend/
│   └── main.py               # FastAPI server
├── frontend/
│   └── src/
│       ├── App.jsx            # React UI
│       └── App.css            # Styles
├── raw_docs/                  # Source .md files
├── my_knowledge_base/         # Generated wiki (auto-created)
│   └── wiki/
│       ├── summaries/         # Per-document summaries
│       ├── concepts/          # Cross-document concept pages
│       ├── explorations/      # Saved query results
│       └── index.md
├── run_init.py                # One-time KB initialisation script
└── .env                       # API keys (never commit this)
```
---

## Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- An [OpenRouter](https://openrouter.ai) account (free, no credit card)

### 1. Clone and create environment

```bash
git clone <your-repo>
cd openkb-demo
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 2. Install Python dependencies

```bash
pip install fastapi uvicorn python-dotenv requests python-multipart openkb
```

### 3. Configure environment variables

Create a `.env` file in the project root:
```
OPENROUTER_API_KEY=your_key_here
LLM_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```
### 4. Initialise the knowledge base

```bash
python run_init.py
```

This creates the `my_knowledge_base/` directory structure. Run this once before starting the backend.

### 5. Start the backend

```bash
cd backend
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Usage

1. Open `http://localhost:5173` in your browser
2. Click **Upload .md file** in the sidebar and select a Markdown document
3. Wait for indexing to complete — the sidebar stats will update
4. Type a question in the chat input and press **Enter** or **Send**
5. The assistant answers using only the content from your indexed documents

---

## How It Works

### Indexing pipeline
```
Upload .md file
→ FastAPI saves it to raw_docs/
→ Calls: openkb add <file>
→ OpenKB sends document to LLM via OpenRouter
→ LLM generates summary + concept pages with [[wikilinks]]
→ Written to my_knowledge_base/wiki/
```
### Query pipeline
```
User asks a question
→ FastAPI reads all wiki/summaries/.md and wiki/concepts/.md
→ Concatenates them as system context
→ Calls OpenRouter chat completions API directly
→ Returns grounded answer to the React frontend
```
> **Note:** The `openkb query` CLI command requires an interactive TTY and does not
> work via subprocess on Windows. Queries are handled directly through the
> OpenRouter REST API instead, using the generated wiki files as context.

---

## API Endpoints

| Method | Endpoint             | Description                          |
|--------|----------------------|--------------------------------------|
| GET    | `/api/status`        | Returns KB stats and indexed doc list |
| POST   | `/api/add-document`  | Upload and index a `.md` file        |
| POST   | `/api/query`         | Query the knowledge base             |

---

## Known Limitations

- Only `.md` (Markdown) files are supported as input
- Free LLM tiers on OpenRouter have rate limits — if indexing fails, wait and retry
- The entire wiki is sent as context on every query; this does not scale to large document sets
- No authentication — intended for local use only
- Requires both backend and frontend servers running simultaneously

---

## Model Configuration

The model is set in `backend/main.py`:

```python
LLM_MODEL = "mistralai/mistral-7b-instruct:free"
```

Other free models available on OpenRouter:
```
meta-llama/llama-3.3-70b-instruct:free
google/gemma-3-27b-it:free
microsoft/phi-4-reasoning:free
deepseek/deepseek-r1:free
```
---