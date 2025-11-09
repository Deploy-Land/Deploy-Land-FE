import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";
import { useAudio } from "../lib/stores/useAudio";

export function AudioControls() {
  const { isMuted, volume, toggleMute, setVolume, startBackgroundMusic } = useAudio();
  const [showVolumeControls, setShowVolumeControls] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 볼륨을 1~10 단계로 변환 (0.0~1.0 -> 0~10)
  const volumeLevel = Math.round(volume * 10);
  
  // 볼륨 레벨(1~10)을 실제 볼륨 값(0.0~1.0)으로 변환
  const handleVolumeLevelClick = (level: number) => {
    const newVolume = level / 10; // 1~10을 0.1~1.0으로 변환
    setVolume(newVolume);
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

  // 외부 클릭 시 볼륨 컨트롤 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowVolumeControls(false);
      }
    };

    if (showVolumeControls) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showVolumeControls]);

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
      onMouseEnter={() => setShowVolumeControls(true)}
      onMouseLeave={() => setShowVolumeControls(false)}
    >
      {/* 볼륨 레벨 버튼 (1~10) */}
      {showVolumeControls && (
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: "12px",
            borderRadius: "8px",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
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
              marginBottom: "4px",
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

          {/* 볼륨 레벨 버튼 그리드 (1~10) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "4px",
              width: "100%",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
              const isActive = !isMuted && volumeLevel >= level;
              const levelVolume = level / 10;
              const levelColor = getVolumeColor(levelVolume);
              
              return (
                <button
                  key={level}
                  onClick={() => handleVolumeLevelClick(level)}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    border: isActive
                      ? `2px solid ${levelColor}`
                      : "1px solid rgba(255, 255, 255, 0.2)",
                    backgroundColor: isActive
                      ? `${levelColor}40`
                      : "rgba(255, 255, 255, 0.1)",
                    color: isActive ? levelColor : "rgba(255, 255, 255, 0.5)",
                    fontSize: "10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow = `0 0 8px ${levelColor}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {level}
                </button>
              );
            })}
          </div>

          {/* 현재 볼륨 레벨 표시 */}
          <div
            style={{
              fontSize: "11px",
              color: "white",
              fontWeight: "bold",
              textAlign: "center",
              marginTop: "4px",
            }}
          >
            {isMuted ? "음소거" : `레벨 ${volumeLevel}/10`}
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

