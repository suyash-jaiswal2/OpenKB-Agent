import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import axios from "axios"
import "./App.css"

const API = "http://localhost:8000"

const MODELS = {
  groq: [
    { label: "Llama 3.3 70B", value: "llama-3.3-70b-versatile" },
    { label: "Llama 3.1 8B", value: "llama-3.1-8b-instant" },
    { label: "Mixtral 8x7B", value: "mixtral-8x7b-32768" },
  ],
  openrouter: [
    { label: "Nemotron Super 120B", value: "nvidia/nemotron-3-super-120b-a12b:free" },
    { label: "Nemotron Nano 30B", value: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" },
    { label: "Laguna XS.2", value: "poolside/laguna-xs.2:free" },
  ]
}



function parseStatus(raw) {
  const nums = { sources: 0, summaries: 0, concepts: 0 }
  if (!raw) return nums
  for (const line of raw.split("\n")) {
    for (const key of Object.keys(nums)) {
      const match = line.match(new RegExp(`${key}\\s+(\\d+)`, "i"))
      if (match) nums[key] = parseInt(match[1])
    }
  }
  return nums
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ sources: 0, summaries: 0, concepts: 0 })
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const [provider, setProvider] = useState("groq")
  const [model, setModel] = useState("llama-3.3-70b-versatile")

  const fetchStatus = () => {
    axios.get(`${API}/api/status`).then(res => {
      setStats(parseStatus(res.data.status))
      const docMatch = res.data.documents?.match(/[\w-]+\.md/g) || []
      setDocs([...new Set(docMatch)])
    }).catch(() => {})
  }

  useEffect(() => { fetchStatus() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])

  const sendQuery = async () => {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: question }])
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/query`, { question, provider, model })
      setMessages(prev => [...prev, { role: "assistant", content: res.data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Could not reach the backend. Is uvicorn running?" }])
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    try {
      const res = await axios.post(`${API}/api/add-document`, form)
      setMessages(prev => [...prev, {
        role: "system",
        content: `Indexed: ${file.name}\n${res.data.message}`
      }])
      fetchStatus()
    } catch {
      setMessages(prev => [...prev, { role: "system", content: `Failed to upload ${file.name}` }])
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }



  return (
    <div className="layout">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🧠</div>
            <span className="logo-text">KnowledgeBase</span>
          </div>
          <div className="version-badge">v0.1.0 · local</div>
        </div>

        <div className="sidebar-section">
          <div className="section-label">Index Stats</div>
          <div className="status-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.sources}</div>
              <div className="stat-label">Documents</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.summaries}</div>
              <div className="stat-label">Summaries</div>
            </div>
            <div className="stat-card" style={{ gridColumn: "1 / -1" }}>
              <div className="stat-value">{stats.concepts}</div>
              <div className="stat-label">Concept pages</div>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-label">Add Document</div>
          <div
            className={`upload-area ${uploading ? "uploading" : ""}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <div className="upload-icon">{uploading ? "⏳" : "📄"}</div>
            <div className="upload-text">
              <strong>{uploading ? "Indexing..." : "Upload .md file"}</strong>
              Drop or click to browse
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </div>

        <div className="docs-list">
          <div className="section-label">Indexed Files</div>
          {docs.length === 0
            ? <div style={{ fontSize: 12, color: "var(--text-dim)" }}>No files indexed yet</div>
            : docs.map(d => (
                <div key={d} className="doc-item">
                  <div className="doc-dot" />
                  {d}
                </div>
              ))
          }
        </div>
      </aside>

      {/* Chat */}
      <div className="chat-area">
        <div className="chat-header">
          <div>
            <div className="chat-title">Query Knowledge Base</div>
            <div className="chat-subtitle">Ask questions about your indexed documents</div>
          </div>
          <div className="indicator">
            <div className="indicator-dot" />
            connected
          </div>
        </div>

        <div className="messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">⬡</div>
              <div className="empty-text">
                Upload a <code>.md</code> document on the left, then ask anything about it here.
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.role}`}>
              <div className="message-label">
                {msg.role === "user" ? "You" : msg.role === "assistant" ? "Assistant" : "System"}
              </div>
              <div className={`bubble ${msg.role}`}>
                {msg.role === "assistant"
                  ? <ReactMarkdown>{msg.content}</ReactMarkdown>
                  : msg.content
                }
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row assistant">
              <div className="message-label">Assistant</div>
              <div className="typing">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="input-bar">
          <select
            value={provider}
            onChange={e => {
              setProvider(e.target.value)
              setModel(MODELS[e.target.value][0].value)
            }}
            className="model-select"
          >
            <option value="groq">Groq</option>
            <option value="openrouter">OpenRouter</option>
          </select>

          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="model-select"
          >
            {MODELS[provider].map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <input
            className="input-field"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); sendQuery() } }}
            placeholder="Ask something about your documents..."
          />
          <button className="send-btn" onClick={sendQuery} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}