import os
import subprocess
import shutil
import requests
from pathlib import Path
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
KB_DIR = Path("../my_knowledge_base")
RAW_DIR = Path("../raw_docs")
WIKI_DIR = KB_DIR / "wiki"

FALLBACK_MODELS = [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "poolside/laguna-xs.2:free",
]


def get_env():
    env = os.environ.copy()
    env["OPENROUTER_API_KEY"] = OPENROUTER_API_KEY
    env["LLM_API_KEY"] = OPENROUTER_API_KEY
    return env


def kb_cmd(command: str):
    args = ["openkb"] + command.split()
    result = subprocess.run(
        args,
        text=True,
        capture_output=True,
        cwd=str(KB_DIR),
        env=get_env()
    )
    return result.stdout or result.stderr


def get_wiki_context() -> str:
    context_parts = []
    for folder in ["summaries", "concepts"]:
        folder_path = WIKI_DIR / folder
        if folder_path.exists():
            for md_file in folder_path.glob("*.md"):
                content = md_file.read_text(encoding="utf-8")
                context_parts.append(f"## {md_file.stem}\n{content}")
    return "\n\n---\n\n".join(context_parts)


def call_llm(messages: list) -> str:
    for model in FALLBACK_MODELS:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"model": model, "messages": messages}
        )
        data = response.json()
        print(f"Tried {model}:", data.get("error", {}).get("message", "OK"))

        if "choices" in data:
            return data["choices"][0]["message"]["content"]

    return "All models are currently rate-limited. Please wait a few minutes and try again."


@app.get("/api/status")
def get_status():
    output = kb_cmd("status")
    docs_output = kb_cmd("list")
    return {"status": output, "documents": docs_output}


@app.post("/api/add-document")
async def add_document(file: UploadFile = File(...)):
    RAW_DIR.mkdir(exist_ok=True)
    file_path = RAW_DIR / file.filename
    file_path.write_bytes(await file.read())

    args = ["openkb", "add", str(file_path.resolve())]
    result = subprocess.run(
        args,
        text=True,
        capture_output=True,
        cwd=str(KB_DIR),
        env=get_env()
    )
    output = result.stdout or result.stderr
    return {"message": output, "filename": file.filename}


@app.post("/api/query")
async def query(body: dict):
    question = body.get("question", "")
    context = get_wiki_context()
    provider = body.get("provider", "groq")
    model = body.get("model", "llama-3.3-70b-versatile")

    if not context:
        return {"answer": "No documents indexed yet. Please add some documents first."}

    messages = [
        {
            "role": "system",
            "content": f"You are a helpful assistant. Answer questions using only the following knowledge base:\n\n{context}"
        },
        {
            "role": "user",
            "content": question
        }
    ]

    if provider == "groq":
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
                "Content-Type": "application/json",
            },
            json={"model": model, "messages": messages}
        )
    else:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"model": model, "messages": messages}
        )

    data = response.json()
    print(f"[{provider}/{model}]:", data.get("error", "OK"))

    if "choices" not in data:
        return {"answer": "Error: " + str(data.get("error", {}).get("message", data))}

    return {"answer": data["choices"][0]["message"]["content"]}