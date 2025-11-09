/**
 * 언어별 배경 설정
 */
export type BackgroundTheme = "mountain" | "forest" | "cyberpunk" | "dusk" | "canyon";
/**
 * 파이프라인 단계별 배경 테마
 */
export type PipelineStage = "source" | "build" | "deploy";

export interface BackgroundLayerConfig {
  sky: string;
  far: string;
  mid: string;
  trees: string;
  near: string;
}

/**
 * 배경 팩별 레이어 경로 설정
 */
export const backgroundConfigs: Record<BackgroundTheme, BackgroundLayerConfig> = {
  mountain: {
    sky: "/en_bg/parallax_mountain_pack/layers/parallax-mountain-bg.png",
    far: "/en_bg/parallax_mountain_pack/layers/parallax-mountain-montain-far.png",
    mid: "/en_bg/parallax_mountain_pack/layers/parallax-mountain-mountains.png",
    trees: "/en_bg/parallax_mountain_pack/layers/parallax-mountain-trees.png",
    near: "/en_bg/parallax_mountain_pack/layers/parallax-mountain-foreground-trees.png",
  },
  forest: {
    sky: "/ko_bg/parallax_forest_pack/layers/parallax-forest-lights.png",
    far: "/ko_bg/parallax_forest_pack/layers/parallax-forest-back-trees.png",
    mid: "/ko_bg/parallax_forest_pack/layers/parallax-forest-middle-trees.png",
    trees: "/ko_bg/parallax_forest_pack/layers/parallax-forest-front-trees.png",
    near: "/ko_bg/parallax_forest_pack/layers/parallax-forest-front-trees.png", // forest에는 foreground가 없어서 front-trees 사용
  },
  cyberpunk: {
    sky: "/jp_bg/cyberpunk-street-files/PNG/layers/back-buildings.png",
    far: "/jp_bg/cyberpunk-street-files/PNG/layers/back-buildings.png", // back-buildings를 far에도 사용
    mid: "/jp_bg/cyberpunk-street-files/PNG/layers/far-buildings.png",
    trees: "/jp_bg/cyberpunk-street-files/PNG/cyberpunk-street.png", // 메인 배경 이미지
    near: "/jp_bg/cyberpunk-street-files/PNG/layers/foreground.png",
  },
  dusk: {
    sky: "/en_bg/stage2/Layers/sky.png",
    far: "/en_bg/stage2/Layers/far-mountains.png",
    mid: "/en_bg/stage2/Layers/middle-mountains.png",
    trees: "/en_bg/stage2/Layers/near-trees.png",
    near: "/en_bg/stage2/Layers/myst.png", // 안개를 가장 앞에
  },
  canyon: {
    sky: "/en_bg/stage3/layers/sky.png",
    far: "/en_bg/stage3/layers/clouds.png", // 구름을 원거리에
    mid: "/en_bg/stage3/layers/far-mountains.png",
    trees: "/en_bg/stage3/layers/canyon.png",
    near: "/en_bg/stage3/layers/front.png",
  },
};

/**
 * 언어 코드를 배경 테마로 변환 (기본 배경)
 */
export function getBackgroundThemeByLanguage(language: string): BackgroundTheme {
  switch (language) {
    case "ko":
      return "mountain";
    case "en":
      return "forest";
    case "jp":
      return "cyberpunk";
    default:
      return "mountain"; // 기본값
  }
}

/**
 * 파이프라인 단계별 배경 테마 결정
 * @param currentStage 현재 진행 중인 단계 ("source" | "build" | "deploy" | null)
 * @param language 언어 코드 (기본 배경 결정용)
 * @returns 배경 테마
 */
export function getBackgroundThemeByStage(
  currentStage: "Source" | "Build" | "Deploy" | null,
  language: string
): BackgroundTheme {
  // 단계별 배경 매핑
  switch (currentStage) {
    case "Source":
      // Source 단계: 언어별 기본 배경
      return getBackgroundThemeByLanguage(language);
    case "Build":
      // Build 단계: dusk (stage2)
      return "dusk";
    case "Deploy":
      // Deploy 단계: canyon (stage3)
      return "canyon";
    default:
      // 단계가 없으면 언어별 기본 배경
      return getBackgroundThemeByLanguage(language);
  }
}

/**
 * 파이프라인 단계 상태로부터 현재 진행 중인 단계 결정
 * @param sourceStage Source 단계 상태
 * @param buildStage Build 단계 상태
 * @param deployStage Deploy 단계 상태
 * @returns 현재 진행 중인 단계 ("source" | "build" | "deploy" | null)
 */
export function getCurrentPipelineStage(
  sourceStage: { status: string },
  buildStage: { status: string },
  deployStage: { status: string }
): "Source" | "Build" | "Deploy" | null {
  // Deploy가 진행 중이면 Deploy
  if (deployStage.status === "STARTED") {
    return "Deploy";
  }
  
  // Build가 진행 중이면 Build
  if (buildStage.status === "STARTED") {
    return "Build";
  }
  
  // Source가 진행 중이면 Source
  if (sourceStage.status === "STARTED") {
    return "Source";
  }
  
  // 모든 단계가 완료되었거나 대기 중이면, 가장 최근에 완료된 단계를 확인
  // Deploy가 성공했으면 Deploy 유지
  if (deployStage.status === "SUCCEEDED") {
    return "Deploy";
  }
  
  // Build가 성공했으면 Build 유지 (Deploy 대기 중)
  if (buildStage.status === "SUCCEEDED") {
    return "Build";
  }
  
  // Source가 성공했으면 Source 유지 (Build 대기 중)
  if (sourceStage.status === "SUCCEEDED") {
    return "Source";
  }
  
  // 기본값: Source
  return "Source";
}

