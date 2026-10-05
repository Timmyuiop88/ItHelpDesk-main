# IT Support Desk — Frontend Developer Guide

> **Stack:** NestJS REST API + Socket.IO WebSockets  
> **Base URL:** `http://localhost:3000/api/v1`  
> **WebSocket:** `http://localhost:3000/ws`  
> **Swagger UI:** `http://localhost:3000/api/docs`

---

## 1. Authentication

### Login
All requests (except login) require a Bearer token.

```
POST /auth/login
```

Employees and technicians **must send the machine they're logging in from**. Login is refused if that machine is linked to another user. Admins may omit `device` (Swagger / web).

| Response | `code` | Show the user |
|---|---|---|
| `200` | — | Logged in; `device` in the response is this machine (use `device.id` for heartbeats) |
| `400` | `DEVICE_REQUIRED` | App bug: `device` wasn't sent |
| `401` | — | "Wrong email or password" |
| `409` | `DEVICE_LINKED_TO_ANOTHER_USER` | "This computer belongs to another user. They or IT must unlink it first." |
| `403` | `DEVICE_LIMIT_REACHED` | "You've reached your device limit. Unlink an old device first." |

```json
// Request
{
  "email": "john@company.com",
  "password": "password123",
  "device": {
    "fingerprint": "AE092875-D326-500A-BBC5-5F864DC0F775",
    "hostname": "FIN-LAP-0234",
    "operatingSystem": "macOS 15",
    "rustdeskId": "61200350",
    "agentVersion": "0.1.0"
  }
}

// Response
{
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "email": "john@company.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "EMPLOYEE"
  },
  "device": { "id": "uuid", "hostname": "FIN-LAP-0234", "ownerId": "uuid", ... }
}
```

Login already registers the device, so you don't need a separate `POST /devices/register` call afterwards. Keep using that endpoint only to update details while logged in, for example when the RustDesk ID changes.

Store `accessToken` and attach it to every subsequent request:

```
Authorization: Bearer eyJhbGci...
```

### Get current user
```
GET /auth/me
```
Returns the logged-in user object. Use this on app startup to restore session.

---

## 2. User Roles & Permissions

Industry-standard RBAC — the backend enforces all of this server-side.

| Action | Admin | Technician | Employee |
|---|:---:|:---:|:---:|
| **Auth** | | | |
| Login | ✅ | ✅ | ✅ |
| View own profile (`/auth/me`) | ✅ | ✅ | ✅ |
| **Users** | | | |
| Create / update / delete users | ✅ | ❌ | ❌ |
| List all users | ✅ | ❌ | ❌ |
| **Employees** | | | |
| List all employees | ✅ | ✅ | ❌ |
| View own employee profile (`/employees/me`) | ✅ | ✅ | ✅ |
| Create employee (single-step) | ✅ | ❌ | ❌ |
| Update employee | ✅ | ❌ | ❌ |
| **Technicians** | | | |
| List / view technicians | ✅ | ✅ | ❌ |
| Create / update technician | ✅ | ❌ | ❌ |
| **Devices** | | | |
| List devices | ✅ all | ✅ own + on active assigned tickets | ✅ own only |
| View device | ✅ any | ✅ own + on active assigned tickets | ✅ own only |
| Register device (agent) | ✅ | ✅ own | ✅ own |
| Unlink device | ✅ any | ✅ own | ✅ own |
| Heartbeat | ✅ | ✅ own | ✅ own |
| Update device | ✅ | ✅ visible devices only | ❌ |
| Delete device | ✅ | ❌ | ❌ |
| **Tickets** | | | |
| Create ticket | ✅ (any employee) | ❌ | ✅ (own) |
| View tickets | ✅ all | ✅ assigned + OPEN | ✅ own only |
| Update status / priority | ✅ | ✅ | ❌ |
| Assign technician | ✅ | ✅ | ❌ |
| Resolve ticket | ✅ | ✅ | ❌ |
| Close ticket | ✅ | ✅ | ✅ own only |
| Add comment | ✅ | ✅ | ✅ own or participant |
| Transfer ticket | ✅ | ✅ if assigned | ❌ |
| Add / remove participants | ✅ | ✅ if assigned | ❌ (can leave) |
| **Departments** | | | |
| List departments | ✅ | ✅ | ✅ |
| Create / update / delete | ✅ | ❌ | ❌ |
| **Remote Sessions** | | | |
| Request session | ❌ | ✅ ticket assigned to them, any device of the ticket creator | ❌ |
| List ticket creator's devices (`GET /tickets/:id/devices`) | ✅ | ✅ ticket assigned to them (active) | ❌ |
| Approve / deny session | ✅ | ✅ own devices | ✅ own devices |
| Start / end session | ✅ | ✅ own sessions | ❌ |
| View sessions | ✅ all | ✅ own sessions | ✅ on own devices |
| Add notes | ✅ | ✅ own sessions | ❌ |
| View timeline | ✅ | ✅ own sessions | ❌ |
| **Audit Logs** | | | |
| View audit logs | ✅ | ❌ | ❌ |

---

## 3. Core Flows

### 3.1 Admin creates a new employee (single step)

One call, one transaction — user account + employee profile created atomically.

```
POST /employees
Authorization: Bearer <admin JWT>

body: {
  "email": "john@company.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Smith",
  "employeeNumber": "EMP-00124",
  "department": "Finance",
  "jobTitle": "Accountant"
}
```

Response includes the full employee profile with embedded user object. John can now log in immediately.

Same pattern for technicians:

```
POST /technicians
Authorization: Bearer <admin JWT>

body: {
  "email": "sarah@company.com",
  "password": "SecurePass123",
  "firstName": "Sarah",
  "lastName": "Jones",
  "employeeNumber": "TECH-0042",
  "department": "IT Support"
}
```

> **No more two-step creation.** Both endpoints create the user account + profile in a single database transaction. If either part fails, nothing is saved.

---

### 3.2 Device Registration (desktop app, after every login)

Employees **and technicians** register the machine they log in on. The `fingerprint` identifies the physical machine and links it to the logged-in user:

```
POST /devices/register
Authorization: Bearer <employee or technician JWT>

body: {
  "fingerprint": "AE092875-D326-500A-BBC5-5F864DC0F775",  ← stable machine ID
  "hostname": "FIN-LAP-0234",
  "serialNumber": "ABC123",
  "operatingSystem": "Windows 11",
  "rustdeskId": "123456789",
  "agentVersion": "0.1.0"
}
```

Use a stable OS identifier for `fingerprint` (macOS `IOPlatformUUID`, Windows `MachineGuid`, Linux `/etc/machine-id`). If it's omitted, `serialNumber` is used instead; one of the two is required.

| Response | Meaning | What the app should show |
|---|---|---|
| `201` | Device linked to you (first time, or already yours) | Continue normally |
| `409` | Device is linked to **another user** | "This computer belongs to someone else. Ask them or IT to unlink it." |
| `403` | You've hit `MAX_DEVICES_PER_USER` (default 5) | "Device limit reached. Unlink an old device first." |

**Unlinking** frees the device so someone else can register it. Only the owner or an admin can do it:
```
POST /devices/:id/unlink
```
Any pending remote-access requests for that device are expired, and the previous owner gets a `device:unlinked` WebSocket event.

**Own devices** (any role): `GET /devices/me`

**Who sees which devices (`GET /devices`, `GET /devices/:id`)**: an admin sees every device. A technician sees their own devices plus **all devices of anyone who created a ticket currently assigned to them**, as long as that ticket isn't `RESOLVED` or `CLOSED`. A device doesn't need to be attached to the ticket, and access ends once their last active ticket for that person is resolved. An employee sees only their own devices. Anything outside that scope returns `404`.

Every device has an `access` field so the UI can group or badge it:

| `access` | Meaning |
|---|---|
| `OWNED` | Linked to the current user |
| `ASSIGNED_TICKET` | Technician only: the device belongs to the creator of a ticket you're working on. `tickets` lists your active tickets from that person: `[{ id, ticketNumber, title, status }]` |
| `ADMIN` | Admin only: someone else's device, visible through the company-wide view |

For example, a technician's device page can show "My devices" (`OWNED`) and "Devices on my tickets" (`ASSIGNED_TICKET`). Each ticket-linked device can show "Ticket #9".

> Device responses now include `owner` (`{ id, firstName, lastName, email, role }`) and `ownerId` instead of `employee` / `employeeId`. `ownerId` is `null` while a device is unlinked.

**Heartbeat** — send every 30 seconds to keep status green:
```
POST /devices/:id/heartbeat
```

If no heartbeat arrives for 5 minutes, the backend automatically sets status to `OFFLINE` and broadcasts `device:offline-sweep` over WebSocket.

---

### 3.3 Ticket Lifecycle

```
OPEN → IN_PROGRESS → WAITING_FOR_EMPLOYEE → RESOLVED → CLOSED
```

**Employee creates a ticket:**
```
POST /tickets
Authorization: Bearer <employee JWT>

body: {
  "title": "Outlook keeps crashing",
  "description": "Closes every time I try to send an email.",
  "priority": "MEDIUM",
  "deviceId": "device-uuid"   ← optional
}
```

**Technician sees open tickets:**
```
GET /tickets
```
Returns assigned tickets + all OPEN tickets (role-filtered automatically).

**Technician assigns ticket to themselves:**
```
POST /tickets/:id/assign
body: { "technicianId": "tech-uuid" }
→ status becomes IN_PROGRESS
```

**Add a comment:**
```
POST /tickets/:id/comments
body: { "message": "Investigating the Outlook installation." }
```

**Resolve / Close:**
```
POST /tickets/:id/resolve   → status: RESOLVED
POST /tickets/:id/close     → status: CLOSED
```

---

### 3.3a Transferring a ticket & adding people to the conversation

Only the **assigned technician** or an **admin** can do these.

**Transfer to another technician** (writes a "Transferred this ticket to …" comment into the chat):
```
POST /tickets/:id/transfer
body: { "technicianId": "tech-uuid", "note": "Needs the network team" }
```
`POST /tickets/:id/assign` is now only for picking up an unassigned ticket. A technician can't re-assign a ticket that belongs to someone else (`403`).

**Add someone from any department** to the conversation:
```
GET  /employees?departmentId=<uuid>        ← pick a person (also /technicians?departmentId=)
POST /tickets/:id/participants   body: { "userId": "user-uuid" }
GET  /tickets/:id/participants
DELETE /tickets/:id/participants/:userId   ← remove someone, or leave yourself
```
Participants can view the ticket and comment on it. They can't close it. Their tickets show up in their own `GET /tickets`.

---

### 3.3b Departments (Admin)

```
GET    /departments            ← any role; includes _count of employees/technicians
POST   /departments            body: { "name": "Finance", "description": "..." }
PATCH  /departments/:id
DELETE /departments/:id        ← 409 while it still has members
```
When creating or updating employees and technicians, send `departmentId` instead of the old `department` string. `jobTitle` is still free text. Responses include `department: { id, name }`.

---

### 3.4 Remote Session Lifecycle

This is the most event-driven flow. Use WebSocket alongside the REST calls.

```
REQUESTED → APPROVED → ACTIVE → ENDED
               ↓
            DENIED
```

**Step 0 — Technician picks which device to connect to:**

The ticket creator may own several machines, so the technician chooses one. This lists **every device of the person who created the ticket**. It works only for the technician assigned to the ticket (while it's active) and for admins.
```
GET /tickets/:id/devices
```
```json
{
  "ticketId": "uuid",
  "creator": { "id": "uuid", "firstName": "John", "lastName": "Smith" },
  "devices": [
    { "id": "uuid", "hostname": "FIN-LAP-0234", "operatingSystem": "macOS 15", "status": "ONLINE",
      "lastSeenAt": "2026-10-05T11:50:00Z", "attachedToTicket": true,  "remoteReady": true },
    { "id": "uuid", "hostname": "FIN-DESK-0012", "operatingSystem": "Windows 11", "status": "OFFLINE",
      "lastSeenAt": "2026-10-04T16:20:00Z", "attachedToTicket": false, "remoteReady": false }
  ]
}
```
- `attachedToTicket`: the device the employee picked when creating the ticket. Pre-select it in the UI.
- `remoteReady`: `false` when the device has no RustDesk ID yet. Show it greyed out, because a request for it is refused.
- `status`: show `ONLINE` / `OFFLINE`, since an offline machine can't answer the request.
- Errors: `404` if the ticket isn't assigned to you; `400` once it's `RESOLVED` or `CLOSED`.

This works even when the ticket has no device attached.

**Step 1 — Technician requests remote access:**
```
POST /remote-sessions
Authorization: Bearer <technician JWT>

body: {
  "ticketId": "ticket-uuid",
  "deviceId": "device-uuid"      ← any device from the Step 0 list
}
```
| Response | `code` | Meaning |
|---|---|---|
| `201` | — | Session created with status `REQUESTED` |
| `403` | — | Ticket isn't assigned to you |
| `400` | — | Ticket no longer active, or the device isn't the ticket creator's |
| `400` | `DEVICE_NOT_REMOTE_READY` | Device has no RustDesk ID yet |

→ **WebSocket event `session:requested`** is emitted to the device's owner, who approves or denies

---

**Step 2 — Employee receives the notification (WebSocket):**
```js
socket.on('session:requested', (data) => {
  // data = { sessionId, deviceHostname, expiresAt }
  // Show approve/deny dialog
})
```

Employee approves via REST:
```
POST /remote-sessions/:id/approve
Authorization: Bearer <employee JWT>
```

Response includes the RustDesk deep link:
```json
{
  "status": "APPROVED",
  "rustdeskLink": "rustdesk://127.0.0.1/123456789?key=rG7xxx...",
  ...
}
```

→ **WebSocket event `session:approved`** is emitted to the technician with the `rustdeskLink`

---

**Step 3 — Technician launches RustDesk:**
```js
socket.on('session:approved', (data) => {
  // data = { sessionId, rustdeskId, rustdeskLink }

  // In Electron:
  shell.openExternal(data.rustdeskLink)

  // Then mark session as started:
  await fetch(`/api/v1/remote-sessions/${data.sessionId}/start`, { method: 'POST' })
})
```

---

**Step 4 — Session ends:**
```
POST /remote-sessions/:id/end
```
→ **WebSocket event `session:ended`** broadcast to both parties

**Step 5 — Technician adds notes (optional):**
```
PATCH /remote-sessions/:id/notes
body: { "notes": "Reinstalled Office 365. Reboot required." }
```

**View full timeline:**
```
GET /remote-sessions/:id/timeline
```
Returns ordered list of every action taken on that session with timestamps and actors.

---

## 4. WebSocket Reference

### Connecting
```js
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000/ws', {
  auth: { token: localStorage.getItem('accessToken') }
})

socket.on('connect', () => console.log('WS connected'))
socket.on('connect_error', (err) => console.error('WS auth failed', err))
```

### Events to listen for

| Event | Emitted to | Payload |
|---|---|---|
| `session:requested` | Employee | `{ sessionId, deviceHostname, expiresAt }` |
| `session:approved` | Technician | `{ sessionId, rustdeskId, rustdeskLink }` |
| `session:denied` | Technician | `{ sessionId, deviceHostname }` |
| `session:started` | Everyone | `{ sessionId }` |
| `session:ended` | Everyone | `{ sessionId }` |
| `device:online` | Everyone | `{ deviceId, hostname, ownerId }` |
| `device:unlinked` | Previous owner | `{ deviceId, hostname }` |
| `ticket:comment` | Everyone on the ticket except the author | `{ ticketId, ticketNumber, comment }` |
| `ticket:assigned` | Newly assigned technician | `{ ticketId, ticketNumber, title }` |
| `ticket:transferred` | Owner, old + new technician, participants | `{ ticketId, ticketNumber, title, toTechnicianId, toTechnicianName, note }` |
| `ticket:participant-added` | The added user | `{ ticketId, ticketNumber, title, addedById }` |
| `ticket:participant-removed` | The removed user | `{ ticketId, ticketNumber, title }` |
| `device:offline-sweep` | Everyone | `{ count }` |
| `session:expired-sweep` | Everyone | `{ count }` |

### Health check
```js
socket.emit('ping')
socket.on('pong', ({ ts }) => console.log('latency', Date.now() - ts, 'ms'))
```

---

## 5. API Quick Reference

### Auth
| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Get JWT token |
| GET | `/auth/me` | Any | Current user |

### Users
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/users` | Admin | List all users |
| POST | `/users` | Admin | Create user |
| PATCH | `/users/:id` | Admin | Update user |
| DELETE | `/users/:id` | Admin | Delete user |

### Employees
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/employees` | Admin, Tech | List employees |
| POST | `/employees` | Admin | Create employee profile |
| PATCH | `/employees/:id` | Admin | Update |

### Technicians
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/technicians` | Admin, Tech | List technicians |
| POST | `/technicians` | Admin | Create technician profile |
| PATCH | `/technicians/:id` | Admin | Update |

### Devices
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/devices` | All | List devices |
| POST | `/devices/register` | Employee | Agent self-registration |
| POST | `/devices/:id/heartbeat` | All | Keep device ONLINE |
| PATCH | `/devices/:id` | Admin, Tech | Update device |
| DELETE | `/devices/:id` | Admin | Remove device |

### Tickets
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/tickets` | All | List (role-filtered) |
| POST | `/tickets` | Employee | Create ticket |
| PATCH | `/tickets/:id` | Admin, Tech | Update status/priority |
| POST | `/tickets/:id/assign` | Admin, Tech | Assign technician |
| POST | `/tickets/:id/resolve` | Admin, Tech | Mark resolved |
| POST | `/tickets/:id/close` | All | Close ticket |
| GET | `/tickets/:id/devices` | Admin, assigned Tech | Ticket creator's devices (remote-session picker) |
| GET | `/tickets/:id/comments` | All | Get comments |
| POST | `/tickets/:id/comments` | All | Add comment |

### Remote Sessions
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/remote-sessions` | Admin, Tech | List all sessions |
| POST | `/remote-sessions` | Tech | Request session |
| POST | `/remote-sessions/:id/approve` | Employee, Admin | Approve + get deep link |
| POST | `/remote-sessions/:id/deny` | Employee, Admin | Deny |
| POST | `/remote-sessions/:id/start` | Tech, Admin | Mark active |
| POST | `/remote-sessions/:id/end` | Tech, Admin | End session |
| PATCH | `/remote-sessions/:id/notes` | Tech, Admin | Add session notes |
| GET | `/remote-sessions/:id/timeline` | Admin, Tech | Full audit timeline |

### Audit
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/audit-logs` | Admin | Last 200 system events |

---

## 6. Error Responses

All errors follow this shape:

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

| Status | Meaning |
|---|---|
| `400` | Validation failed — check the `message` array for field errors |
| `401` | Missing or expired JWT token |
| `403` | Authenticated but not allowed (wrong role) |
| `404` | Resource not found |
| `409` | Conflict — e.g. email already in use |

---

## 7. Recommended Electron Setup

```
src/
├── main/
│   └── index.ts          ← Node process — make http calls here OR
├── preload/
│   └── index.ts          ← expose safe API to renderer
└── renderer/
    ├── api/
    │   ├── client.ts      ← axios instance with baseURL + auth header
    │   └── socket.ts      ← socket.io singleton
    ├── stores/
    │   └── auth.store.ts  ← save token, current user
    └── pages/
        ├── Login.tsx
        ├── Tickets.tsx
        ├── Devices.tsx
        └── RemoteSession.tsx
```

**`api/client.ts` skeleton:**
```ts
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3000/api/v1' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
```

**`api/socket.ts` skeleton:**
```ts
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function connectSocket(token: string) {
  socket = io('http://localhost:3000/ws', { auth: { token } })
  return socket
}

export function getSocket() { return socket }
```
