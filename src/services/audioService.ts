class AudioService {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private listeners: Set<(playing: boolean, muted: boolean) => void> = new Set();

  constructor() {
    // Lazy-init on client safely
    if (typeof window !== 'undefined') {
      try {
        this.audio = new Audio('/assets/kalyani-bg-music.mp3');
        this.audio.loop = false; // Plays once without looping back as requested
        this.audio.volume = 0.5;

        this.audio.addEventListener('ended', () => {
          this.isPlaying = false;
          this.notify();
        });
      } catch (err) {
        console.warn('Audio service initialization note:', err);
      }
    }
  }

  public async play(): Promise<boolean> {
    if (!this.audio) return false;
    try {
      this.audio.muted = false;
      this.isMuted = false;
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      this.isPlaying = true;
      this.notify();
      return true;
    } catch (err) {
      // Graceful fallback for mobile autoplay policy
      this.isPlaying = false;
      this.notify();
      return false;
    }
  }

  public pause(): void {
    if (!this.audio) return;
    try {
      this.audio.pause();
      this.isPlaying = false;
      this.notify();
    } catch {}
  }

  public toggle(): boolean {
    if (this.isPlaying && !this.isMuted) {
      this.pause();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  public toggleMute(): boolean {
    if (!this.audio) return false;
    try {
      this.isMuted = !this.isMuted;
      this.audio.muted = this.isMuted;
      this.notify();
      return this.isMuted;
    } catch {
      return false;
    }
  }

  public setVolume(vol: number): void {
    if (!this.audio) return;
    try {
      this.audio.volume = Math.max(0, Math.min(1, vol));
    } catch {}
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public subscribe(listener: (playing: boolean, muted: boolean) => void): () => void {
    this.listeners.add(listener);
    try {
      listener(this.isPlaying, this.isMuted);
    } catch {}
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn(this.isPlaying, this.isMuted);
      } catch {}
    });
  }
}

export const audioService = new AudioService();
