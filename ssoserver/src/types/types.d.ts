import session from 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: any; 
    authorizationRequest?: any;
  }
}

declare module 'express' {
  interface Request {
    session: session.Session & Partial<session.SessionData>;
  }
}

declare module 'express-session' {
  interface Session {
    pkce_verifier?: string;  
  }
}
