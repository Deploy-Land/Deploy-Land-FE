import { useTranslation } from "react-i18next";
import { useParallax } from "../hooks/useParallax";
import { 
  getBackgroundThemeByStage, 
  getCurrentPipelineStage,
  backgroundConfigs 
} from "../lib/backgroundConfig";
import { useSourceStage, useBuildStage, useDeployStage } from "../store/pipelineStore";

export function ParallaxBackground() {
  const { i18n } = useTranslation();
  const { skyRef, farRef, midRef, treesRef, nearRef } = useParallax();
  
  // 파이프라인 단계 상태 가져오기
  const sourceStage = useSourceStage();
  const buildStage = useBuildStage();
  const deployStage = useDeployStage();
  
  // 현재 진행 중인 단계 결정
  const currentStage = getCurrentPipelineStage(sourceStage, buildStage, deployStage);
  
  // 단계별 배경 테마 결정
  const theme = getBackgroundThemeByStage(currentStage, i18n.language);
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