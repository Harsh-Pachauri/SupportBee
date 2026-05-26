# 🐝 SupportBee

SupportBee is a multi-tenant AI customer support infrastructure platform that enables companies to upload documents, instantly create AI-powered support assistants, and embed them directly into websites using floating support widgets or iframe integrations.

Built with semantic retrieval, conversational memory, confidence-aware responses, escalation workflows, embeddable widgets, and pgvector-powered search.

---

# 🌐 Live Demo

https://support-bee.vercel.app/

---

# ✨ Features

## 🤖 AI-Powered RAG Pipeline

* PDF ingestion pipeline
* Text extraction + chunking
* Semantic embeddings
* Vector similarity retrieval
* Grounded AI responses
* Multi-document knowledge retrieval
* Local embedding generation for cost-efficient deployment

---

## 🏢 Multi-Tenant SaaS Architecture

* Company-level data isolation
* Tenant-safe retrieval
* Separate document knowledge bases
* Scoped conversations and embeddings
* Company-specific AI assistants
* Secure company-scoped chat systems

---

## 💬 Conversational Memory

* Multi-turn conversations
* Follow-up question support
* Persistent chat history
* Session-aware context retrieval
* Independent customer sessions

---

## 📈 Confidence Scoring System

* Retrieval similarity scoring
* Confidence classification
* Confidence-aware responses
* Escalation triggers
* Retrieval observability logs
* Semantic retrieval debugging pipeline

---

## 🚨 Human Escalation Workflow

* Automatic escalation for low-confidence responses
* Escalated conversation tracking
* Human follow-up request system
* Contact capture workflow
* Conversation resolution flow
* Human-review-ready architecture

---

## 🛠 Admin Conversations Panel

* Company conversation dashboard
* Escalation visibility
* Conversation inspection
* Confidence monitoring
* Support request tracking
* Resolution status management

---

## 🌐 Embeddable AI Chat Widgets

### iframe Embedding

```html
<iframe
  src="https://support-bee.vercel.app/widget/company-id"
  width="400"
  height="700"
></iframe>
```

### Script-Based Floating Widget

```html
<script
  src="https://support-bee.vercel.app/widget.js"
  data-company-id="company-id"
></script>
```

Features:

* Floating launcher button
* Overlay chat interface
* Mobile-friendly widget
* Session persistence
* Company-scoped conversations
* Embedded conversational memory

---

## 🎨 Chatbot Customization

* Custom chatbot names
* Welcome messages
* Theme/accent colors
* Widget branding support
* Company-specific chatbot identity

---

# 🧱 Tech Stack

## Frontend

* React.js
* Vite

## Backend

* Node.js
* Express.js

## Database & Storage

* Supabase PostgreSQL
* pgvector
* Supabase Storage

## AI / Retrieval

* Transformers.js
* Xenova/all-MiniLM-L6-v2
* Groq LLM API
* LangChain JS

## Deployment

* Vercel (Frontend)
* Render (Backend)
* Supabase (Database + Storage)

---

# 🧠 Architecture Overview

```text
Company Uploads PDFs
        ↓
Document Ingestion Pipeline
(extract → chunk → embed → store)
        ↓
pgvector Semantic Retrieval
        ↓
Conversation-Aware RAG
        ↓
Confidence Scoring
        ↓
Escalation Decision
        ↓
Human Follow-up Workflow
        ↓
LLM Response
```

---

# 🧩 Widget Architecture

```text
widget.js
    ↓
Floating Launcher Button
    ↓
Inject Hidden iframe
    ↓
/widget/:companyId
    ↓
Existing Chat APIs
    ↓
RAG + Memory + Escalation
```

---

# 📂 Project Structure

```text
project-root/
|
├── frontend/
|
├── backend/
|
├── docs/
|
└── README.md
```

---

# ⚙️ Core Backend Architecture

```text
backend/src/
|
├── routes/
├── controllers/
├── services/
│    ├── ingestion/
│    ├── retrieval/
│    ├── embeddings/
│    ├── llm/
│    ├── widget/
│    └── chat/
├── middleware/
├── db/
└── utils/
```

---

# 🔥 Current Capabilities

✅ Upload PDFs
✅ Automatic chunking + embeddings
✅ Semantic vector retrieval
✅ Conversational memory
✅ Confidence scoring
✅ Escalation workflows
✅ Human follow-up/contact flow
✅ Multi-tenant isolation
✅ Admin conversation panel
✅ Embeddable iframe widget
✅ Script-based floating support widget
✅ Company chatbot customization
✅ Session-aware customer conversations

---

# 🧪 Engineering Focus

SupportBee focuses heavily on:

* retrieval quality
* semantic search
* confidence calibration
* scalable RAG architecture
* multi-tenant SaaS design
* AI infrastructure engineering
* embeddable support systems
* human-in-the-loop AI workflows

---

# ⚠️ Important Notes

* Uses local MiniLM embeddings for cost-efficient deployment
* pgvector retrieval requires matching embedding dimensions
* Confidence thresholds calibrated for MiniLM embeddings
* Large multi-topic PDFs recommended for realistic RAG testing
* Widget system uses iframe isolation for styling/security safety

---

# 🚀 Future Roadmap

* Source citations
* Analytics dashboard
* Streaming responses
* Email notifications
* Slack integrations
* Advanced chunking strategies
* Hybrid semantic + keyword retrieval
* Human agent takeover system

---

# 📌 Vision

SupportBee is designed as a foundation for:

* embeddable AI support agents
* AI-powered customer support infrastructure
* enterprise support automation
* human-in-the-loop escalation systems
* scalable multi-tenant AI SaaS products

---

# 👨‍💻 Built For

* AI infrastructure learning
* RAG engineering
* SaaS system design
* production-style AI workflows
* semantic retrieval systems
* portfolio/interview demonstrations
* embeddable AI platform architecture
