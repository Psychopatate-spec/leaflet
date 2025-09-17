// React import not required with the new JSX transform
import { useEffect, useMemo, useRef, useState } from 'react';
import SoundEffects from '../SoundEffects';

const secondsToMMSS = (s) => {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

const PomodoroWidget = () => {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isWork, setIsWork] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [remaining, setRemaining] = useState(workMinutes * 60);
  const intervalRef = useRef(null);
  const sounds = useMemo(() => SoundEffects(), []);

  useEffect(() => {
    setRemaining((isWork ? workMinutes : breakMinutes) * 60);
  }, [workMinutes, breakMinutes, isWork]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setIsWork((w) => !w);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const total = useMemo(() => (isWork ? workMinutes : breakMinutes) * 60, [isWork, workMinutes, breakMinutes]);
  const progress = total > 0 ? (total - remaining) / total : 0;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * progress;

  return (
    <div className="pomodoro-widget">
      <div className="pomodoro-canvas">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} stroke="#ddd" strokeWidth="12" fill="none" />
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke={isWork ? '#FF6B35' : '#4CAF50'}
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${dash} ${circumference}`}
            transform="rotate(-90 100 100)"
            strokeLinecap="round"
          />
          <text x="100" y="110" textAnchor="middle" fontSize="28" fill="currentColor">{secondsToMMSS(remaining)}</text>
        </svg>
      </div>
      <div className="pomodoro-controls">
        <div className="row">
          <button 
            type="button" 
            onClick={() => {
              sounds.playClickSound();
              setIsRunning((r) => !r);
            }}
            onMouseEnter={sounds.playHoverSound}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button 
            type="button" 
            onClick={() => { 
              sounds.playClickSound();
              setIsRunning(false); 
              setRemaining(total); 
            }}
            onMouseEnter={sounds.playHoverSound}
          >
            Reset
          </button>
          <button 
            type="button" 
            onClick={() => {
              sounds.playClickSound();
              setIsWork((w) => !w); 
            }}
            onMouseEnter={sounds.playHoverSound}
          >
            {isWork ? 'Switch to Break' : 'Switch to Work'}
          </button>
        </div>
        <div className="row">
          <label>
            Work (min)
            <input 
              type="number" 
              min="1" 
              max="180" 
              value={workMinutes} 
              onChange={(e) => {
                sounds.playEditSound();
                setWorkMinutes(parseInt(e.target.value || '0', 10));
              }}
              onMouseEnter={sounds.playHoverSound}
            />
          </label>
          <label>
            Break (min)
            <input 
              type="number" 
              min="1" 
              max="60" 
              value={breakMinutes} 
              onChange={(e) => {
                sounds.playEditSound();
                setBreakMinutes(parseInt(e.target.value || '0', 10));
              }}
              onMouseEnter={sounds.playHoverSound}
            />
          </label>
        </div>
        <div className="row"><span className="mode-badge">{isWork ? 'Work' : 'Break'}</span></div>
      </div>
    </div>
  );
};

export default PomodoroWidget;


