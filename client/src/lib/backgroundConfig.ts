/**
 * 언어별 배경 설정
 */
export type BackgroundTheme = "mountain" | "forest" | "cyberpunk";

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
    sky: "/parallax_mountain_pack/layers/parallax-mountain-bg.png",
    far: "/parallax_mountain_pack/layers/parallax-mountain-montain-far.png",
    mid: "/parallax_mountain_pack/layers/parallax-mountain-mountains.png",
    trees: "/parallax_mountain_pack/layers/parallax-mountain-trees.png",
    near: "/parallax_mountain_pack/layers/parallax-mountain-foreground-trees.png",
  },
  forest: {
    sky: "/parallax_forest_pack/layers/parallax-forest-lights.png",
    far: "/parallax_forest_pack/layers/parallax-forest-back-trees.png",
    mid: "/parallax_forest_pack/layers/parallax-forest-middle-trees.png",
    trees: "/parallax_forest_pack/layers/parallax-forest-front-trees.png",
    near: "/parallax_forest_pack/layers/parallax-forest-front-trees.png", // forest에는 foreground가 없어서 front-trees 사용
  },
  cyberpunk: {
    sky: "/cyberpunk-street-files/PNG/layers/back-buildings.png",
    far: "/cyberpunk-street-files/PNG/layers/back-buildings.png", // back-buildings를 far에도 사용
    mid: "/cyberpunk-street-files/PNG/layers/far-buildings.png",
    trees: "/cyberpunk-street-files/PNG/cyberpunk-street.png", // 메인 배경 이미지
    near: "/cyberpunk-street-files/PNG/layers/foreground.png",
  },
};

/**
 * 언어 코드를 배경 테마로 변환
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

