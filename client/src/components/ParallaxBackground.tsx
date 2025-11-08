import { useTranslation } from "react-i18next";
import { useParallax } from "../hooks/useParallax";
import { getBackgroundThemeByLanguage, backgroundConfigs } from "../lib/backgroundConfig";

export function ParallaxBackground() {
  const { i18n } = useTranslation();
  const { skyRef, farRef, midRef, treesRef, nearRef } = useParallax();
  
  // 현재 언어에 맞는 배경 테마 가져오기
  const theme = getBackgroundThemeByLanguage(i18n.language);
  const background = backgroundConfigs[theme];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div
        ref={skyRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${background.sky}')`,
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPosition: "0px bottom",
          willChange: "background-position",
        }}
      />
      <div
        ref={farRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${background.far}')`,
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPosition: "0px bottom",
          willChange: "background-position",
        }}
      />
      <div
        ref={midRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${background.mid}')`,
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPosition: "0px bottom",
          willChange: "background-position",
        }}
      />
      <div
        ref={treesRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${background.trees}')`,
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPosition: "0px bottom",
          willChange: "background-position",
        }}
      />
      <div
        ref={nearRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${background.near}')`,
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPosition: "0px bottom",
          willChange: "background-position",
        }}
      />
    </div>
  );
}