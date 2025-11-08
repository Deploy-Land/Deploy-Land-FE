import type { KaboomCtx } from "kaplay";
import { getBackgroundThemeByLanguage, backgroundConfigs } from "../lib/backgroundConfig";
import i18n from "../lib/i18n";

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
  } catch {}
}

export function loadParallaxSprites(k: KaboomCtx) {
  try {
    // 현재 언어에 맞는 배경 테마 가져오기
    const theme = getBackgroundThemeByLanguage(i18n.language);
    const background = backgroundConfigs[theme];
    
    k.loadSprite("bg_sky", background.sky);
    k.loadSprite("bg_far", background.far);
    k.loadSprite("bg_mid", background.mid);
    k.loadSprite("bg_trees", background.trees);
    k.loadSprite("bg_near", background.near);
  } catch {}
}


