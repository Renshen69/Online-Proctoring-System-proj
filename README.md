# 🎓 Online Proctoring System

An AI-powered online exam proctoring system that monitors students in real-time during exams. The system detects faces, tracks attention, identifies devices, and monitors violations like mouse movements outside the window and tab switching.

---

## 📋 Table of Contents

- [Features](#-features)
- [System Requirements](#-system-requirements)
- [Installation Guide](#-installation-guide)
  - [Step 1: Install Prerequisites](#step-1-install-prerequisites)
  - [Step 2: Download the Project](#step-2-download-the-project)
  - [Step 3: Setup Backend](#step-3-setup-backend)
  - [Step 4: Setup Frontend](#step-4-setup-frontend)
  - [Step 5: Run the Application](#step-5-run-the-application)
- [How to Use](#-how-to-use)
- [Troubleshooting](#-troubleshooting)
- [Features Explained](#-features-explained)

---

## ✨ Features

### 🔍 AI-Powered Monitoring
- **Face Detection**: Identifies if student face is visible
- **Multiple Face Detection**: Alerts if more than one person is in frame
- **Head Pose Tracking**: Monitors if student is looking at the screen
- **Gaze Tracking**: Detects where the student is looking
- **Device Detection**: Identifies phones or other devices in view
- **Attention Scoring**: Real-time attention level calculation

### 🚨 Violation Tracking
- **Mouse Out Detection**: Tracks when mouse leaves the exam window
- **Tab Switching Detection**: Detects when student switches tabs/windows
- **Real-time Alerts**: Instant notifications to students
- **Live Counters**: Shows violation counts during exam
- **Accurate Counting**: Each violation counts exactly once

### 👨‍💼 Admin Features
- Create custom exams with questions
- Monitor all students in real-time
- View detailed proctoring analytics
- Manage exam sessions
- Secure login with email verification

### 👨‍🎓 Student Features
- Clean, distraction-free exam interface
- See your proctoring status in real-time
- Get instant feedback on violations
- Take exams with MCQ and essay questions

---

## 💻 System Requirements

### For Windows:
- **Windows 10** or later
- **4 GB RAM** minimum (8 GB recommended)
- **Webcam** (built-in or external)
- **Internet connection**
- **Modern web browser** (Chrome, Edge, Firefox)

### For Mac:
- **macOS 10.15** or later
- **4 GB RAM** minimum (8 GB recommended)
- **Webcam** (built-in or external)
- **Internet connection**
- **Modern web browser** (Chrome, Safari, Firefox)

### For Linux:
- **Ubuntu 20.04** or later (or equivalent)
- **4 GB RAM** minimum (8 GB recommended)
- **Webcam** (built-in or external)
- **Internet connection**
- **Modern web browser** (Chrome, Firefox)

---

## 📥 Installation Guide

### Step 1: Install Prerequisites

#### 1.1 Install Python (Backend)

**Windows:**
1. Go to [python.org/downloads](https://www.python.org/downloads/)
2. Download **Python 3.11** or later
3. **IMPORTANT**: During installation, check ✅ **"Add Python to PATH"**
4. Click "Install Now"
5. After installation, open Command Prompt and verify:
   ```cmd
   python --version
   ```
   You should see: `Python 3.11.x` or higher

**Mac:**
1. Open Terminal (press `Cmd + Space`, type "Terminal")
2. Install Homebrew if you don't have it:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. Install Python:
   ```bash
   brew install python@3.11
   ```
4. Verify installation:
   ```bash
   python3 --version
   ```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.11 python3-pip python3-venv
python3 --version
```

#### 1.2 Install Node.js (Frontend)

**Windows:**
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS version** (recommended)
3. Run the installer
4. Accept all default options
5. After installation, open Command Prompt and verify:
   ```cmd
   node --version
   npm --version
   ```

**Mac:**
```bash
brew install node
node --version
npm --version
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

#### 1.3 Install Git (Optional but Recommended)

**Windows:**
1. Go to [git-scm.com](https://git-scm.com/download/win)
2. Download and install Git for Windows
3. Use default options during installation

**Mac:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt install git
```

---

### Step 2: Download the Project

**Option A: Using Git (Recommended)**
```bash
git clone https://github.com/Renshen69/Online-Proctoring-System-proj.git
cd Online-Proctoring-System-proj
```

**Option B: Download ZIP**
1. Go to [github.com/Renshen69/Online-Proctoring-System-proj](https://github.com/Renshen69/Online-Proctoring-System-proj)
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Extract the ZIP file to a folder
5. Open Command Prompt/Terminal and navigate to the extracted folder:
   ```bash
   cd path/to/Online-Proctoring-System-proj
   ```

---

### Step 3: Setup Backend

#### 3.1 Navigate to Backend Folder
```bash
cd backend
```

#### 3.2 Create Virtual Environment (Recommended)

**Windows (Command Prompt):**
```cmd
python -m venv venv
venv\Scripts\activate
```

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*If you get an error about execution policy, run PowerShell as Administrator and execute:*
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

After activation, you should see `(venv)` at the start of your command line.

#### 3.3 Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**This will install:**
- FastAPI (web framework)
- Uvicorn (server)
- OpenCV (computer vision)
- MediaPipe (face detection)
- NumPy (calculations)
- And other required packages

**Wait for installation to complete** (may take 2-5 minutes)

#### 3.4 Setup Database

Run the migration script to set up the database:
```bash
python migrate_database.py
```

You should see:
```
✅ Database migration completed successfully!
```

---

### Step 4: Setup Frontend

#### 4.1 Open New Terminal/Command Prompt

Keep the backend terminal open. Open a **NEW** terminal window.

#### 4.2 Navigate to Frontend Folder

```bash
cd path/to/Online-Proctoring-System-proj/frontend
```

#### 4.3 Install Node Dependencies

```bash
npm install
```

**This will install:**
- React (UI framework)
- Vite (build tool)
- Tailwind CSS (styling)
- TypeScript (type safety)
- And other required packages

**Wait for installation to complete** (may take 3-5 minutes)

---

### Step 5: Run the Application

You need **TWO terminal windows** open:

#### Terminal 1: Run Backend

```bash
# Navigate to backend folder
cd path/to/Online-Proctoring-System-proj/backend

# Activate virtual environment (if not already activated)
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Start the backend server
python main.py
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ **Backend is running on:** http://localhost:8000

#### Terminal 2: Run Frontend

```bash
# Navigate to frontend folder
cd path/to/Online-Proctoring-System-proj/frontend

# Start the frontend development server
npm run dev
```

**You should see:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ **Frontend is running on:** http://localhost:5173

#### 5.3 Open the Application

Open your web browser and go to:
```
http://localhost:5173
```

🎉 **Congratulations! The application is now running!**

---

## 🎯 How to Use

### For Admins

#### 1. Create Admin Account
1. Go to http://localhost:5173
2. Click **"Admin Login"** or go to **"Sign Up"**
3. Enter your email and password
4. Click **"Sign Up"**
5. Check your email for OTP code
6. Enter the OTP to verify your account

#### 2. Login
1. Click **"Login"** 
2. Enter your email and password
3. Click **"Login"**

#### 3. Create an Exam
1. Click **"Create New Exam"**
2. Fill in exam details:
   - Exam Title (e.g., "Math Final Exam")
   - Exam Description (optional)
   - Student ID (e.g., "STU001")
3. Click **"Create Exam"**
4. Add questions:
   - Choose MCQ or Essay type
   - Enter question text
   - For MCQ: Add options and mark correct answer
5. Click **"Finish Creating Exam"**
6. Copy the exam link and share with students

#### 4. Monitor Exams
1. View **"Live Exams"** section
2. See real-time student status
3. Click **"View Results"** to see detailed metrics
4. Monitor violation counts (mouse out, tab switches, etc.)

### For Students

#### 1. Join Exam
1. Get the exam link from your instructor
2. Open the link in your browser
3. Enter your **Roll Number** (e.g., "STU001")
4. Click **"Join Exam"**

#### 2. Grant Camera Permission
1. Browser will ask for camera access
2. Click **"Allow"**
3. You should see your camera preview in the sidebar

#### 3. Take the Exam
1. Answer questions in the main area
2. Keep your face visible in the camera
3. Stay on the exam page (don't switch tabs)
4. Keep mouse inside the exam window
5. Monitor your proctoring status in the sidebar

#### 4. Submit Exam
1. Click **"End Test"** when finished
2. View your results including:
   - Average attention score
   - Number of distractions
   - Violation counts
   - And more metrics

---

## 🔧 Troubleshooting

### Backend Won't Start

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`
**Solution:**
1. Make sure virtual environment is activated
2. Run: `pip install -r requirements.txt`

**Problem:** `Port 8000 already in use`
**Solution:**
- Close any other programs using port 8000
- Or edit `main.py` and change the port number

### Frontend Won't Start

**Problem:** `npm: command not found`
**Solution:** Install Node.js (see Step 1.2)

**Problem:** `ENOENT: no such file or directory`
**Solution:** 
1. Make sure you're in the `frontend` folder
2. Run `npm install` again

### Camera Not Working

**Problem:** Camera shows black screen or "Permission Denied"
**Solution:**
1. Check browser permissions:
   - Click the lock icon in address bar
   - Allow camera access
2. Make sure no other application is using the camera
3. Try a different browser (Chrome recommended)

### Database Errors

**Problem:** `no such table: violations`
**Solution:** Run the migration script:
```bash
cd backend
python migrate_database.py
```

### Can't Connect to Backend

**Problem:** Frontend shows "Connection Error"
**Solution:**
1. Make sure backend is running (check Terminal 1)
2. Backend should be on http://localhost:8000
3. Try restarting the backend

### Common Windows Issues

**Problem:** `'python' is not recognized as an internal or external command`
**Solution:**
1. Reinstall Python
2. **Make sure** to check "Add Python to PATH" during installation

**Problem:** PowerShell execution policy error
**Solution:** Run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📚 Features Explained

### Proctoring Features

#### Face Detection
- System detects if your face is visible
- Alerts if no face or multiple faces detected
- Uses AI to identify faces in real-time

#### Head Pose Tracking
- Monitors if you're looking at the screen
- Detects if you're looking away
- Tracks head rotation angles

#### Device Detection
- Identifies phones in the camera view
- Alerts if any device is detected
- Uses AI object detection

#### Attention Scoring
- Calculates your attention level (0-100%)
- Based on face visibility, head pose, and gaze
- Updated in real-time

### Violation Tracking

#### Mouse Out Detection
- Tracks when your mouse leaves the window
- Counts only once per 3 seconds (prevents spam)
- Shows warning notification
- Displayed in sidebar and final results

#### Tab Switching Detection
- Detects when you switch tabs or windows
- Counts only once per 3 seconds
- Shows warning when you return
- Visible to both student and admin

### Database

All data is stored in SQLite database (`proctoring.db`):
- Exam sessions
- Student information
- Proctoring events
- Violations
- Final results

---

## 📞 Getting Help

### Still Having Issues?

1. **Check the logs** in the terminal windows
2. **Restart both servers** (backend and frontend)
3. **Clear browser cache** (Ctrl+Shift+Delete)
4. **Try a different browser** (Chrome works best)
5. **Check system requirements** are met

### Report Issues

If you found a bug or have questions:
1. Go to: https://github.com/Renshen69/Online-Proctoring-System-proj/issues
2. Click "New Issue"
3. Describe the problem with:
   - What you were trying to do
   - What happened instead
   - Error messages (if any)
   - Your operating system

---

## 🎓 Project Structure

```
Online-Proctoring-System-proj/
│
├── backend/                    # Backend server (Python/FastAPI)
│   ├── app/                   # Core proctoring modules
│   │   ├── analyze_frame.py  # Frame analysis
│   │   ├── attention.py      # Attention scoring
│   │   ├── face_tracker.py   # Face detection
│   │   ├── gaze.py          # Gaze tracking
│   │   ├── head_pose.py     # Head pose estimation
│   │   └── device_detector.py # Device detection
│   ├── auth.py               # Authentication system
│   ├── database.py           # Database operations
│   ├── main.py              # Main server file
│   ├── migrate_database.py  # Database migration
│   └── requirements.txt     # Python dependencies
│
├── frontend/                  # Frontend app (React/TypeScript)
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Main pages
│   │   └── App.tsx         # Main app component
│   ├── package.json        # Node.js dependencies
│   └── index.html          # Entry HTML file
│
├── README.md                 # This file
├── MOUSE_TAB_TRACKING.md    # Feature documentation
└── VIOLATION_COUNT_FIX.md   # Technical details
```

---

## 🔐 Security & Privacy

- **Camera data** is processed locally and not recorded
- **Frames** are analyzed in real-time and not stored permanently
- **Admin accounts** require email verification
- **Passwords** are hashed and secured
- **Session data** is stored securely in the database

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Developer

**Renshen69**  
GitHub: [github.com/Renshen69](https://github.com/Renshen69)

---

## 🙏 Credits

Built with:
- **FastAPI** - Modern Python web framework
- **React** - Frontend library
- **OpenCV** - Computer vision
- **MediaPipe** - Face detection ML
- **SQLite** - Database
- **Tailwind CSS** - Styling

---

## ⚡ Quick Start Summary

```bash
# 1. Clone repository
git clone https://github.com/Renshen69/Online-Proctoring-System-proj.git
cd Online-Proctoring-System-proj

# 2. Setup Backend (Terminal 1)
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python migrate_database.py
python main.py

# 3. Setup Frontend (Terminal 2 - NEW WINDOW)
cd frontend
npm install
npm run dev

# 4. Open browser
# Go to: http://localhost:5173
```

---

**Need Help?** Don't hesitate to ask! Open an issue on GitHub or check the troubleshooting section above.

**Happy Proctoring! 🎉**
