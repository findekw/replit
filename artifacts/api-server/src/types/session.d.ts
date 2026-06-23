// Identity is no longer stored in a single express-session cookie.
// Each access level uses its own signed cookie (finde_admin / finde_office /
// finde_user) read via cookie-parser. See src/lib/session.ts.
export {};
