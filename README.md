# 🌳 Nested Tags Tree Editor

> **AIMonk Full Stack Coding Assignment** — A recursive, interactive tree tag editor built with React (Vite) and FastAPI.

Build, edit, collapse, rename, and export nested tag hierarchies in a premium dark-mode UI. Trees persist to a SQLite database via a RESTful API.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [How It Works](#-how-it-works)
- [Default Tree](#-default-tree)
- [Screenshots](#-screenshots)

---

## ✅ Features

### Core Requirements

| # | Feature | Status |
|---|---------|--------|
| 1 | `TagView` is a **recursive** React component | ✅ |
| 2 | `data` property rendered as an **editable text input** | ✅ |
| 3 | Editing input **updates internal tree state** immutably | ✅ |
| 4 | Each tag is **collapsible** via `▾` / `▸` toggle button | ✅ |
| 5 | Collapse **hides children and data** | ✅ |
| 6 | **Root node** is also collapsible | ✅ |
| 7 | **Add Child** button on every node | ✅ |
| 8 | Add Child on a **data node** → replaces `data` with `children[]` + 1 new child | ✅ |
| 9 | Add Child on a **children node** → pushes a new child to the array | ✅ |
| 10 | New child defaults: `name = "New Child"`, `data = "Data"` | ✅ |
| 11 | **Export** button serializes tree to clean JSON, displayed below the button | ✅ |
| 12 | Export calls **POST** (new tree) or **PUT** (existing tree) API | ✅ |
| 13 | On app load: **GET /trees**, display all saved trees | ✅ |
| 14 | Multiple saved trees shown **one below the other** | ✅ |

### Bonus

| # | Feature | Status |
|---|---------|--------|
| 1 | **Click node name** to edit inline, **Enter** to confirm, **Escape** to cancel | ✅ |
| 2 | **Copy JSON** button to copy exported JSON to clipboard | ✅ |
| 3 | **Toast notifications** for save/update/copy success and errors | ✅ |
| 4 | Timestamps displayed in **IST** (Asia/Kolkata) | ✅ |

### Backend

| # | Feature | Status |
|---|---------|--------|
| 1 | FastAPI app with **CORS** enabled (all origins) | ✅ |
| 2 | **SQLAlchemy ORM** with SQLite | ✅ |
| 3 | `GET /trees` — returns list of all saved trees | ✅ |
| 4 | `POST /trees` — saves a new tree record | ✅ |
| 5 | `PUT /trees/{id}` — updates an existing tree record | ✅ |
| 6 | `tree_json` stored as **TEXT**, returned as **parsed JSON** | ✅ |
| 7 | `requirements.txt` included | ✅ |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4 |
| **Backend** | FastAPI, Uvicorn |
| **Database** | SQLite (dev) / PostgreSQL (prod via `DATABASE_URL` env var) |
| **ORM** | SQLAlchemy |
| **HTTP Client** | Axios |
| **Styling** | Tailwind CSS + Custom CSS (Glassmorphism, dark-mode) |
| **Font** | Inter (Google Fonts) |

---

## 📁 Project Structure

```
AI_Monk_Assignment/
├── backend/
│   ├── main.py              # FastAPI app — routes, CORS, startup
│   ├── database.py          # SQLAlchemy engine, session, Base
│   ├── models.py            # Tree ORM model (JSON blob storage)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── requirements.txt     # Python dependencies
│   └── trees.db             # SQLite database (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── TagView.jsx  # ⭐ Core recursive tree component
│   │   ├── App.jsx          # Root — state, saved trees, export
│   │   ├── api.js           # Axios API helper (GET, POST, PUT)
│   │   ├── index.css        # Global styles (dark-mode, glass)
│   │   └── main.jsx         # React entry point
│   ├── index.html           # HTML template
│   ├── vite.config.js       # Vite config (Tailwind + API proxy)
│   └── package.json         # Node dependencies
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **pip** (Python package manager)

### 1. Clone the Repository

```bash
git clone https://github.com/arry043/AI_Monk_Assignment.git
cd aimonk-tag-tree
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
SQLite database (`trees.db`) is auto-created on first startup.

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.  
The Vite dev server proxies `/api/*` requests to the backend at `:8000`.

### 4. Open in Browser

Navigate to **http://localhost:5173** — the Tag Tree Editor is ready to use!

---

## 📡 API Reference

**Base URL:** `http://localhost:8000`

### `GET /trees`

Returns all saved tree records.

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "tree_json": { "name": "root", "children": [...] },
    "created_at": "2026-04-27T10:30:00",
    "updated_at": null
  }
]
```

### `POST /trees`

Saves a new tree hierarchy.

**Request Body**
```json
{
  "tree": {
    "name": "root",
    "children": [
      { "name": "child1", "data": "hello" }
    ]
  }
}
```

**Response** `201 Created`
```json
{
  "id": 1,
  "tree_json": { "name": "root", "children": [...] },
  "created_at": "2026-04-27T10:30:00"
}
```

### `PUT /trees/{tree_id}`

Updates an existing tree hierarchy by ID.

**Request Body** — same as POST  
**Response** `200 OK` — returns updated record with `updated_at`  
**Error** `404 Not Found` — if `tree_id` doesn't exist

---

## 🧠 How It Works

### Recursive `TagView` Component

The heart of the app is `TagView.jsx` — a **self-referencing React component** that renders any tree node and recursively renders its children:

```
TagView(node)
├── Header: [▾ Collapse] [Node Name] [Badge] [+ Add Child]
└── Body (if expanded):
    ├── If node.data exists  → Editable <input>
    └── If node.children     → TagView(child) for each child
```

### State Management

- **No Redux** — pure `useState` + `useCallback`
- Tree state lives in `App.jsx` as `workingTree`
- Each `TagView` calls `onUpdate(modifiedNode)` which **bubbles up** to the root
- All updates are **immutable** — new objects/arrays, never mutate in place

### React Keys

- Every node has a `_id` (UUID v4) used as the React `key` prop
- **Never** uses array index as key (prevents bugs on add/delete)
- `_id` is added on creation and when loading from DB (`addIds()` helper)
- `_id` is stripped during export (`serializeTree()` produces clean JSON)

### Data vs Children Invariant

A node always has **either** `data` (string) **or** `children` (array), never both:
- **Leaf node:** `{ name, data, _id }`
- **Parent node:** `{ name, children: [...], _id }`
- When "Add Child" is clicked on a leaf → `data` is removed, `children` array is created

### Vite Proxy

The frontend uses a Vite dev server proxy so API calls go through `/api`:

```js
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

### Database Design

Trees are stored as **JSON blobs** in a single `trees` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-increment primary key |
| `tree_json` | TEXT | Full tree hierarchy as JSON string |
| `created_at` | DATETIME | Record creation timestamp (UTC) |
| `updated_at` | DATETIME | Last update timestamp (UTC) |

**Rationale:** The tree is a recursive structure — an adjacency-list schema adds complexity without benefit for this use case. JSON blob is idiomatic and simple.

---

## 🌲 Default Tree

On fresh load (empty database), the editor pre-populates with this tree:

```
root
├── child1
│   ├── child1-child1  →  data: "c1-c1 Hello"
│   └── child1-child2  →  data: "c1-c2 JS"
└── child2             →  data: "c2 World"
```

---

## 📸 Screenshots

### Tree Editor (Dark Mode)
The main editor with a loaded tree, showing collapse toggles, editable data inputs, node type badges, and the Add Child buttons.

### Export Panel
After clicking "Export & Save", the serialized JSON output is displayed in a code block with a "Copy JSON" button. The tree is simultaneously saved to the database.

### Saved Trees
Previously saved trees appear in the "Saved Trees" panel with their ID, name, and timestamps (in IST). Click any saved tree to load it into the editor.

---

## 📄 License

This project was built as part of the **AIMonk Technology** coding assignment.

---

<p align="center">
  Built with ❤️ using <b>React + FastAPI</b>
</p>
