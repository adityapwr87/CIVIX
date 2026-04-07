# CIVIX

CIVIX is a full-stack civic issue management platform where citizens can report local problems, admins can assign issues, workers can resolve them, and everyone can track updates in real time.

## Highlights

- Role-based system: user, admin, superadmin, worker
- Issue lifecycle: report -> assign -> in progress -> solved -> re-reported
- Location-aware issue reporting with map coordinates and address
- Real-time chat and message seen status via Socket.IO
- Real-time notifications for issue updates
- Image upload to AWS S3
- Department-aware assignment workflows

## Tech Stack

### Frontend

- React 19
- React Router
- Axios
- Leaflet / React Leaflet
- Socket.IO Client
- React Toastify

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Socket.IO
- AWS SDK (S3)
- Multer (file uploads)
- bcryptjs (password hashing)

## Project Structure

```text
CIVIX/
  backend/
    controllers/
    models/
    routes/
    middleware/
    utils/
    config/
    app.js
    server.js
  frontend/
    src/
      components/
      services/
      context/
      utils/
    public/
```

## Core Modules

- Auth: registration/login with role-specific validation
- Issues: create, list (state/district filters), details, comments, upvotes
- Admin: district issue dashboard, worker list, manual/auto assignment
- Worker: profile, assigned issues, status updates
- User profile: bio/profile image updates, re-report issue
- Messaging: chat history + direct message thread
- Notifications: unseen notifications and mark-as-read flow

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+
- MongoDB instance
- AWS S3 bucket and IAM credentials

## Environment Variables

Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/civix
JWT_SECRET=your_jwt_secret
frontendurl=http://localhost:3000

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Create a `.env` file inside `frontend/`:

```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

## Installation

From project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Run Locally

### 1) Start backend

```bash
cd backend
node server.js
```

Optional dev mode:

```bash
cd backend
npx nodemon server.js
```

### 2) Start frontend

```bash
cd frontend
npm start
```

Frontend: http://localhost:3000  
Backend: http://localhost:5000

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Issues

- `GET /api/issues/all?state=<state>&districtName=<district>` (returns latest 50)
- `GET /api/issues/:id`
- `POST /api/issues` (multipart)
- `POST /api/issues/:id/comments`
- `POST /api/issues/:id/upvote`

### Admin

- `GET /api/admin/district/issues`
- `GET /api/admin/district/workers`
- `POST /api/admin/issues/auto-assign`
- `POST /api/admin/issues/assign`

### Worker

- `GET /api/worker/profile`
- `GET /api/worker/profile/:workerId`
- `PATCH /api/worker/issues/:issueId/status`

### Users

- `GET /api/users/:userId`
- `POST /api/users/updateProfilePic`
- `PATCH /api/users/updateBio`
- `PATCH /api/users/reReport/:issueId`

### Chat and Notifications

- `GET /api/chat-history`
- `GET /api/messages/:user1/:user2`
- `GET /api/notifications/unseen`
- `DELETE /api/notifications/:id/read`

## Socket Events (Realtime)

- `join`
- `joinRoom`
- `send_message`
- `receive_message`
- `messages_seen`
- `messages_seen_by_receiver`
- `new_chat_message`
- `issue_assigned`
- `issue_status_changed`

## Current Behavior Notes

- `/api/issues/all` currently requires authentication in backend routing.
- Issue list endpoint supports optional `state` and `districtName` query filters and caps results to 50.
- Registration supports `user`, `admin`, `superadmin`, and `worker` roles.

## Scripts

### Frontend

- `npm start`
- `npm run build`
- `npm test`

### Backend

- No dedicated start script currently in `backend/package.json`.
- Use `node server.js` (or `npx nodemon server.js`) for local development.

## Suggested Next Improvements

- Add backend start/dev scripts in `backend/package.json`
- Add centralized validation middleware (Joi/Zod)
- Add pagination metadata to issue list endpoints
- Add automated tests and CI
- Add Docker setup for one-command local startup

## License

This project is currently unlicensed (uses ISC in backend package metadata). Add a root LICENSE file if you plan to distribute it.
