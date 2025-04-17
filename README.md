```markdown
# SSO (Single Sign-On) Server

This project implements a Single Sign-On (SSO) solution using OAuth 2.0 authorization code flow. It consists of:
- A **client application** built with Vite (React)
- A **server application** built with NestJS
- PostgreSQL database for data storage

## System Architecture

### Database Schema
The system uses three main tables in PostgreSQL:

1. **oauth_clients** - Stores registered OAuth clients
2. **oauth_codes** - Stores authorization codes for the OAuth flow
3. **user_sessions** - Stores active user sessions

### OAuth Flow
The system implements the standard OAuth 2.0 authorization code flow:
1. Client initiates authentication
2. User authenticates with SSO server
3. SSO server issues authorization code
4. Client exchanges code for tokens
5. Client accesses protected resources with tokens

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Server Setup (NestJS)
1. Navigate to the `server` folder
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=123456
   DB_NAME=sso_idp
   DB_SYNC=true

   # JWT
   JWT_SECRET=your_strong_secret_key
   JWT_EXPIRES_IN=1h
   ```
4. Run the server:
   ```bash
   npm run start:dev
   ```

### Client Setup (Vite)
1. Navigate to the `client` folder
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```
   VITE_API_URL=http://localhost:3000
   VITE_CLIENT_ID=SSO1
   VITE_REDIRECT_URI=http://localhost:5173/callback
   ```
4. Run the client:
   ```bash
   npm run dev
   ```

## Database Setup

Run these SQL commands to create the required tables:

```sql
CREATE TABLE oauth_clients (
    id SERIAL PRIMARY KEY,
    institute VARCHAR(255) NOT NULL,
    tenant VARCHAR(255) NULL,
    client_id VARCHAR(255) UNIQUE NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    redirect_uri TEXT NOT NULL,
    scopes TEXT NOT NULL DEFAULT 'openid profile email',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE oauth_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    institute VARCHAR(255) NOT NULL,
    tenant VARCHAR(255) NULL,
    user_id INT NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    redirect_uri TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    institute VARCHAR(255) NOT NULL,
    tenant VARCHAR(255) NULL,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Authorization Endpoints
- `GET /oauth/authorize` - Initiate OAuth flow
- `POST /oauth/token` - Exchange code for tokens
- `GET /oauth/userinfo` - Get user information

### Client Management Endpoints
- `POST /clients` - Register new OAuth client
- `GET /clients` - List registered clients

## Usage

1. Register your client application in the `oauth_clients` table
2. Configure your client application with:
   - Client ID
   - Redirect URI
   - SSO server API URL
3. Implement the OAuth flow in your client application

## Security Considerations

- Always use HTTPS in production
- Keep your JWT secret secure
- Validate all redirect URIs
- Implement proper token expiration and refresh mechanisms
- Regularly rotate secrets

## Troubleshooting

- Check server logs for errors
- Verify database connection settings
- Ensure all environment variables are set correctly
- Confirm client IDs and secrets match between client and server

## Accessing the Applications
- **Client**: http://localhost:5173
- **Server API**: http://localhost:3000
- **Database**: postgresql://postgres:123456@localhost:5432/sso_idp
```
