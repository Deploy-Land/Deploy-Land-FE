import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  isMuted: boolean;
  volume: number; // 0.0 to 1.0
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setVolume: (volume: number) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
}

export const useAudio = create<AudioState>()(
  persist(
    (set, get) => ({
      backgroundMusic: null,
      hitSound: null,
      successSound: null,
      isMuted: false, // Start unmuted
      volume: 0.5, // Default volume 50%
      
      setBackgroundMusic: (music) => {
        const { volume, isMuted } = get();
        music.volume = isMuted ? 0 : volume;
        music.loop = true;
        // 초기 재생 위치를 10초로 설정
        music.currentTime = 10;
        set({ backgroundMusic: music });
      },
      setHitSound: (sound) => set({ hitSound: sound }),
      setSuccessSound: (sound) => set({ successSound: sound }),
      
      setVolume: (volume) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ volume: clampedVolume });
        
        const { backgroundMusic, isMuted } = get();
        if (backgroundMusic) {
          backgroundMusic.volume = isMuted ? 0 : clampedVolume;
        }
        
        // Update hit and success sound volumes
        const { hitSound, successSound } = get();
        if (hitSound) {
          hitSound.volume = clampedVolume * 0.3; // Hit sound is 30% of master volume
        }
        if (successSound) {
          successSound.volume = clampedVolume;
        }
      },
      
      toggleMute: () => {
        const { isMuted, backgroundMusic, volume } = get();
        const newMutedState = !isMuted;
        
        set({ isMuted: newMutedState });
        
        // Update background music volume
        if (backgroundMusic) {
          backgroundMusic.volume = newMutedState ? 0 : volume;
        }
        
        console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
      },
      
      playHit: () => {
        const { hitSound, isMuted, volume } = get();
        if (hitSound) {
          if (isMuted) {
            console.log("Hit sound skipped (muted)");
            return;
          }
          
          const soundClone = hitSound.cloneNode() as HTMLAudioElement;
          soundClone.volume = volume * 0.3; // Hit sound is 30% of master volume
          soundClone.play().catch(error => {
            console.log("Hit sound play prevented:", error);
          });
        }
      },
      
      playSuccess: () => {
        const { successSound, isMuted, volume } = get();
        if (successSound) {
          if (isMuted) {
            console.log("Success sound skipped (muted)");
            return;
          }
          
          successSound.currentTime = 0;
          successSound.volume = volume;
          successSound.play().catch(error => {
            console.log("Success sound play prevented:", error);
          });
        }
      },
      
      startBackgroundMusic: () => {
        const { backgroundMusic, isMuted, volume } = get();
        if (backgroundMusic) {
          backgroundMusic.volume = isMuted ? 0 : volume;
          // 10초부터 재생
          backgroundMusic.currentTime = 10;
          backgroundMusic.play().catch(error => {
            console.log("Background music play prevented:", error);
          });
        }
      },
      
      stopBackgroundMusic: () => {
        const { backgroundMusic } = get();
        if (backgroundMusic) {
          backgroundMusic.pause();
          backgroundMusic.currentTime = 0;
          // 배경음악 정리
          backgroundMusic.src = "";
          set({ backgroundMusic: null });
        }
      },
    }),
    {
      name: "audio-settings",
      partialize: (state) => ({
        isMuted: state.isMuted,
        volume: state.volume,
      }),
    }
  )
);
