# FChat (MERN + Socket.IO)

A WhatsApp-style real-time chat app built with:
- **MongoDB + Mongoose**
- **Express + Node.js**
- **React (Vite) + Tailwind CSS**
- **Socket.IO**

Project structure:

```
server/  # REST API + Socket.IO
client/  # React + Tailwind UI
```

## Features

- **Auth**: Register/Login with **JWT** + **bcrypt** password hashing
- **Dashboard**: Users list + Group list + Online/offline presence
- **1:1 Chat**: Real-time messages (text + attachments)
- **Group Chat**: Create group (admin is creator), add/remove members, rename group
- **Typing indicator**: Real-time typing events
- **Uploads**: Local file storage via `server/uploads` (dev)

## Database Schema (Mongoose)

### `User`
- `name` (string, required)
- `email` (string, required, unique)
- `password` (hashed)
- `avatar` (string)
- `isOnline` (boolean)
- `lastSeenAt` (date)

### `Chat`
- `chatName` (string)
- `isGroupChat` (boolean)
- `users` (ObjectId[] -> User)
- `groupAdmin` (ObjectId -> User, group only)
- `latestMessage` (ObjectId -> Message)

### `Message`
- `sender` (ObjectId -> User)
- `chat` (ObjectId -> Chat)
- `content` (string)
- `attachments[]`:
  - `url`
  - `originalName`
  - `mimeType`
  - `size`

## REST API

Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/register` { name, email, password, avatar? }
- `POST /auth/login` { email, password }
- `GET /auth/me` (Bearer token)

### Users
- `GET /users` (Bearer token)

### Chats
- `POST /chats` { userId } (creates/returns 1:1 chat)
- `GET /chats` (fetch all my chats)
- `POST /chats/group` { name, users: [userId, ...] }
- `PUT /chats/group/rename` { chatId, name }
- `PUT /chats/group/add` { chatId, userId }
- `PUT /chats/group/remove` { chatId, userId }

### Messages
- `GET /messages/:chatId` (only chat members)
- `POST /messages` { chatId, content?, attachments? } (only chat members)

### Uploads
- `POST /uploads` (multipart/form-data field: `file`)
  - returns `{ file: { url, originalName, mimeType, size } }`
- Public files served from: `GET /uploads/<filename>`

## Socket.IO event flow

Server URL: `http://localhost:5000`

### Auth
Client connects with:
- `io(SOCKET_URL, { auth: { token } })`

### Presence
- Server broadcasts: `presence:update` { userId, isOnline, lastSeenAt }

### Rooms
- Client -> server: `chat:join` { chatId }
- Client -> server: `chat:leave` { chatId }

### Messaging
- Server broadcasts to room: `message:new` { message }

### Typing
- Client -> server: `typing:start` { chatId }
- Client -> server: `typing:stop` { chatId }
- Server broadcasts to room: `typing:update` { chatId, userId, isTyping }

## Running locally

### 1) Backend

1. Create `server/.env` (already scaffolded) and set:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fchat
JWT_SECRET=replace_me_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
```

2. Install and start:

```
cd server
npm install
npm run dev
```

### 2) Frontend

1. Create `client/.env` (already scaffolded):

```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

2. Install and start:

```
cd client
npm install
npm run dev
```

Open: `http://localhost:5173`

## Deployment notes (basic)

- **Backend**: set environment variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`). Serve `uploads/` via a persistent volume or move to S3/Cloudinary.
- **Frontend**: set `VITE_API_URL` and `VITE_SOCKET_URL` to your deployed server.

## Notes

- If your IDE shows warnings like **"Unknown at rule @tailwind"**, that’s typically the editor’s CSS linter; Tailwind still works when built by PostCSS/Vite.
