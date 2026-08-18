<div align="center">

<img src="UI/image/MOODMITRALOGO.png" alt="MoodMitra Logo" width="120" />

# MoodMitra

### *Your AI-Powered Emotional Wellbeing Companion*

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-2ea44f?logo=github&logoColor=white)](https://smokevicky.github.io/MoodMitra/)
[![Node.js](https://img.shields.io/badge/Node.js-v20.x_LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)](https://python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

**🌐 Live Demo:** [https://smokevicky.github.io/MoodMitra/](https://smokevicky.github.io/MoodMitra/)

A full-stack mental health companion web application that combines real-time AI-powered facial emotion detection, a private mood journal, an AI-guided mental wellness chat, calming music, mindfulness games, curated mentors, and daily check-in routines — all in one beautiful, dark-mode-first interface.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [macOS / Linux](#macos--linux)
  - [Windows](#windows)
- [Running the Application](#running-the-application)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
  - [UI Server (Port 3000)](#ui-server-port-3000)
  - [Python AI Backend (Port 5001)](#python-ai-backend-port-5001)
- [Emotion Detection Engines](#emotion-detection-engines)
- [Pages & Routes](#pages--routes)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Overview

MoodMitra ("Mood Friend" in Hindi) is a holistic digital mental health platform built as a final academic project. It runs as two coordinated servers:

| Server | Role | Port |
|--------|------|------|
| **Node.js / Express** | Serves the UI, handles user authentication, journal entries, and mood history via SQLite | `3000` |
| **Python / Flask** | Hosts the AI emotion detection engine (FER+ ONNX neural network + OpenCV fallback) | `5001` |

The frontend is built with pure HTML, CSS (Tailwind CDN), and vanilla JavaScript — no build step required. Everything runs locally on your machine.

---

## Features

### 🎭 MoodCam — Real-Time Facial Emotion Detection
- Live webcam feed with face-detection overlays
- Two selectable AI engines:
  - **FER+ ONNX** (neural network, server-side) — Microsoft Research's FER+ model with ~85%+ accuracy, 8 emotion classes
  - **face-api.js** (client-side, in-browser ML) — runs entirely without the Python backend
- Emotion classes: `happy`, `sad`, `angry`, `surprised`, `fearful`, `disgusted`, `neutral`
- Real-time biometric readouts: Smile strength, Eye openness, Brow elevation, Ambient light intensity
- Animated per-mood background themes and activity suggestions based on detected emotion
- Full mood scan history with photo captures saved per session
- Glassmorphic modal detail view for each historical scan
- Mood data persisted to the backend database (when logged in)

### 📔 Story Now — Private Mood Journal
- Rich markdown-style journaling with live word count
- Per-entry mood tag selection
- Encrypted-session entries: only visible to the logged-in user
- Full CRUD — create, read, and delete journal entries
- Elegant animated card layout with dark/light mode support

### 💬 Serene Chat — AI Mental Health Companion
- Curated, evidence-based responses for **25 mental health topics**, including:
  - Anxiety, Depression, Stress, Insomnia, Loneliness, Panic Attacks, Trauma, Burnout, Grief, Phobias, Addiction, and more
- Pill-based query selector (collapsible, 25 topics)
- Animated typing indicator with avatar-based chat bubbles
- Dark/light theme toggle
- Fully private — no messages are stored or transmitted

### 🎵 Music — Mood-Based Music Player
- Curated mood-tagged music playlist for relaxation and focus
- In-browser audio player

### 🎮 Games — Mindfulness Mini-Games
- Relaxation and focus-building interactive games to reduce stress

### 🧑‍🏫 Mentors — Expert Wellness Guide Directory
- Curated mentor profiles for mental health, therapy, mindfulness, and coaching

### 📅 Daily 3 — Daily Mindfulness Routine
- A structured daily check-in experience for building consistent mindfulness habits

### 🔐 User Authentication
- Secure registration and login with bcrypt-hashed passwords
- Session-based authentication using `express-session`
- 1-week session persistence via cookie
- Per-user data isolation across journal entries and mood history

### 🌗 Dark / Light Mode
- System-preference aware on first load
- Toggle persisted in `localStorage` across all pages

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│                                                              │
│  index.html · moodcam.html · chat.html · story.html         │
│  music.html · games.html  · mentors.html · daily.html       │
│  about.html · login.html                                     │
│                                                              │
│  auth-nav.js (shared auth UI component)                      │
│  face-api.js (CDN — client-side ML, optional engine)        │
└──────────────┬────────────────────────┬─────────────────────┘
               │ HTTP / fetch()          │ HTTP POST /analyze
               ▼                        ▼
┌──────────────────────┐   ┌─────────────────────────────────┐
│  Node.js / Express   │   │   Python / Flask  (port 5001)   │
│  (port 3000)         │   │                                 │
│                      │   │  ┌──────────────────────────┐   │
│  ┌────────────────┐  │   │  │  FER+ ONNX Neural Net    │   │
│  │  better-sqlite3│  │   │  │  emotion_ferplus.onnx    │   │
│  │  journal.db    │  │   │  │  (35 MB, 8 classes)      │   │
│  │                │  │   │  └──────────────┬───────────┘   │
│  │  users         │  │   │                 │ fallback       │
│  │  entries       │  │   │  ┌──────────────▼───────────┐   │
│  │  mood_history  │  │   │  │  OpenCV Haar Cascades    │   │
│  └────────────────┘  │   │  │  (smile, eye, face XML)  │   │
│                      │   │  └──────────────────────────┘   │
│  /register  /login   │   │                                 │
│  /logout    /me      │   │  POST /analyze                  │
│  /save      /entries │   │  → base64 frame in              │
│  /delete/:id         │   │  ← JSON emotion scores out      │
│  /mood      /mood-history│                                 │
│  /delete mood/:id    │   └─────────────────────────────────┘
└──────────────────────┘
```

---

## Project Structure

```
MoodMitra/
│
├── README.md                        ← You are here
│
├── Backend/                         ← Python Flask AI Server
│   ├── app.py                       ← Main Flask application
│   ├── emotion_ferplus.onnx         ← FER+ ONNX model (35 MB)
│   ├── haarcascade_frontalface_default.xml
│   ├── haarcascade_eye.xml
│   ├── haarcascade_smile.xml
│   ├── templates/                   ← Flask HTML templates (standalone UI)
│   ├── static/                      ← Flask static assets
│   └── venv/                        ← Python virtual environment (local only)
│
└── UI/                              ← Node.js Express Frontend Server
    ├── server.js                    ← Express server (auth, journal, mood API)
    ├── package.json
    ├── journal.db                   ← SQLite database (auto-created)
    │
    ├── index.html                   ← Home page (hero carousel + feature cards)
    ├── moodcam.html                 ← AI facial emotion detection
    ├── chat.html                    ← Serene mental health chat companion
    ├── story.html                   ← Private mood journal
    ├── music.html                   ← Mood-based music player
    ├── games.html                   ← Mindfulness mini-games
    ├── mentors.html                 ← Expert mentor directory
    ├── daily.html                   ← Daily mindfulness check-in
    ├── about.html                   ← About the project
    ├── login.html                   ← Login / Register page
    │
    ├── auth-nav.js                  ← Shared auth & navigation component
    ├── script.js                    ← Global utilities
    ├── style.css                    ← Global styles
    ├── about_page.css
    ├── about_script.js
    │
    ├── image/                       ← UI images and logos
    ├── img/                         ← Additional images
    ├── music/                       ← Audio files
    ├── vedio/                       ← Background video files (hero carousel)
    └── node_modules/                ← npm dependencies (local only)
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | — |
| **CSS Framework** | Tailwind CSS | CDN (v3) |
| **Fonts** | Google Fonts (Plus Jakarta Sans, Manrope, DM Serif Display, Lora) | CDN |
| **Icons** | Google Material Symbols | CDN |
| **Client-Side ML** | face-api.js | 0.22.2 (CDN) |
| **UI Server** | Node.js + Express | v20 LTS + Express 5.x |
| **Database** | SQLite (via better-sqlite3) | 12.x |
| **Auth** | express-session + bcryptjs | — |
| **AI Backend** | Python + Flask + Flask-CORS | 3.x |
| **Computer Vision** | OpenCV (cv2) | 4.x |
| **ML Inference** | ONNX Runtime (`onnxruntime`) | 1.x |
| **Emotion Model** | FER+ (Microsoft Research) | ONNX format |

---

## Prerequisites

Make sure the following are installed on your system before proceeding.

| Requirement | Minimum Version | Check Command |
|-------------|----------------|---------------|
| **Node.js** | v20 LTS | `node -v` |
| **npm** | v10+ | `npm -v` |
| **Python** | 3.9+ | `python3 --version` |
| **pip** | 21+ | `pip --version` |
| **Webcam** | Any USB/built-in | Required for MoodCam |

> **Note:** Do NOT use Node.js v25 or other non-LTS versions. The `better-sqlite3` package requires a stable LTS release to compile native bindings correctly.

---

## Installation

### macOS / Linux

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/MoodMitra.git
cd MoodMitra
```

#### 2. Install UI Server Dependencies
```bash
cd UI
npm install
cd ..
```

#### 3. Set Up Python Backend
```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
pip install flask flask-cors opencv-python onnxruntime numpy
cd ..
```

---

### Windows

> ⚠️ **Important:** If you downloaded this project from a Mac machine (e.g., via ZIP or Git), you **must** delete the existing `node_modules` folder before running `npm install`. Native modules like `better-sqlite3` compile for the host OS and are not cross-compatible.

#### 1. Install Node.js v20 LTS
Download from [nodejs.org](https://nodejs.org/) → choose **v20 LTS** → run the `.msi` installer.

#### 2. Install UI Dependencies (Fresh)
Open **PowerShell** and run:
```powershell
cd "path\to\MoodMitra\UI"

# Delete stale Mac-compiled modules if present
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Reinstall for Windows
npm install
```

#### 3. Set Up Python Backend
```powershell
cd "path\to\MoodMitra\Backend"
python -m venv venv
venv\Scripts\activate
pip install flask flask-cors opencv-python onnxruntime numpy
```

---

## Running the Application

You need **two terminal windows** running simultaneously.

### Terminal 1 — UI Server (Express)
```bash
# macOS / Linux
cd "/path/to/MoodMitra/UI"
node server.js
```
```powershell
# Windows
cd "path\to\MoodMitra\UI"
node server.js
```
✅ Open your browser at: **http://localhost:3000**

---

### Terminal 2 — AI Backend (Flask)
```bash
# macOS / Linux
cd "/path/to/MoodMitra/Backend"
source venv/bin/activate
python app.py
```
```powershell
# Windows
cd "path\to\MoodMitra\Backend"
venv\Scripts\activate
python app.py
```
✅ AI backend running at: **http://127.0.0.1:5001**

---

> **Both servers must be running** to use MoodCam in OpenCV/ONNX mode. If only the UI server is running, MoodCam will still work using the browser-based **face-api.js** engine.

---

## Database Schema

The application uses a local **SQLite** database (`UI/journal.db`), automatically created on first run.

### `users`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment user ID |
| `name` | TEXT | Display name |
| `email` | TEXT UNIQUE | Login email |
| `password` | TEXT | bcrypt hashed password |
| `created_at` | DATETIME | Registration timestamp |

### `entries` (Journal)
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment entry ID |
| `user_id` | INTEGER FK | References `users(id)` |
| `name` | TEXT | Author name |
| `title` | TEXT | Entry title |
| `body` | TEXT | Entry content |
| `mood` | TEXT | Mood emoji tag |
| `wc` | INTEGER | Word count |
| `created_at` | DATETIME | Creation timestamp |

### `mood_history`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment record ID |
| `user_id` | INTEGER FK | References `users(id)` (nullable for guests) |
| `emotion` | TEXT | Dominant emotion detected |
| `source` | TEXT | Detection source (`faceapi` / `opencv`) |
| `smile` | REAL | Smile strength (0–100) |
| `eye_open` | REAL | Eye openness score (0–100) |
| `brow_raise` | REAL | Brow elevation score (0–100) |
| `light` | REAL | Ambient light intensity (0–100) |
| `photo` | TEXT | Base64 face capture (nullable) |
| `engine` | TEXT | Model used (`onnx-ferplus` / `opencv-heuristic`) |
| `latency` | INTEGER | Inference time in ms |
| `created_at` | DATETIME | Scan timestamp |

---

## API Reference

### UI Server (Port 3000)

#### Authentication

| Method | Route | Body | Description |
|--------|-------|------|-------------|
| `POST` | `/register` | `{ name, email, password }` | Register a new user |
| `POST` | `/login` | `{ email, password }` | Login and create session |
| `POST` | `/logout` | — | Destroy session |
| `GET` | `/me` | — | Returns `{ user: { id, name } }` or `{ user: null }` |

#### Journal Entries

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/save` | ✅ | Save a new journal entry |
| `GET` | `/entries` | ✅ | Fetch all entries for current user |
| `DELETE` | `/delete/:id` | ✅ | Delete an entry by ID (owner-only) |

#### Mood History

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/mood` | Optional | Save a mood scan result |
| `GET` | `/mood-history` | ✅ | Fetch last 50 mood records |
| `DELETE` | `/mood/:id` | ✅ | Delete a mood record (owner-only) |

---

### Python AI Backend (Port 5001)

#### `POST /analyze`

Accepts a Base64-encoded JPEG frame and returns emotion analysis.

**Request Body:**
```json
{
  "frame": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response (face detected):**
```json
{
  "emotion": "happy",
  "scores": {
    "happy": 0.7842,
    "neutral": 0.1203,
    "surprised": 0.0511,
    "sad": 0.0201,
    "angry": 0.0143,
    "fearful": 0.0068,
    "disgusted": 0.0032
  },
  "eye_open": 72.5,
  "brow_raise": 18.3,
  "face_detected": true,
  "engine": "onnx-ferplus"
}
```

**Response (no face detected):**
```json
{
  "emotion": "none",
  "scores": {},
  "eye_open": 0,
  "brow_raise": 0,
  "face_detected": false,
  "engine": "onnx-ferplus"
}
```

---

## Emotion Detection Engines

MoodMitra supports two detection engines, selectable in the MoodCam UI:

### 🧠 FER+ ONNX (Default — Recommended)
- **Model:** Microsoft Research FER+ trained on 35,887 labelled face images
- **Runtime:** `onnxruntime` (Python, server-side)
- **Input:** 64×64 grayscale face crop
- **Output:** 8-class probability distribution (softmax)
- **Accuracy:** ~85%+ on standard benchmarks
- **Classes:** `neutral`, `happiness`, `surprise`, `sadness`, `anger`, `disgust`, `fear`, `contempt` → mapped to 7 standard labels
- **Requires:** Python backend running on port 5001

### 👁️ face-api.js (Client-Side)
- **Runtime:** TensorFlow.js in the browser — no server required
- **Models:** `SsdMobilenetv1` (face detection) + `FaceExpressionNet`
- **Runs entirely client-side** — works even without the Python backend
- **Suitable for:** Offline/demo usage or if Python setup is unavailable

### 🔄 OpenCV Heuristic Fallback
- Automatically activates if the ONNX model fails to load
- Uses Haar cascade classifiers (smile, eye, face detection)
- Computes emotion scores using geometric heuristics (smile area, eye count, brow edge density, brightness)
- No ML dependency required — pure OpenCV

---

## Pages & Routes

All pages are served statically from the UI server at `http://localhost:3000`.

| URL | File | Description |
|-----|------|-------------|
| `/` or `/index.html` | `index.html` | Home — hero video carousel + feature cards |
| `/moodcam.html` | `moodcam.html` | AI facial emotion scanner |
| `/chat.html` | `chat.html` | Serene mental health chat |
| `/story.html` | `story.html` | Private mood journal |
| `/music.html` | `music.html` | Mood-based music player |
| `/games.html` | `games.html` | Mindfulness mini-games |
| `/mentors.html` | `mentors.html` | Expert mentor directory |
| `/daily.html` | `daily.html` | Daily mindfulness routine |
| `/about.html` | `about.html` | About the project |
| `/login.html` | `login.html` | Login and registration |

---

## Troubleshooting

### ❌ `better-sqlite3` — "not a valid Win32 application"
The `node_modules` folder was built on a different OS (e.g., macOS).

**Fix:**
```powershell
cd UI
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

---

### ❌ `npm install` fails with native build errors
You are likely using a non-LTS Node.js version (e.g., v25.x).

**Fix:** Downgrade to Node.js **v20 LTS** from [nodejs.org](https://nodejs.org/).

---

### ❌ Python backend fails to start — missing packages
```
ModuleNotFoundError: No module named 'flask'
```

**Fix:** Activate the virtual environment first:
```bash
# macOS/Linux
source venv/bin/activate
python app.py

# Windows
venv\Scripts\activate
python app.py
```

---

### ❌ MoodCam shows "no face detected" consistently
- Ensure adequate lighting (bright, front-facing light)
- Sit closer to the camera (face should fill ~30–50% of frame)
- Try switching to the `face-api.js` engine using the Engine dropdown in MoodCam

---

### ❌ ONNX model not loading
```
⚠️ ONNX model failed to load
```
The system will automatically fall back to OpenCV heuristics. To resolve:
```bash
pip install onnxruntime
```
Ensure `emotion_ferplus.onnx` is present in the `Backend/` folder (35 MB file — do not rename or move it).

---

### 🔎 Viewing the Database
To inspect `journal.db` directly:

**Option 1 — VS Code Extension:** Install [SQLite Viewer](https://marketplace.visualstudio.com/items?itemName=qwtel.sqlite-viewer) and click `journal.db` in the Explorer.

**Option 2 — DB Browser for SQLite:** Download from [sqlitebrowser.org](https://sqlitebrowser.org).

**Option 3 — Terminal:**
```bash
sqlite3 UI/journal.db
.tables
SELECT * FROM users;
SELECT * FROM entries;
SELECT * FROM mood_history;
.quit
```

---

## Contributing

This project was built as a college final year project. Contributions, suggestions, and improvements are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

<div align="center">

Made with 💙 for mental wellness

© 2026 MoodMitra · All rights reserved

*If you or someone you know is in crisis, please contact the* **[iCall helpline](https://icallhelpline.org/)** *or* **[Vandrevala Foundation](https://www.vandrevalafoundation.com/)** *(1860-2662-345 — 24/7)*

</div>
