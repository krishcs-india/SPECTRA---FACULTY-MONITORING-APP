class AudioService {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private listeners: Set<(playing: boolean, muted: boolean) => void> = new Set();

  constructor() {
    // Lazy-init on client
    if (typeof window !== 'undefined') {
      this.audio = new Audio('/assets/kalyani-bg-music.mp3');
      this.audio.loop = false; // Plays once without looping back as requested
      this.audio.volume = 0.5;

      this.audio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.notify();
      });
    }
  }

  public async play(): Promise<boolean> {
    if (!this.audio) return false;
    try {
      this.audio.muted = false;
      this.isMuted = false;
      await this.audio.play();
      this.isPlaying = true;
      this.notify();
      return true;
    } catch (err) {
      console.warn('Audio play prevented by browser autoplay policy:', err);
      this.isPlaying = false;
      this.notify();
      return false;
    }
  }

  public pause(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.isPlaying = false;
    this.notify();
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
    this.isMuted = !this.isMuted;
    this.audio.muted = this.isMuted;
    this.notify();
    return this.isMuted;
  }

  public setVolume(vol: number): void {
    if (!this.audio) return;
    this.audio.volume = Math.max(0, Math.min(1, vol));
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public subscribe(listener: (playing: boolean, muted: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isPlaying, this.isMuted);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.isPlaying, this.isMuted));
  }
}

export const audioService = new AudioService();
