// Utilities for Spotify OAuth PKCE in SPA

// Prefer env, fallback to provided client id if not set
const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID || 'c5e18e349b6f40f9a36d3b0b742c40b9';
// Use env override if provided; otherwise include pathname (needed for GitHub Pages project sites)
const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}`;
const SCOPE = 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state';

function base64UrlEncode(uint8Array) {
  return btoa(String.fromCharCode.apply(null, [...uint8Array]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sha256(buffer) {
  const digest = await window.crypto.subtle.digest('SHA-256', buffer);
  return new Uint8Array(digest);
}

export async function createCodeVerifier() {
  const array = new Uint8Array(64);
  window.crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export async function createCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await sha256(data);
  return base64UrlEncode(digest);
}

export function getStoredToken() {
  const raw = localStorage.getItem('spotifyToken');
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (parsed.expires_at && Date.now() < parsed.expires_at) return parsed;
  return null;
}

export function storeToken(token) {
  const expiresAt = Date.now() + (token.expires_in - 60) * 1000;
  localStorage.setItem('spotifyToken', JSON.stringify({ ...token, expires_at: expiresAt }));
}

export async function beginLogin() {
  const verifier = await createCodeVerifier();
  const challenge = await createCodeChallenge(verifier);
  localStorage.setItem('spotify_verifier', verifier);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function completeLoginIfRedirected() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  if (!code) return null;
  const verifier = localStorage.getItem('spotify_verifier');
  if (!verifier) return null;
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const token = await res.json();
  if (token.access_token) {
    storeToken(token);
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return token;
  }
  return null;
}


