import { useSourceStage, useBuildStage, useDeployStage, usePipelineStatus } from "../store/pipelineStore";

interface Milestone {
  position: number;
  label: string;
  color: string;
}

const milestones: Milestone[] = [
  { position: 0, label: "시작", color: "#cccccc" },
  { position: 20, label: "Source", color: "#ffbc42" },
  { position: 40, label: "Build", color: "#d81159" },
  { position: 60, label: "Deploy", color: "#8f2d56" },
  { position: 80, label: "Validation", color: "#218380" },
  { position: 100, label: "Finish", color: "#73d2de" },
];

/**
 * 파이프라인 단계별 진행률 계산
 */
function calculateProgress(
  sourceStage: { status: string; completedJobs: number; totalJobs: number },
  buildStage: { status: string; completedJobs: number; totalJobs: number },
  deployStage: { status: string; completedJobs: number; totalJobs: number },
  pipelineStatus: { status?: string } | null,
  isValidationComplete?: boolean
): number {
  const status = pipelineStatus?.status?.toUpperCase() || "";
  
  // Validation이 완료되면 100% 달성 (가장 우선순위)
  if (isValidationComplete) {
    return 100;
  }
  
  // SUCCEEDED 또는 SUCCESS: 전체 파이프라인이 성공하면 100%
  // API에서 "SUCCEEDED", "SUCCESS", "success" 등 다양한 형태로 올 수 있음
  if (status === "SUCCEEDED" || status === "SUCCESS") {
    return 100;
  }
  
      // FAILED 또는 FAILURE: 실패 시 실패한 단계의 진행률에서 멈춤
      // API에서 "FAILED", "FAILURE", "failed" 등 다양한 형태로 올 수 있음
      if (status === "FAILED" || status === "FAILURE") {
        // 실패한 단계 찾기 (FAILED 또는 STARTED 상태인 단계)
        if (deployStage.status === "FAILED" || deployStage.status === "STARTED") {
          const deployProgress = deployStage.totalJobs > 0 
            ? deployStage.completedJobs / deployStage.totalJobs 
            : 0;
          return Math.min(40 + deployProgress * 20, 60);
        }
        if (buildStage.status === "FAILED" || buildStage.status === "STARTED") {
          const buildProgress = buildStage.totalJobs > 0 
            ? buildStage.completedJobs / buildStage.totalJobs 
            : 0;
          return Math.min(20 + buildProgress * 20, 40);
        }
        if (sourceStage.status === "FAILED" || sourceStage.status === "STARTED") {
          const sourceProgress = sourceStage.totalJobs > 0 
            ? sourceStage.completedJobs / sourceStage.totalJobs 
            : 0;
          return Math.min(sourceProgress * 20, 20);
        }
        // 실패했지만 어떤 단계도 STARTED/FAILED가 아닌 경우
        return 0;
      }
      
      // CANCELED: 취소 시 현재 진행률에서 멈춤
      if (status === "CANCELED") {
        // 취소 시점의 진행 중이었던 단계 찾기
        if (deployStage.status === "STARTED") {
          const deployProgress = deployStage.totalJobs > 0 
            ? deployStage.completedJobs / deployStage.totalJobs 
            : 0;
          return Math.min(40 + deployProgress * 20, 60);
        }
        if (buildStage.status === "STARTED") {
          const buildProgress = buildStage.totalJobs > 0 
            ? buildStage.completedJobs / buildStage.totalJobs 
            : 0;
          return Math.min(20 + buildProgress * 20, 40);
        }
        if (sourceStage.status === "STARTED") {
          const sourceProgress = sourceStage.totalJobs > 0 
            ? sourceStage.completedJobs / sourceStage.totalJobs 
            : 0;
          return Math.min(sourceProgress * 20, 20);
        }
        return 0;
      }

      // STARTED 상태: 각 단계의 STARTED 상태에 따라 진행률 계산
      // STARTED와 SUCCEEDED 사이는 STARTED 상태로 진행됨
      
      // Deploy가 완료되면 80% (validation 단계로 넘어감)
      // Validation 모달이 열려있으면 100%로 표시 (위에서 이미 처리됨)
      if (deployStage.status === "SUCCEEDED") {
        // Validation이 완료되면 100%, 아니면 80% (Validation 단계)
        return isValidationComplete ? 100 : 80;
      }

      // Deploy가 진행 중(STARTED)이면 40-60%
      if (deployStage.status === "STARTED") {
        const deployProgress = deployStage.totalJobs > 0 
          ? deployStage.completedJobs / deployStage.totalJobs 
          : 0;
        return 40 + deployProgress * 20;
      }

      // Build가 완료되면 40% (deploy 대기 중)
      if (buildStage.status === "SUCCEEDED") {
        return 40;
      }

      // Build가 진행 중(STARTED)이면 20-40%
      if (buildStage.status === "STARTED") {
        const buildProgress = buildStage.totalJobs > 0 
          ? buildStage.completedJobs / buildStage.totalJobs 
          : 0;
        return 20 + buildProgress * 20;
      }

      // Source가 완료되면 20% (build 대기 중)
      if (sourceStage.status === "SUCCEEDED") {
        return 20;
      }

      // Source가 진행 중(STARTED)이면 0-20%
      if (sourceStage.status === "STARTED") {
        const sourceProgress = sourceStage.totalJobs > 0 
          ? sourceStage.completedJobs / sourceStage.totalJobs 
          : 0;
        return sourceProgress * 20;
      }

  // STARTED 상태지만 아직 어떤 단계도 시작되지 않았으면 0%
  if (status === "STARTED") {
    return 0;
  }

  // 파이프라인 상태가 있지만 아직 시작되지 않았으면 0%
  if (pipelineStatus) {
    return 0;
  }

  // 대기 중이면 0%
  return 0;
}

/**
 * 완료된 마일스톤 개수 계산
 */
function getCompletedMilestones(progress: number): number {
  if (progress >= 100) return 6;
  if (progress >= 80) return 5;
  if (progress >= 60) return 4;
  if (progress >= 40) return 3;
  if (progress >= 20) return 2;
  if (progress > 0) return 1;
  return 0;
}

/**
 * 현재 진행률에 따른 색상 결정
 */
function getProgressColor(progress: number): string {
  if (progress >= 100) return milestones[5].color; // Finish
  if (progress >= 80) return milestones[4].color; // Validation
  if (progress >= 60) return milestones[3].color; // Deploy
  if (progress >= 40) return milestones[2].color; // Build
  if (progress >= 20) return milestones[1].color; // Source
  return milestones[0].color; // 시작
}

/**
 * 현재 파이프라인 상태 텍스트 생성
 */
function getStatusText(
  sourceStage: { status: string; completedJobs: number; totalJobs: number },
  buildStage: { status: string; completedJobs: number; totalJobs: number },
  deployStage: { status: string; completedJobs: number; totalJobs: number },
  pipelineStatus: { status?: string; currentStage?: string } | null,
  isValidationComplete?: boolean
): string {
  const status = pipelineStatus?.status?.toUpperCase() || "";
  const currentStage = pipelineStatus?.currentStage || "";
  const currentStageLower = currentStage.toLowerCase();
  
  // Validation이 완료되면 100% 달성
  if (isValidationComplete) {
    return "파이프라인 완료! 🎉 (100%)";
  }
  
  // Deploy가 완료되면 Validation 단계로 넘어감
  if (deployStage.status === "SUCCEEDED" && status !== "SUCCEEDED" && status !== "SUCCESS") {
    return "Deploy 완료, Validation 진행 중... ✅";
  }
  
  // STARTED: 파이프라인 시작됨
  // STARTED와 SUCCEEDED 사이는 각 단계가 STARTED 상태로 진행됨
  if (status === "STARTED" || status === "IN_PROGRESS") {
    // currentStage를 기반으로 현재 진행 중인 단계 확인
    if (currentStageLower.includes("deploy")) {
      return `Deploy 단계 진행 중... (${deployStage.completedJobs}/${deployStage.totalJobs}) 🚀`;
    }
    if (currentStageLower.includes("build")) {
      return `Build 단계 진행 중... (${buildStage.completedJobs}/${buildStage.totalJobs}) 🔨`;
    }
    if (currentStageLower.includes("source")) {
      return `Source 단계 진행 중... (${sourceStage.completedJobs}/${sourceStage.totalJobs}) 📥`;
    }
    
    // currentStage가 없으면 각 stage의 status를 확인
    if (deployStage.status === "STARTED") {
      return `Deploy 단계 진행 중... (${deployStage.completedJobs}/${deployStage.totalJobs}) 🚀`;
    }
    if (buildStage.status === "STARTED") {
      return `Build 단계 진행 중... (${buildStage.completedJobs}/${buildStage.totalJobs}) 🔨`;
    }
    if (sourceStage.status === "STARTED") {
      return `Source 단계 진행 중... (${sourceStage.completedJobs}/${sourceStage.totalJobs}) 📥`;
    }
    // STARTED 상태지만 아직 STARTED 단계가 없으면 (초기 시작)
    return "파이프라인 시작됨 ▶️";
  }
  
  // SUCCEEDED 또는 SUCCESS: 파이프라인 성공
  // API에서 "SUCCEEDED", "SUCCESS", "success" 등 다양한 형태로 올 수 있음
  if (status === "SUCCEEDED" || status === "SUCCESS") {
    return "파이프라인 성공! 🎉";
  }

  // FAILED 또는 FAILURE: 파이프라인 실패
  // STARTED 상태에서 STARTED 중이었던 단계가 실패한 경우
  // API에서 "FAILED", "FAILURE", "failed" 등 다양한 형태로 올 수 있음
  if (status === "FAILED" || status === "FAILURE") {
    // currentStage를 기반으로 실패한 단계 확인
    if (currentStageLower.includes("deploy")) {
      return `Deploy 단계 실패 (${deployStage.completedJobs}/${deployStage.totalJobs}) ❌`;
    }
    if (currentStageLower.includes("build")) {
      return `Build 단계 실패 (${buildStage.completedJobs}/${buildStage.totalJobs}) ❌`;
    }
    if (currentStageLower.includes("source")) {
      return `Source 단계 실패 (${sourceStage.completedJobs}/${sourceStage.totalJobs}) ❌`;
    }
    
    // currentStage가 없으면 각 stage의 status를 확인
    if (deployStage.status === "FAILED") {
      return `Deploy 단계 실패 (${deployStage.completedJobs}/${deployStage.totalJobs}) ❌`;
    }
    if (buildStage.status === "FAILED") {
      return `Build 단계 실패 (${buildStage.completedJobs}/${buildStage.totalJobs}) ❌`;
    }
    if (sourceStage.status === "FAILED") {
      return `Source 단계 실패 (${sourceStage.completedJobs}/${sourceStage.totalJobs}) ❌`;
    }
    // FAILED 상태지만 특정 단계 실패가 명확하지 않은 경우
    return "파이프라인 실패 ❌";
  }
  
  // CANCELED: 파이프라인 취소됨
  if (status === "CANCELED") {
    return "파이프라인 취소됨 ⏹️";
  }
  
  // 상태가 없거나 다른 경우: currentStage 또는 각 단계의 status를 확인
  // currentStage를 우선 확인
  if (currentStage) {
    if (currentStageLower.includes("deploy")) {
      if (deployStage.status === "SUCCEEDED") {
        return "Deploy 단계 완료, Validation 진행 중... ";
      }
      return `Deploy 단계 진행 중... (${deployStage.completedJobs}/${deployStage.totalJobs}) 🚀`;
    }
    if (currentStageLower.includes("build")) {
      if (buildStage.status === "SUCCEEDED") {
        return "Build 단계 완료, Deploy 대기 중... ";
      }
      return `Build 단계 진행 중... (${buildStage.completedJobs}/${buildStage.totalJobs}) 🔨`;
    }
    if (currentStageLower.includes("source")) {
      if (sourceStage.status === "SUCCEEDED") {
        return "Source 단계 완료, Build 대기 중... ";
      }
      return `Source 단계 진행 중... (${sourceStage.completedJobs}/${sourceStage.totalJobs}) 📥`;
    }
  }

  // currentStage가 없으면 각 stage의 status를 확인
  // Deploy 단계 진행 중
  if (deployStage.status === "STARTED") {
    return `Deploy 단계 진행 중... (${deployStage.completedJobs}/${deployStage.totalJobs}) 🚀`;
  }

  // Deploy 단계 완료
  if (deployStage.status === "SUCCEEDED") {
    return "Deploy 단계 완료, Validation 진행 중... ";
  }

  // Build 단계 진행 중
  if (buildStage.status === "STARTED") {
    return `Build 단계 진행 중... (${buildStage.completedJobs}/${buildStage.totalJobs}) 🔨`;
  }

  // Build 단계 완료
  if (buildStage.status === "SUCCEEDED") {
    return "Build 단계 완료, Deploy 대기 중... ";
  }

  // Source 단계 진행 중
  if (sourceStage.status === "STARTED") {
    return `Source 단계 진행 중... (${sourceStage.completedJobs}/${sourceStage.totalJobs}) 📥`;
  }

  // Source 단계 완료
  if (sourceStage.status === "SUCCEEDED") {
    return "Source 단계 완료, Build 대기 중... ";
  }

  // 파이프라인 시작 대기
  if (pipelineStatus) {
    return "파이프라인 시작 대기 중... ⏳";
  }

  // 파이프라인 없음
  return "파이프라인 정보 없음";
}

interface PipelineProgressBarProps {
  isValidationComplete?: boolean;
}

export function PipelineProgressBar({ isValidationComplete = false }: PipelineProgressBarProps) {
  const sourceStage = useSourceStage();
  const buildStage = useBuildStage();
  const deployStage = useDeployStage();
  const pipelineStatus = usePipelineStatus();

  const progress = calculateProgress(sourceStage, buildStage, deployStage, pipelineStatus, isValidationComplete);
  const completedMilestones = getCompletedMilestones(progress);
  const progressColor = getProgressColor(progress);
  const statusText = getStatusText(sourceStage, buildStage, deployStage, pipelineStatus, isValidationComplete);

  const componentHeight = 50;
  const lineHeight = componentHeight / 10;
  const dotSize = lineHeight * 3.5;

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "800px",
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: "20px",
        borderRadius: "8px",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* 현재 상태 텍스트 */}
      <div
        style={{
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "white",
            marginBottom: "4px",
          }}
        >
          {statusText}
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "rgba(255, 255, 255, 0.7)",
          }}
        >
          진행률: {Math.round(progress)}%
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          width: "100%",
          height: `${componentHeight}px`,
        }}
      >
        {/* 차트 컨테이너 */}
        <div
          style={{
            display: "flex",
            flexFlow: "column",
            alignItems: "center",
            flex: "1 50%",
          }}
        >
          {/* 라인 컨테이너 */}
          <div
            style={{
              position: "absolute",
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: `${dotSize}px`,
            }}
          >
            {/* 배경 라인 */}
            <div
              style={{
                alignSelf: "center",
                position: "absolute",
                top: `${dotSize / 2}px`,
                transform: "translateY(-50%)",
                width: "100%",
                height: `${lineHeight}px`,
                backgroundColor: "rgba(204, 204, 204, 0.5)",
              }}
            />
            {/* 진행 라인 */}
            <div
              style={{
                alignSelf: "center",
                position: "absolute",
                top: `${dotSize / 2}px`,
                transform: "translateY(-50%)",
                width: `${progress}%`,
                height: `${lineHeight}px`,
                backgroundColor: progressColor,
                transition: "all 0.25s ease-out",
              }}
            />
          </div>

          {/* 도트 컨테이너 */}
          <div
            style={{
              position: "absolute",
              height: `${dotSize}px`,
              width: "100%",
            }}
          >
            {milestones.map((milestone, index) => {
              const isCompleted = index < completedMilestones;
              const isCurrent = index === completedMilestones && progress > milestone.position;
              const shouldColor = isCompleted || isCurrent;

              return (
                <div
                  key={milestone.position}
                  style={{
                    position: "absolute",
                    left: `${milestone.position}%`,
                    transform: "translate(-50%, 0)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: `${dotSize}px`,
                      height: `${dotSize}px`,
                      borderRadius: "50%",
                      backgroundColor: shouldColor
                        ? milestone.color
                        : "rgba(204, 204, 204, 0.5)",
                      transform: "translateX(-50%)",
                      transition: "all 0.25s ease-out",
                      boxShadow: shouldColor ? `0 0 8px ${milestone.color}60` : "none",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 라벨 컨테이너 */}
        <div
          style={{
            display: "flex",
            flexFlow: "column nowrap",
            alignItems: "flex-start",
            flex: "1 50%",
            marginTop: `${componentHeight / 2 + 5}px`,
          }}
        >
          {milestones.map((milestone, index) => {
            const isCompleted = index < completedMilestones;
            const isCurrent = index === completedMilestones && progress > milestone.position;
            const shouldColor = isCompleted || isCurrent;

            return (
              <div
                key={milestone.position}
                style={{
                  position: "absolute",
                  left: `${milestone.position}%`,
                  transform: "translate(-50%, 0)",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: shouldColor ? milestone.color : "rgba(204, 204, 204, 0.7)",
                    transition: "all 0.25s ease-out",
                    whiteSpace: "nowrap",
                  }}
                >
                  {milestone.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

