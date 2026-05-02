# run_init.py  ← separate one-time script
import subprocess, shutil
from pathlib import Path

KB_DIR = Path("my_knowledge_base")
RAW_DIR = Path("raw_docs")

if KB_DIR.exists():
    shutil.rmtree(KB_DIR)
KB_DIR.mkdir()

config_dir = KB_DIR / ".openkb"
config_dir.mkdir()
(config_dir / "config.yaml").write_text(
    "model: openrouter/nvidia/nemotron-3-super-120b-a12b:free\nlanguage: en\npageindex_threshold: 20\n"
)

import os
from dotenv import load_dotenv
load_dotenv("backend/.env")
key = os.getenv("OPENROUTER_API_KEY")
(KB_DIR / ".env").write_text(f"OPENROUTER_API_KEY={key}\nLLM_API_KEY={key}\n")

wiki_dir = KB_DIR / "wiki"
for sub in ["sources", "summaries", "concepts", "explorations", "reports"]:
    (wiki_dir / sub).mkdir(parents=True)
(wiki_dir / "index.md").write_text("# Knowledge Base Index\n\nNo documents indexed yet.\n")

print("KB ready. Now run: uvicorn backend.main:app --reload")