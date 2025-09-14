import React from 'react';

const SoundEffects = () => {
  // Create audio context for sound effects
  const playSound = (frequency, duration = 200, type = 'sine') => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      // Silently fail if audio context is not supported
      console.log('Audio not supported');
    }
  };

  // Sound effect functions
  const playAddSound = () => playSound(523.25, 300, 'sine'); // C5
  const playCompleteSound = () => playSound(659.25, 400, 'triangle'); // E5
  const playDeleteSound = () => playSound(392.00, 200, 'sawtooth'); // G4
  const playEditSound = () => playSound(440.00, 150, 'square'); // A4
  const playHoverSound = () => playSound(880.00, 100, 'sine'); // A5

  return {
    playAddSound,
    playCompleteSound,
    playDeleteSound,
    playEditSound,
    playHoverSound
  };
};

export default SoundEffects;

