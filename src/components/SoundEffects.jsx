// Audio context singleton
let audioContext;

const SoundEffects = () => {
  // Initialize audio context on first interaction
  const initAudioContext = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  };

  // Create audio context for sound effects
  const playSound = (frequency, duration = 200, type = 'sine') => {
    try {
      const ctx = initAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (error) {
      console.log('Audio error:', error);
    }
  };

  // Return stable function references
  return {
    playClickSound: () => playSound(440.00, 100, 'sine'),
    playAddSound: () => playSound(523.25, 300, 'sine'),
    playCompleteSound: () => playSound(659.25, 400, 'triangle'),
    playDeleteSound: () => playSound(392.00, 200, 'sawtooth'),
    playEditSound: () => playSound(440.00, 150, 'square'),
    playHoverSound: () => playSound(880.00, 100, 'sine')
  };
};

export default SoundEffects;

