declare module 'canvas-confetti' {
    export interface ConfettiOptions {
      particleCount?: number;
      angle?: number;
      spread?: number;
      startVelocity?: number;
      decay?: number;
      gravity?: number;
      scalar?: number;
      origin?: { x?: number; y?: number };
      ticks?: number;
    }
    
    function confetti(options?: ConfettiOptions): void;
    export default confetti;
  }


