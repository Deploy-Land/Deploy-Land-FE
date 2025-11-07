import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

interface GameControlsProps {
  onStartMovement: () => void;
  onReset: () => void;
  onStageTest: (stage: "Build" | "Test" | "Deploy", success: boolean) => void;
}

export function GameControls({ onStartMovement, onReset, onStageTest }: GameControlsProps) {
  const { t } = useTranslation();

  return (
    <div style={{
      position: "absolute",
      top: 20,
      left: 20,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      zIndex: 1000,
    }}>
      <div style={{ display: "flex", gap: "10px" }}>
        <Button
          onClick={onStartMovement}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "12px 24px",
            fontSize: "16px",
          }}
        >
          {t("game.start")}
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            color: "black",
            padding: "12px 24px",
            fontSize: "16px",
          }}
        >
          {t("game.reset")}
        </Button>
      </div>

      {/* Build 단계 테스트 */}
      <div style={{ display: "flex", gap: "5px", flexDirection: "column" }}>
        <div style={{ color: "white", fontSize: "12px", marginBottom: "5px" }}>{t("game.buildZone")}</div>
        <div style={{ display: "flex", gap: "5px" }}>
          <Button
            onClick={() => onStageTest("Build", true)}
            style={{
              backgroundColor: "rgba(0, 200, 0, 0.8)",
              color: "white",
              padding: "8px 16px",
              fontSize: "14px",
            }}
          >
            {t("game.success")}
          </Button>
          <Button
            onClick={() => onStageTest("Build", false)}
            style={{
              backgroundColor: "rgba(200, 0, 0, 0.8)",
              color: "white",
              padding: "8px 16px",
              fontSize: "14px",
            }}
          >
            {t("game.failure")}
          </Button>
        </div>
      </div>

      {/* Test 단계 테스트 */}
      <div style={{ display: "flex", gap: "5px", flexDirection: "column" }}>
        <div style={{ color: "white", fontSize: "12px", marginBottom: "5px" }}>{t("game.testZone")}</div>
        <div style={{ display: "flex", gap: "5px" }}>
          <Button
            onClick={() => onStageTest("Test", true)}
            style={{
              backgroundColor: "rgba(0, 200, 0, 0.8)",
              color: "white",
              padding: "8px 16px",
              fontSize: "14px",
            }}
          >
            {t("game.success")}
          </Button>
          <Button
            onClick={() => onStageTest("Test", false)}
            style={{
              backgroundColor: "rgba(200, 0, 0, 0.8)",
              color: "white",
              padding: "8px 16px",
              fontSize: "14px",
            }}
          >
            {t("game.failure")}
          </Button>
        </div>
      </div>

      {/* Deploy 단계 테스트 */}
      <div style={{ display: "flex", gap: "5px", flexDirection: "column" }}>
        <div style={{ color: "white", fontSize: "12px", marginBottom: "5px" }}>{t("game.deployZone")}</div>
        <div style={{ display: "flex", gap: "5px" }}>
          <Button
            onClick={() => onStageTest("Deploy", true)}
            style={{
              backgroundColor: "rgba(0, 200, 0, 0.8)",
              color: "white",
              padding: "8px 16px",
              fontSize: "14px",
            }}
          >
            {t("game.success")}
          </Button>
          <Button
            onClick={() => onStageTest("Deploy", false)}
            style={{
              backgroundColor: "rgba(200, 0, 0, 0.8)",
              color: "white",
              padding: "8px 16px",
              fontSize: "14px",
            }}
          >
            {t("game.failure")}
          </Button>
        </div>
      </div>
    </div>
  );
}