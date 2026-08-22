import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Phoenix-MS dev server (Express + phoenix.sid session cookie). Override with
// PHOENIX_MS_URL when it runs somewhere other than the default port.
const PHOENIX_MS_URL = process.env.PHOENIX_MS_URL || 'http://localhost:5000'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honor an externally assigned port (dev tooling); falls back to Vite's default.
    ...(process.env.PORT ? { port: Number(process.env.PORT) } : {}),
    // Phone testing only. Face ID needs a secure context, so a phone must reach
    // the app over https (a tunnel) or as localhost (USB port forwarding) — a
    // LAN address like http://192.168.x.x will never prompt for it.
    // PHONE_TEST=1 opens the server to the network and lets a tunnel host past
    // Vite's host check. Leave it unset for normal work: while it is on, this
    // dev server — and through its proxy the dev CRM — is reachable by anything
    // that knows the address.
    ...(process.env.PHONE_TEST ? { host: true, allowedHosts: true as const } : {}),
    proxy: {
      // Only the paths the app has actually been wired to reach Phoenix-MS.
      // Anything not listed here still falls through to the SPA, so a path
      // added in code but forgotten here fails loudly (see http.ts) instead of
      // quietly serving index.html.
      //
      // changeOrigin must stay false: Phoenix-MS accepts a mutating request
      // only when the Origin header's host matches the Host header, so the
      // proxied request has to keep Host = the Vite origin.
      '/api/auth': {
        target: PHOENIX_MS_URL,
        changeOrigin: false,
      },
      // The family's own data: /api/me/student, /children, /lessons, /exams.
      '/api/me': {
        target: PHOENIX_MS_URL,
        changeOrigin: false,
      },
      // Avatars — served for any user id the portal is allowed to see.
      '/api/users': {
        target: PHOENIX_MS_URL,
        changeOrigin: false,
      },
      // Support-session booking: the student's own list, slots, weekly
      // allowance, and the create / reschedule / cancel calls.
      '/api/bookings': {
        target: PHOENIX_MS_URL,
        changeOrigin: false,
      },
      // The two hours the booking screen must obey (cutoff, auto-miss).
      '/api/school-settings': {
        target: PHOENIX_MS_URL,
        changeOrigin: false,
      },
    },
  },
})
