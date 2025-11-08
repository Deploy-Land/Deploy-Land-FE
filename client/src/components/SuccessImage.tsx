import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface SuccessImageProps {
  show: boolean;
  onClose?: () => void;
}

export function SuccessImage({ show, onClose }: SuccessImageProps) {
  const { i18n } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // 3초 후 자동으로 사라지기
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, onClose]);

  if (!visible) return null;

  // 언어에 따른 성공 이미지 경로 결정
  const getSuccessImagePath = (language: string): string => {
    switch (language) {
      case "ko":
        return "/img/ko/ko_success.png";
      case "en":
        return "/img/en/en_success.png";
      case "jp":
        return "/img/jp/jp_success.png";
      default:
        return "/img/ko/ko_success.png"; // 기본값
    }
  };

  const successImagePath = getSuccessImagePath(i18n.language);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        pointerEvents: show ? "auto" : "none",
        backgroundColor: "rgba(128, 128, 128, 0.7)",
        animation: show ? "fadeIn 0.3s ease-in" : "fadeOut 0.3s ease-out",
      }}
      onClick={() => {
        setVisible(false);
        onClose?.();
      }}
    >
      <img
        src={successImagePath}
        alt="Success"
        style={{
          maxWidth: "80%",
          maxHeight: "80%",
          objectFit: "contain",
          animation: show ? "scaleIn 0.5s ease-out" : "scaleOut 0.3s ease-in",
        }}
      />
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes scaleOut {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

