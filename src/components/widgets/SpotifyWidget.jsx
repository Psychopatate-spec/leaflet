// React import not required with the new JSX transform
import { useEffect, useRef, useState } from 'react';
import { beginLogin, completeLoginIfRedirected, getStoredToken } from './spotifyAuth';

const SpotifyWidget = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [deviceId, setDeviceId] = useState(null);
  const playerRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!token) {
        const t = await completeLoginIfRedirected();
        if (t) setToken(t);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token?.access_token) return;
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Leaflet Player',
        getOAuthToken: cb => cb(token.access_token),
        volume: 0.5,
      });
      playerRef.current = player;
      player.addListener('ready', ({ device_id }) => setDeviceId(device_id));
      player.addListener('not_ready', () => {});
      player.connect();
    };
    return () => {
      try { playerRef.current && playerRef.current.disconnect(); } catch {}
      document.body.removeChild(script);
    };
  }, [token]);

  const ensureAuth = () => {
    if (token?.access_token) return true;
    beginLogin();
    return false;
  };

  const search = async (e) => {
    e.preventDefault();
    if (!ensureAuth()) return;
    if (!query.trim()) return;
    const res = await fetch(`https://api.spotify.com/v1/search?type=track,album&limit=15&q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    const data = await res.json();
    const tracks = (data.tracks?.items || []).map(t => ({
      id: t.id,
      uri: t.uri,
      title: t.name,
      artist: t.artists?.map(a => a.name).join(', '),
      artwork: t.album?.images?.[2]?.url || t.album?.images?.[0]?.url,
      type: 'track',
    }));
    const albums = (data.albums?.items || []).map(a => ({
      id: a.id,
      uri: a.uri,
      title: a.name,
      artist: a.artists?.map(x => x.name).join(', '),
      artwork: a.images?.[2]?.url || a.images?.[0]?.url,
      type: 'album',
    }));
    setResults([...tracks, ...albums]);
  };

  const play = async (item) => {
    if (!ensureAuth() || !deviceId) return;
    setCurrent(item);
    const isAlbum = item.type === 'album';
    const body = isAlbum ? { context_uri: item.uri } : { uris: [item.uri] };
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.access_token}` },
      body: JSON.stringify(body)
    });
  };

  return (
    <div className="spotify-widget">
      {!token?.access_token ? (
        <div className="muted">Login with Spotify to play full tracks. <button type="button" onClick={() => beginLogin()}>Login</button></div>
      ) : null}
      <form onSubmit={search} className="spotify-search">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search songs or albums" />
        <button type="submit">Search</button>
      </form>
      {current && (
        <div className="spotify-now-playing">
          <img alt="art" src={current.artwork} />
          <div className="meta">
            <div className="title">{current.title}</div>
            <div className="artist">{current.artist}</div>
          </div>
        </div>
      )}
      <div className="spotify-results">
        {results.map(r => (
          <button key={r.uri} type="button" className="spotify-result" onClick={() => play(r)}>
            <img alt="art" src={r.artwork} />
            <div className="meta">
              <div className="title">{r.title}</div>
              <div className="artist">{r.artist}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SpotifyWidget;


