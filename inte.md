# IT Support Desk — Tauri App Integration Guide

> **Audience:** Frontend engineer building the Tauri desktop app  
> **Backend base URL:** `http://localhost:3000/api/v1`  
> **WebSocket:** `http://localhost:3000/ws`  
> **Swagger docs:** `http://localhost:3000/api/docs`  
> **Framework:** Tauri v2 + React + TypeScript

---

## Why Tauri, not Electron?

Tauri wraps your React app in a native OS window using the system's built-in WebView (WebKit on macOS, WebView2 on Windows). The backend is Rust instead of Node.js. This makes the app:

- Much smaller to ship (~10 MB vs ~200 MB)
- More memory-efficient
- Faster startup
- Better security model (explicit permission allowlist)

The key difference for this integration: **you cannot use Node.js APIs directly in your React components**. Anything that touches the OS (opening a URL, reading a file, sending native notifications) must go through a **Tauri command** (a Rust function you call from TypeScript) or a **Tauri plugin API**.

---

## Project Setup

### Create the Tauri project

```bash
npm create tauri-app@latest itfront -- --template react-ts
cd itfront
npm install
```

### Install required packages

```bash
# HTTP client
npm install axios

# WebSocket client
npm install socket.io-client

# Tauri APIs (for OS-level features)
npm install @tauri-apps/api @tauri-apps/plugin-shell @tauri-apps/plugin-notification

# State management
npm install zustand

# Routing
npm install react-router-dom
```

### Configure Tauri permissions

Open `src-tauri/tauri.conf.json` and add network and shell permissions:

```json
{
  "tauri": {
    "allowlist": {
      "shell": {
        "open": true,
        "openWith": "default"
      },
      "notification": {
        "all": true
      },
      "http": {
        "all": true,
        "request": ["http://localhost:3000/*"]
      }
    },
    "windows": [
      {
        "title": "IT Support Desk",
        "width": 1200,
        "height": 800
      }
    ]
  }
}
```

---

## App Structure

```
src/
├── api/
│   ├── client.ts          ← axios instance with JWT header
│   ├── socket.ts          ← socket.io singleton
│   └── endpoints/
│       ├── auth.ts
│       ├── tickets.ts
│       ├── devices.ts
│       └── remote-sessions.ts
├── stores/
│   ├── auth.store.ts      ← user, token, role
│   └── notifications.store.ts
├── hooks/
│   ├── useSocket.ts       ← subscribe to WS events
│   └── useRemoteSession.ts
├── pages/
│   ├── Login.tsx
│   ├── employee/
│   │   ├── Dashboard.tsx
│   │   ├── MyTickets.tsx
│   │   ├── CreateTicket.tsx
│   │   ├── TicketDetail.tsx
│   │   └── MyDevices.tsx
│   └── technician/
│       ├── Dashboard.tsx
│       ├── TicketQueue.tsx
│       ├── TicketDetail.tsx
│       └── RemoteSessionPanel.tsx
├── components/
│   ├── RemoteAccessDialog.tsx   ← approve / deny popup
│   └── SessionRequestBanner.tsx
└── App.tsx
```

---

## 1. Authentication

### `src/api/client.ts`

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10_000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
```

### `src/stores/auth.store.ts`

```typescript
import { create } from 'zustand'
import api from '../api/client'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'TECHNICIAN' | 'EMPLOYEE'
}

interface AuthStore {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  restoreSession: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('accessToken'),

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', data.accessToken)
    set({ user: data.user, token: data.accessToken })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    set({ user: null, token: null })
  },

  restoreSession: async () => {
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data })
    } catch {
      localStorage.removeItem('accessToken')
    }
  },
}))
```

### `src/pages/Login.tsx`

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/')    // App.tsx reads the role and redirects to correct dashboard
    } catch {
      setError('Invalid email or password')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Log In</button>
    </form>
  )
}
```

### `src/App.tsx` — route by role

```tsx
import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth.store'
import { connectSocket } from './api/socket'
import Login from './pages/Login'
import EmployeeDashboard from './pages/employee/Dashboard'
import TechnicianDashboard from './pages/technician/Dashboard'

export default function App() {
  const { user, token, restoreSession } = useAuthStore()

  useEffect(() => {
    restoreSession()
  }, [])

  useEffect(() => {
    if (token) connectSocket(token)   // connect WS as soon as we have a token
  }, [token])

  if (!user) return <Login />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {user.role === 'EMPLOYEE' && (
        <>
          <Route path="/" element={<EmployeeDashboard />} />
          <Route path="/tickets" element={<EmployeeDashboard />} />
          <Route path="/tickets/:id" element={<EmployeeDashboard />} />
        </>
      )}
      {user.role === 'TECHNICIAN' && (
        <>
          <Route path="/" element={<TechnicianDashboard />} />
          <Route path="/tickets" element={<TechnicianDashboard />} />
          <Route path="/tickets/:id" element={<TechnicianDashboard />} />
        </>
      )}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
```

---

## 2. WebSocket Connection

### `src/api/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket

  socket = io('http://localhost:3000/ws', {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => console.log('[WS] connected'))
  socket.on('connect_error', (err) => console.error('[WS] auth failed', err.message))
  socket.on('disconnect', () => console.log('[WS] disconnected'))

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
```

### `src/hooks/useSocket.ts`

A reusable hook for subscribing to any WebSocket event:

```typescript
import { useEffect } from 'react'
import { getSocket } from '../api/socket'

export function useSocket<T = unknown>(
  event: string,
  handler: (data: T) => void
) {
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socket.on(event, handler)
    return () => { socket.off(event, handler) }
  }, [event, handler])
}
```

---

## 3. Device Registration (runs on startup)

When the Tauri app starts and the employee logs in, it must register the device so it shows up in the IT system.

### How to read hostname in Tauri

Tauri's renderer cannot access Node's `os.hostname()`. You need a Tauri command in Rust, or you can read it from the server response. The simplest MVP approach: send a fixed hostname from the app config or use `navigator.userAgent` as a fallback. Proper way: add a Rust command.

**`src-tauri/src/main.rs`** — add a Tauri command:

```rust
#[tauri::command]
fn get_hostname() -> String {
    gethostname::gethostname()
        .to_string_lossy()
        .into_owned()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_hostname])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Add `gethostname = "0.2"` to `src-tauri/Cargo.toml`.

**In TypeScript:**

```typescript
import { invoke } from '@tauri-apps/api/tauri'

async function registerDevice(token: string) {
  const hostname = await invoke<string>('get_hostname')

  await api.post('/devices/register', {
    hostname,
    operatingSystem: navigator.platform,   // rough, good enough for MVP
    agentVersion: '1.0.0',
    // rustdeskId is set separately once RustDesk reports it
  })
}
```

Call `registerDevice()` right after a successful login.

### Heartbeat

Send a heartbeat every 30 seconds to keep the device ONLINE:

```typescript
// Run this after device registration — store the deviceId returned from register
function startHeartbeat(deviceId: string) {
  const interval = setInterval(async () => {
    try {
      await api.post(`/devices/${deviceId}/heartbeat`)
    } catch (err) {
      console.warn('Heartbeat failed', err)
    }
  }, 30_000)

  return () => clearInterval(interval)   // call this on logout to stop it
}
```

---

## 4. Employee Flow

### 4.1 My Tickets page

```tsx
// src/pages/employee/MyTickets.tsx
import { useEffect, useState } from 'react'
import api from '../../api/client'

interface Ticket {
  id: string
  ticketNumber: number
  title: string
  status: string
  priority: string
  createdAt: string
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])

  useEffect(() => {
    api.get('/tickets').then(r => setTickets(r.data))
  }, [])

  return (
    <div>
      <h1>My Tickets</h1>
      {tickets.map(t => (
        <div key={t.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 8 }}>
          <strong>#{t.ticketNumber} — {t.title}</strong>
          <span style={{ marginLeft: 12, color: 'gray' }}>{t.status}</span>
        </div>
      ))}
    </div>
  )
}
```

### 4.2 Create Ticket

```tsx
// src/pages/employee/CreateTicket.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'

export default function CreateTicket() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [deviceId, setDeviceId] = useState('')
  const [devices, setDevices] = useState<{ id: string; hostname: string }[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/devices').then(r => setDevices(r.data))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/tickets', { title, description, priority, deviceId: deviceId || undefined })
    navigate('/tickets')
  }

  return (
    <form onSubmit={submit}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the problem" required />
      <select value={priority} onChange={e => setPriority(e.target.value)}>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>
      <select value={deviceId} onChange={e => setDeviceId(e.target.value)}>
        <option value="">— No specific device —</option>
        {devices.map(d => <option key={d.id} value={d.id}>{d.hostname}</option>)}
      </select>
      <button type="submit">Submit Ticket</button>
    </form>
  )
}
```

---

## 5. The Screen Sharing Flow — Full Implementation

This is the most important integration. Read this section carefully.

### How it works in full

```
TECHNICIAN                     BACKEND                      EMPLOYEE
    │                              │                              │
    │  POST /remote-sessions       │                              │
    │ ────────────────────────────►│                              │
    │                              │                              │
    │                              │  WS: session:requested       │
    │                              │ ────────────────────────────►│
    │                              │                              │
    │                              │         (employee sees popup)│
    │                              │                              │
    │                              │  POST /remote-sessions/:id/approve
    │                              │◄─────────────────────────────│
    │                              │                              │
    │  WS: session:approved        │                              │
    │◄─────────────────────────────│                              │
    │ {rustdeskLink}               │                              │
    │                              │                              │
    │  [open link in RustDesk]     │                              │
    │                              │                              │
    │  POST /remote-sessions/:id/start                            │
    │ ────────────────────────────►│                              │
    │                              │  WS: session:started         │
    │                              │ ────────────────────────────►│
    │                              │                              │
    │   <<< screen sharing happening via RustDesk >>>             │
    │                              │                              │
    │  POST /remote-sessions/:id/end                              │
    │ ────────────────────────────►│                              │
    │                              │  WS: session:ended           │
    │                              │ ────────────────────────────►│
```

---

### 5.1 Employee side — listening and responding

The employee's app must always be connected to WebSocket and show an approve/deny dialog when `session:requested` arrives.

#### `src/components/RemoteAccessDialog.tsx`

```tsx
import { useEffect, useState, useCallback } from 'react'
import { useSocket } from '../hooks/useSocket'
import api from '../api/client'

interface SessionRequest {
  sessionId: string
  deviceHostname: string
  expiresAt: string          // ISO date — request auto-cancels after this
}

export default function RemoteAccessDialog() {
  const [request, setRequest] = useState<SessionRequest | null>(null)
  const [loading, setLoading] = useState(false)

  // Listen for incoming session:requested from backend
  const handleRequest = useCallback((data: SessionRequest) => {
    setRequest(data)
  }, [])

  useSocket('session:requested', handleRequest)

  // Also clear the dialog if session was cancelled/expired
  useSocket('session:expired-sweep', () => setRequest(null))

  // Auto-dismiss if the request expires
  useEffect(() => {
    if (!request) return
    const msLeft = new Date(request.expiresAt).getTime() - Date.now()
    const timer = setTimeout(() => setRequest(null), msLeft)
    return () => clearTimeout(timer)
  }, [request])

  const respond = async (approve: boolean) => {
    if (!request) return
    setLoading(true)
    try {
      const endpoint = approve
        ? `/remote-sessions/${request.sessionId}/approve`
        : `/remote-sessions/${request.sessionId}/deny`
      await api.post(endpoint)
      setRequest(null)
    } finally {
      setLoading(false)
    }
  }

  if (!request) return null

  return (
    // Render as a full-screen overlay or OS notification
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{ background: 'white', padding: 32, borderRadius: 12, maxWidth: 420 }}>
        <h2>🖥️ Remote Access Request</h2>
        <p>
          IT Support is requesting to view your screen on <strong>{request.deviceHostname}</strong>.
        </p>
        <p style={{ color: 'gray', fontSize: 13 }}>
          This request expires at {new Date(request.expiresAt).toLocaleTimeString()}.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            onClick={() => respond(true)}
            disabled={loading}
            style={{ background: '#22c55e', color: 'white', padding: '10px 24px', borderRadius: 8, border: 'none' }}
          >
            ✅ Allow
          </button>
          <button
            onClick={() => respond(false)}
            disabled={loading}
            style={{ background: '#ef4444', color: 'white', padding: '10px 24px', borderRadius: 8, border: 'none' }}
          >
            ❌ Deny
          </button>
        </div>
      </div>
    </div>
  )
}
```

Mount this **at the root of the app** so it always listens, regardless of which page is open:

```tsx
// src/App.tsx
import RemoteAccessDialog from './components/RemoteAccessDialog'

// Inside your JSX:
return (
  <>
    <RemoteAccessDialog />   {/* ← always mounted */}
    <Routes>
      {/* ... */}
    </Routes>
  </>
)
```

#### Native OS notification (optional but recommended)

If the Tauri window is minimised, the employee will miss the dialog. Use Tauri's notification plugin to also send an OS-level alert:

```typescript
import { sendNotification } from '@tauri-apps/plugin-notification'

const handleRequest = useCallback((data: SessionRequest) => {
  setRequest(data)    // show in-app dialog

  sendNotification({
    title: 'Remote Access Request',
    body: `IT Support wants to connect to ${data.deviceHostname}. Open the app to respond.`,
  })
}, [])
```

---

### 5.2 Technician side — requesting and connecting

#### `src/pages/technician/RemoteSessionPanel.tsx`

```tsx
import { useState, useCallback } from 'react'
import { open } from '@tauri-apps/plugin-shell'    // opens rustdesk:// deep link
import { useSocket } from '../../hooks/useSocket'
import api from '../../api/client'

interface Props {
  ticketId: string
  deviceId: string
}

type SessionState =
  | 'idle'
  | 'requesting'
  | 'waiting'    // waiting for employee to approve
  | 'approved'
  | 'active'
  | 'denied'
  | 'ended'

export default function RemoteSessionPanel({ ticketId, deviceId }: Props) {
  const [state, setState] = useState<SessionState>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [rustdeskLink, setRustdeskLink] = useState<string | null>(null)

  // Employee approved → backend emits session:approved to technician
  const onApproved = useCallback((data: { sessionId: string; rustdeskLink: string }) => {
    if (data.sessionId !== sessionId) return    // not our session
    setRustdeskLink(data.rustdeskLink)
    setState('approved')
  }, [sessionId])

  // Employee denied
  const onDenied = useCallback((data: { sessionId: string }) => {
    if (data.sessionId !== sessionId) return
    setState('denied')
  }, [sessionId])

  // Session ended
  const onEnded = useCallback((data: { sessionId: string }) => {
    if (data.sessionId !== sessionId) return
    setState('ended')
  }, [sessionId])

  useSocket('session:approved', onApproved)
  useSocket('session:denied', onDenied)
  useSocket('session:ended', onEnded)

  // Step 1 — Technician clicks Request
  const requestAccess = async () => {
    setState('requesting')
    try {
      const { data } = await api.post('/remote-sessions', { ticketId, deviceId })
      setSessionId(data.id)
      setState('waiting')
    } catch (err) {
      setState('idle')
      alert('Failed to create session request')
    }
  }

  // Step 2 — Technician opens RustDesk and marks session active
  const connectNow = async () => {
    if (!rustdeskLink || !sessionId) return

    // Open the RustDesk deep link in the OS default handler
    // This launches RustDesk and connects to the employee's PC
    await open(rustdeskLink)

    // Mark session as active in the backend
    await api.post(`/remote-sessions/${sessionId}/start`)
    setState('active')
  }

  // Step 3 — End session
  const endSession = async () => {
    if (!sessionId) return
    await api.post(`/remote-sessions/${sessionId}/end`)
    setState('ended')
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginTop: 16 }}>
      <h3>Remote Support</h3>

      {state === 'idle' && (
        <button onClick={requestAccess} style={{ background: '#3b82f6', color: 'white', padding: '8px 20px', borderRadius: 6, border: 'none' }}>
          🖥️ Request Remote Access
        </button>
      )}

      {state === 'requesting' && <p>Creating session request…</p>}

      {state === 'waiting' && (
        <div style={{ background: '#fef3c7', padding: 12, borderRadius: 6 }}>
          <p>⏳ Waiting for employee to approve… (15-minute window)</p>
        </div>
      )}

      {state === 'approved' && (
        <div style={{ background: '#dcfce7', padding: 12, borderRadius: 6 }}>
          <p>✅ Employee approved! Click below to connect.</p>
          <button onClick={connectNow} style={{ background: '#16a34a', color: 'white', padding: '8px 20px', borderRadius: 6, border: 'none', marginTop: 8 }}>
            🔗 Connect via RustDesk
          </button>
        </div>
      )}

      {state === 'active' && (
        <div style={{ background: '#eff6ff', padding: 12, borderRadius: 6 }}>
          <p>🟢 Session active — screen sharing in progress</p>
          <button onClick={endSession} style={{ background: '#dc2626', color: 'white', padding: '8px 20px', borderRadius: 6, border: 'none', marginTop: 8 }}>
            Stop Session
          </button>
        </div>
      )}

      {state === 'denied' && (
        <div style={{ background: '#fee2e2', padding: 12, borderRadius: 6 }}>
          <p>❌ Employee denied access.</p>
          <button onClick={() => setState('idle')} style={{ marginTop: 8 }}>Try Again</button>
        </div>
      )}

      {state === 'ended' && (
        <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 6 }}>
          <p>⬛ Session ended.</p>
          <NotesSaver sessionId={sessionId!} />
        </div>
      )}
    </div>
  )
}

// After session ends, let technician write notes
function NotesSaver({ sessionId }: { sessionId: string }) {
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  const save = async () => {
    await api.patch(`/remote-sessions/${sessionId}/notes`, { notes })
    setSaved(true)
  }

  if (saved) return <p style={{ color: 'green', marginTop: 8 }}>✅ Notes saved</p>

  return (
    <div style={{ marginTop: 12 }}>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="What was done? What did you fix? Any follow-up needed?"
        style={{ width: '100%', minHeight: 80, padding: 8 }}
      />
      <button onClick={save} style={{ marginTop: 8 }}>Save Notes</button>
    </div>
  )
}
```

---

### 5.3 How the RustDesk deep link works

When the employee approves, the backend builds and returns a URL like:

```
rustdesk://rustdesk.yourcompany.com/123456789?key=rG7xxx...
```

Breaking it down:

| Part | Meaning |
|---|---|
| `rustdesk://` | Protocol — tells the OS to open RustDesk |
| `rustdesk.yourcompany.com` | Your self-hosted RustDesk rendezvous server |
| `123456789` | The employee's RustDesk peer ID (unique to their machine) |
| `?key=rG7xxx...` | Server's public key — RustDesk verifies this so no one can MITM |

When `open(rustdeskLink)` is called:
1. OS sees `rustdesk://` protocol
2. OS launches RustDesk (must be installed on the technician's machine)
3. RustDesk connects to `rustdesk.yourcompany.com` and asks for peer `123456789`
4. The employee's RustDesk (running in background) responds
5. Encrypted screen sharing connection is established

**RustDesk must be installed on both the technician's and employee's machines.**

---

## 6. Technician Ticket Queue

```tsx
// src/pages/technician/TicketQueue.tsx
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useSocket } from '../../hooks/useSocket'
import api from '../../api/client'

interface Ticket {
  id: string
  ticketNumber: number
  title: string
  status: string
  priority: string
  employee: { user: { firstName: string; lastName: string } }
}

export default function TicketQueue() {
  const [tickets, setTickets] = useState<Ticket[]>([])

  const load = useCallback(() => {
    api.get('/tickets').then(r => setTickets(r.data))
  }, [])

  useEffect(() => { load() }, [load])

  // Refresh ticket list when a new device comes online (may need attention)
  useSocket('device:online', load)

  const assign = async (ticketId: string) => {
    const techId = 'YOUR_TECHNICIAN_ID'    // from auth store
    await api.post(`/tickets/${ticketId}/assign`, { technicianId: techId })
    load()
  }

  const resolve = async (ticketId: string) => {
    await api.post(`/tickets/${ticketId}/resolve`)
    load()
  }

  const priorityColor: Record<string, string> = {
    LOW: '#86efac', MEDIUM: '#fde68a', HIGH: '#fca5a5', CRITICAL: '#f87171'
  }

  return (
    <div>
      <h1>Ticket Queue</h1>
      {tickets.map(t => (
        <div key={t.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>#{t.ticketNumber} — {t.title}</strong>
            <span style={{ background: priorityColor[t.priority], padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
              {t.priority}
            </span>
          </div>
          <p style={{ color: 'gray', margin: '4px 0' }}>
            {t.employee.user.firstName} {t.employee.user.lastName} · {t.status}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Link to={`/tickets/${t.id}`}>View</Link>
            {t.status === 'OPEN' && (
              <button onClick={() => assign(t.id)}>Take Ticket</button>
            )}
            {t.status === 'IN_PROGRESS' && (
              <button onClick={() => resolve(t.id)}>Mark Resolved</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## 7. Ticket Detail Page (shared by both roles)

The detail page shows comments and — for technicians — the remote session panel.

```tsx
// src/pages/TicketDetail.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import RemoteSessionPanel from './technician/RemoteSessionPanel'
import api from '../api/client'

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore(s => s.user)
  const [ticket, setTicket] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!id) return
    api.get(`/tickets/${id}`).then(r => setTicket(r.data))
    api.get(`/tickets/${id}/comments`).then(r => setComments(r.data))
  }, [id])

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post(`/tickets/${id}/comments`, { message })
    setMessage('')
    api.get(`/tickets/${id}/comments`).then(r => setComments(r.data))
  }

  if (!ticket) return <p>Loading…</p>

  return (
    <div>
      <h1>#{ticket.ticketNumber} — {ticket.title}</h1>
      <p>{ticket.description}</p>
      <p>Status: <strong>{ticket.status}</strong> · Priority: <strong>{ticket.priority}</strong></p>

      {/* Only technicians see the remote session panel */}
      {user?.role === 'TECHNICIAN' && ticket.device && (
        <RemoteSessionPanel ticketId={ticket.id} deviceId={ticket.device.id} />
      )}

      <hr />
      <h3>Comments</h3>
      {comments.map(c => (
        <div key={c.id} style={{ marginBottom: 12 }}>
          <strong>{c.user.firstName} {c.user.lastName}</strong>
          <span style={{ color: 'gray', marginLeft: 8, fontSize: 12 }}>
            {new Date(c.createdAt).toLocaleString()}
          </span>
          <p>{c.message}</p>
        </div>
      ))}

      <form onSubmit={addComment}>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Add a comment…"
          style={{ width: '100%', minHeight: 60, padding: 8 }}
        />
        <button type="submit" style={{ marginTop: 8 }}>Send</button>
      </form>
    </div>
  )
}
```

---

## 8. What Must Be Installed for Screen Sharing

This is a checklist for the IT admin before screen sharing can work:

### On the server

| Task | Command / detail |
|---|---|
| Run RustDesk server | `docker compose -f docker-compose.rustdesk.yml up -d` |
| Get the public key | `cat data/id_ed25519.pub` (generated on first run) |
| Set `RUSTDESK_HOST` in `.env` | The server's public IP or domain name |
| Set `RUSTDESK_PUBLIC_KEY` in `.env` | The content of `id_ed25519.pub` |
| Restart the NestJS backend | So it picks up the new env values |

### On every employee's machine

| Task | Detail |
|---|---|
| Install RustDesk | Download from rustdesk.com — configure it to use your server |
| Configure RustDesk server | Settings → Network → ID/Relay Server: your server IP |
| Install the IT Desk Tauri app | The app registers the device automatically on login |
| RustDesk must be running | It can run minimised in the system tray |

### On every technician's machine

| Task | Detail |
|---|---|
| Install RustDesk | Same as employee |
| Configure RustDesk server | Same server IP |
| Install the IT Desk Tauri app | For the ticket queue and session management |

---

## 9. WebSocket Events Summary

| Event | Who receives it | Payload | What to do |
|---|---|---|---|
| `session:requested` | Employee | `{ sessionId, deviceHostname, expiresAt }` | Show approve/deny dialog |
| `session:approved` | Technician | `{ sessionId, rustdeskId, rustdeskLink }` | Show "Connect" button |
| `session:denied` | Technician | `{ sessionId, deviceHostname }` | Show denied state |
| `session:started` | Both | `{ sessionId }` | Show "session active" indicator |
| `session:ended` | Both | `{ sessionId }` | Show session ended, prompt for notes |
| `device:online` | Everyone | `{ deviceId, hostname, employeeId }` | Update device list |
| `device:offline-sweep` | Everyone | `{ count }` | Update device statuses |
| `session:expired-sweep` | Everyone | `{ count }` | Clear pending request dialogs |

---

## 10. Common Mistakes to Avoid

| Mistake | Why it breaks | Fix |
|---|---|---|
| Not mounting `<RemoteAccessDialog />` at root | Employee misses the popup if on a different page | Mount it in `App.tsx` above the router |
| Forgetting to call `connectSocket()` after login | All WebSocket events are missed | Call it immediately after `login()` resolves |
| Calling `shell.openExternal()` (Electron API) | Tauri uses a different API | Use `open()` from `@tauri-apps/plugin-shell` |
| Not sending the heartbeat | Device goes OFFLINE after 5 min | Start a `setInterval` heartbeat on login |
| Stopping heartbeat on page navigate | Device goes OFFLINE | Store interval ref at module level, not in a component |
| Not filtering WS events by `sessionId` | Wrong session triggers UI changes | Always check `data.sessionId === currentSessionId` |
| Hardcoding `localhost:3000` | Breaks in production | Use an env variable: `import.meta.env.VITE_API_URL` |

---

## 11. Environment Variables

Create `.env` in the project root (Tauri reads these via Vite):

```
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000/ws
```

Update `client.ts` and `socket.ts` to use `import.meta.env.VITE_API_URL` etc.
