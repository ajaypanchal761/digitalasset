/**
 * Notification Sound Utility
 * Plays a simple beep sound when notifications appear
 */

/**
 * Play a notification sound using Web Audio API
 * Creates a simple beep tone
 */
export const playNotificationSound = () => {
  try {
    // Check if Web Audio API is supported
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.warn('Web Audio API not supported');
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    // Create oscillator for beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure beep sound (800Hz frequency, 0.2 seconds duration)
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    // Set volume envelope (fade in/out for smoother sound)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);

    // Clean up after sound finishes
    oscillator.onended = () => {
      audioContext.close();
    };
  } catch (error) {
    console.warn('Error playing notification sound:', error);
    // Silently fail - sound is optional
  }
};

