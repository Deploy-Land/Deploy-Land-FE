import type { KaboomCtx } from "kaplay";
import { 
  getBackgroundThemeByLanguage, 
  getBackgroundThemeByStage,
  getCurrentPipelineStage,
  backgroundConfigs 
} from "../lib/backgroundConfig";
import i18n from "../lib/i18n";
import type { StageStatus } from "../store/pipelineStore";

export function loadCoreAssets(k: KaboomCtx) {
  try {
    k.loadSound("hit", "/sounds/hit.mp3");
    k.loadSound("success", "/sounds/success.mp3");
    k.loadSprite("asphalt", "/textures/asphalt.png");
    k.loadSprite("grass", "/textures/grass.png");
    k.loadSprite("sand", "/textures/sand.jpg");
    k.loadSprite("wood", "/textures/wood.jpg");
    
    // 시바견 애니메이션 스프라이트 (3장)
    k.loadSprite("shiba", "/shiba/shiba_1.png", {
      sliceX: 1,
      sliceY: 1,
      anims: {
        idle: { from: 0, to: 0 },
        run: { from: 0, to: 2, loop: true, speed: 8 }
      }
    });
    
    // 개별 시바견 프레임들 (애니메이션용, 3장)
    k.loadSprite("shiba_1", "/shiba/shiba_1.png");
    k.loadSprite("shiba_2", "/shiba/shiba_2.png");
    k.loadSprite("shiba_3", "/shiba/shiba_3.png");
    
    // 뼈다귀 스프라이트
    k.loadSprite("bone", "/asset/bone.png");
    
    // 버그 스프라이트 (장애물)
    k.loadSprite("bug", "/asset/bug.png");
  } catch {}
}

/**
 * 파이프라인 단계 상태를 기반으로 배경 스프라이트 로드
 * @param k Kaplay 컨텍스트
 * @param sourceStage Source 단계 상태 (선택적)
 * @param buildStage Build 단계 상태 (선택적)
 * @param deployStage Deploy 단계 상태 (선택적)
 */
export function loadParallaxSprites(
  k: KaboomCtx,
  sourceStage?: StageStatus,
  buildStage?: StageStatus,
  deployStage?: StageStatus
) {
  try {
    let theme: string;
    
    // 파이프라인 단계 상태가 제공되면 단계별 배경 사용
    if (sourceStage && buildStage && deployStage) {
      const currentStage = getCurrentPipelineStage(sourceStage, buildStage, deployStage);
      theme = getBackgroundThemeByStage(currentStage, i18n.language);
    } else {
      // 파이프라인 단계 상태가 없으면 언어별 기본 배경 사용
      theme = getBackgroundThemeByLanguage(i18n.language);
    }
    
    const background = backgroundConfigs[theme as keyof typeof backgroundConfigs];
    
    k.loadSprite("bg_sky", background.sky);
    k.loadSprite("bg_far", background.far);
    k.loadSprite("bg_mid", background.mid);
    k.loadSprite("bg_trees", background.trees);
    k.loadSprite("bg_near", background.near);
  } catch {}
}


