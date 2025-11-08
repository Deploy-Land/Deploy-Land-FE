import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { useAudio } from "../lib/stores/useAudio";

export function AudioControls() {
  const { isMuted, volume, toggleMute, setVolume, startBackgroundMusic } = useAudio();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    // 볼륨 조절 시 배경음악 시작 (사용자 인터랙션으로 간주)
    startBackgroundMusic();
  };

  const handleMuteClick = () => {
    toggleMute();
    // 음소거 해제 시 배경음악 시작
    if (isMuted) {
      startBackgroundMusic();
    }
  };

  // 볼륨 레벨에 따른 색상 계산
  const getVolumeColor = (vol: number): string => {
    if (isMuted || vol === 0) {
      return "#ef4444"; // 빨간색 (음소거 또는 볼륨 0)
    } else if (vol < 0.3) {
      return "#f59e0b"; // 주황색 (낮은 볼륨)
    } else if (vol < 0.7) {
      return "#eab308"; // 노란색 (중간 볼륨)
    } else {
      return "#22c55e"; // 초록색 (높은 볼륨)
    }
  };

  // 외부 클릭 시 슬라이더 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false);
      }
    };

    if (showVolumeSlider) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showVolumeSlider]);

  const volumeColor = getVolumeColor(volume);
  const displayVolume = isMuted ? 0 : volume;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 20,
        right: 140, // 홈으로 버튼 옆에 배치
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}
      onMouseEnter={() => setShowVolumeSlider(true)}
      onMouseLeave={() => setShowVolumeSlider(false)}
    >
      {/* 볼륨 슬라이더 */}
      {showVolumeSlider && (
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: "16px 12px",
            borderRadius: "8px",
            minHeight: "200px",
            width: "80px",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          {/* 슬라이더 (세로 방향) - 색상 표시 포함 */}
          <div 
            style={{ 
              height: "140px", 
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              position: "relative",
            }}
          >
            {/* 볼륨 레벨 색상 표시 바 */}
            <div
              style={{
                width: "8px",
                height: "120px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "4px",
                position: "relative",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${displayVolume * 100}%`,
                  backgroundColor: volumeColor,
                  borderRadius: "4px",
                  position: "absolute",
                  bottom: 0,
                  transition: "all 0.2s ease",
                  boxShadow: `0 0 12px ${volumeColor}60`,
                }}
              />
            </div>
            
            {/* 슬라이더 컨트롤 */}
            <div style={{ height: "120px", display: "flex", justifyContent: "center", flex: 1 }}>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                min={0}
                step={0.01}
                orientation="vertical"
                className="h-full"
              />
            </div>
          </div>

          {/* 볼륨 퍼센트 표시 */}
          <div
            style={{
              fontSize: "12px",
              color: "white",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            {Math.round(displayVolume * 100)}%
          </div>
        </div>
      )}

      {/* 음소거/볼륨 버튼 */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleMuteClick}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          color: isMuted ? volumeColor : "white",
          borderColor: isMuted ? volumeColor : "rgba(255, 255, 255, 0.2)",
          width: "40px",
          height: "40px",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        {isMuted ? (
          <VolumeX size={20} style={{ color: volumeColor }} />
        ) : (
          <Volume2 size={20} />
        )}
      </Button>
    </div>
  );
}

