// React import not required with the new JSX transform
import { useEffect, useMemo, useRef, useState } from 'react';
import { beginLogin, completeLoginIfRedirected, getStoredToken } from './spotifyAuth';
import SoundEffects from '../SoundEffects';

const SpotifyWidget = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [deviceId, setDeviceId] = useState(null);
  const [playerStatus, setPlayerStatus] = useState('disconnected');
  const playerRef = useRef(null);
  const sounds = useMemo(() => SoundEffects(), []);

  useEffect(() => {
    (async () => {
      if (!token) {
        const t = await completeLoginIfRedirected();
        if (t) setToken(t);
      }
    })();
  }, [token]);

  const initializePlayer = useCallback(() => {
    if (!window.Spotify) return null;

    try {
      const player = new window.Spotify.Player({
        name: 'Leaflet Player',
        getOAuthToken: cb => cb(token.access_token),
        volume: 0.5,
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Spotify player ready with device ID:', device_id);
        setDeviceId(device_id);
        setPlayerStatus('ready');
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Spotify player not ready:', device_id);
        setPlayerStatus('not_ready');
      });

      player.addListener('initialization_error', ({ message }) => {
        console.error('Spotify player initialization error:', message);
        setPlayerStatus('error');
      });

      player.addListener('authentication_error', ({ message }) => {
        console.error('Spotify player authentication error:', message);
        setPlayerStatus('auth_error');
      });

      player.addListener('account_error', ({ message }) => {
        console.error('Spotify player account error:', message);
        setPlayerStatus('account_error');
      });

      player.addListener('playback_error', ({ message }) => {
        console.error('Spotify player playback error:', message);
        setPlayerStatus('playback_error');
      });

      player.connect();
      return player;
    } catch (error) {
      console.error('Error initializing Spotify player:', error);
      setPlayerStatus('error');
      return null;
    }
  }, [token?.access_token]);

  useEffect(() => {
    if (!token?.access_token) return;

    // Define the callback before loading the script
    window.onSpotifyWebPlaybackSDKReady = initializePlayer;
    
    // Check if script is already loaded
    if (window.Spotify) {
      const player = initializePlayer();
      playerRef.current = player;
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    script.onerror = () => {
      console.error('Failed to load Spotify Web Playback SDK');
      setPlayerStatus('error');
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Cleanup player
      if (playerRef.current) {
        playerRef.current.disconnect().catch(console.error);
        playerRef.current = null;
      }
      
      // Remove the script if it exists
      const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
      if (existingScript?.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
      
      // Clean up the global callback
      delete window.onSpotifyWebPlaybackSDKReady;
    };
  }, [token, initializePlayer]);

  const ensureAuth = () => {
    if (token?.access_token) return true;
    sounds.playClickSound();
    beginLogin();
    return false;
  };

  const search = async (e) => {
    e.preventDefault();
    sounds.playClickSound();
    if (!ensureAuth()) return;
    if (!query.trim()) {
      sounds.playEditSound();
      return;
    }
    
    try {
      const res = await fetch(`https://api.spotify.com/v1/search?type=track,album&limit=15&q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token.access_token}` }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.error('Spotify token expired, please login again');
          localStorage.removeItem('spotifyToken');
          setToken(null);
          return;
        }
        throw new Error(`Search failed: ${res.status} ${res.statusText}`);
      }
      
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
    } catch (error) {
      console.error('Error searching Spotify:', error);
    }
  };

  const play = async (item) => {
    sounds.playClickSound();
    if (!token?.access_token || !deviceId) {
      console.error('Cannot play: missing authentication or device ID');
      return;
    }
    sounds.playClickSound();
    
    setCurrent(item);
    const isAlbum = item.type === 'album';
    const body = isAlbum ? { context_uri: item.uri } : { uris: [item.uri] };
    
    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.access_token}` },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.error('Spotify token expired, please login again');
          localStorage.removeItem('spotifyToken');
          setToken(null);
          return;
        }
        if (res.status === 404) {
          console.error('No active device found. Please open Spotify on another device and try again.');
          return;
        }
        throw new Error(`Playback failed: ${res.status} ${res.statusText}`);
      }
      
      console.log(`Now playing: ${item.title} by ${item.artist}`);
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const getStatusMessage = () => {
    if (!token?.access_token) {
      return "Login with Spotify to play full tracks.";
    }
    
    switch (playerStatus) {
      case 'ready':
        return "🎵 Player ready - you can play music!";
      case 'not_ready':
        return "⏳ Player connecting...";
      case 'error':
        return "❌ Player initialization failed";
      case 'auth_error':
        return "🔐 Authentication error - please login again";
      case 'account_error':
        return "👤 Account error - check your Spotify account";
      case 'playback_error':
        return "🎵 Playback error - try again";
      default:
        return "🔄 Connecting to Spotify...";
    }
  };

  return (
    <div className="spotify-widget">
      <div className="spotify-status">
        {!token?.access_token ? (
          <div className="muted">
            {getStatusMessage()} 
            <button 
              type="button" 
              onClick={() => ensureAuth()}
              onMouseEnter={sounds.playHoverSound}
            >
              Login
            </button>
          </div>
        ) : (
          <div className={`status ${playerStatus}`}>
            {getStatusMessage()}
          </div>
        )}
      </div>
      <form 
        onSubmit={search} 
        className="spotify-search"
      >
        <input 
          type="text" 
          value={query} 
          onChange={(e) => {
            sounds.playEditSound();
            setQuery(e.target.value);
          }} 
          onClick={(e) => sounds.playClickSound()}
          placeholder="Search songs or albums"
          onMouseEnter={sounds.playHoverSound}
        />
        <button 
          type="submit"
          onMouseEnter={sounds.playHoverSound}
        >
          Search
        </button>
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
      <div className="spotify-results" onClick={(e) => e.target === e.currentTarget && sounds.playClickSound()}>
        {results.map(r => (
          <button 
            key={r.uri} 
            type="button" 
            className="spotify-result" 
            onClick={() => play(r)}
            onMouseEnter={sounds.playHoverSound}
          >
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


