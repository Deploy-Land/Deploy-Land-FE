import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { usePipelineStatus } from "@/hooks/usePipelineStatus";
import { useSourceStage, useBuildStage, useDeployStage } from "@/store/pipelineStore";
import { Skeleton } from "./ui/skeleton";

const endpointPath = "/api/status/{pipelineId}";

export function CICDStatusModal() {
  const { t } = useTranslation();
  const { pipelineStatus, isLoading, error, pipelineId } = usePipelineStatus();
  
  // 3단계 상태 가져오기
  const sourceStage = useSourceStage();
  const buildStage = useBuildStage();
  const deployStage = useDeployStage();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className="text-lg px-8 py-6 border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          {t("landing.ctaDocs")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl sm:max-w-3xl bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <DialogHeader className="space-y-2">
          <DialogTitle>{t("modal.title")}</DialogTitle>
          <DialogDescription>
            {t("modal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm text-muted-foreground">
          {/* API 엔드포인트 정보 */}
          <section className="space-y-3 text-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                GET
              </Badge>
              <code className="rounded bg-muted px-2 py-1 text-xs font-mono text-foreground">
                {endpointPath}
              </code>
            </div>
            <p>
              {t("modal.successDescription")}
            </p>
          </section>

          {/* 실제 파이프라인 상태 표시 */}
          <Separator />
          <section className="space-y-3 text-foreground">
            <h3 className="text-sm font-semibold">실시간 파이프라인 상태</h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : error ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive space-y-2">
                <p className="font-medium">상태 조회 실패</p>
                <p className="text-xs">
                  {error instanceof Error ? error.message : "Unknown error"}
                </p>
                {error instanceof Error && error.message.includes("LATEST_EXECUTION") && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      ⚠️ LATEST_EXECUTION이 백엔드에서 지원되지 않는 것 같습니다.
                    </p>
                    <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                      백엔드에서 LATEST_EXECUTION을 특별 키워드로 처리하도록 설정해야 합니다.
                    </p>
                  </div>
                )}
              </div>
            ) : pipelineStatus ? (
              <div className="space-y-4">
                {/* 기본 정보 */}
                <div className="space-y-3 rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Pipeline ID:</span>
                    <code className="rounded bg-muted px-2 py-1 text-xs">{pipelineStatus.pipelineId}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant={pipelineStatus.status === "success" ? "default" : "secondary"}>
                      {pipelineStatus.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Jobs:</span>
                    <span className="text-sm">
                      {pipelineStatus.completedJobs} / {pipelineStatus.totalJobs}
                    </span>
                  </div>
                </div>

                {/* 3단계 상태 표시 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">단계별 상태</h4>
                  
                  {/* 소스 단계 */}
                  <div className="rounded-md border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">📦 소스 (Source)</span>
                      <Badge
                        variant={
                          sourceStage.status === "success"
                            ? "default"
                            : sourceStage.status === "failed"
                            ? "destructive"
                            : sourceStage.status === "running"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {sourceStage.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sourceStage.completedJobs} / {sourceStage.totalJobs} 작업 완료
                    </div>
                    {sourceStage.jobs.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs">
                        {sourceStage.jobs.map((job) => (
                          <li key={job.jobId} className="flex items-center justify-between">
                            <span>{job.name}</span>
                            <Badge
                              variant={
                                job.status === "success"
                                  ? "default"
                                  : job.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {job.status}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* 빌드 단계 */}
                  <div className="rounded-md border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">🔨 빌드 (Build)</span>
                      <Badge
                        variant={
                          buildStage.status === "success"
                            ? "default"
                            : buildStage.status === "failed"
                            ? "destructive"
                            : buildStage.status === "running"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {buildStage.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {buildStage.completedJobs} / {buildStage.totalJobs} 작업 완료
                    </div>
                    {buildStage.jobs.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs">
                        {buildStage.jobs.map((job) => (
                          <li key={job.jobId} className="flex items-center justify-between">
                            <span>{job.name}</span>
                            <Badge
                              variant={
                                job.status === "success"
                                  ? "default"
                                  : job.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {job.status}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* 디플로이 단계 */}
                  <div className="rounded-md border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">🚀 디플로이 (Deploy)</span>
                      <Badge
                        variant={
                          deployStage.status === "success"
                            ? "default"
                            : deployStage.status === "failed"
                            ? "destructive"
                            : deployStage.status === "running"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {deployStage.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {deployStage.completedJobs} / {deployStage.totalJobs} 작업 완료
                    </div>
                    {deployStage.jobs.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs">
                        {deployStage.jobs.map((job) => (
                          <li key={job.jobId} className="flex items-center justify-between">
                            <span>{job.name}</span>
                            <Badge
                              variant={
                                job.status === "success"
                                  ? "default"
                                  : job.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {job.status}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">파이프라인 데이터가 없습니다.</p>
            )}
          </section>

          <section className="space-y-2 text-foreground">
            <h3 className="text-sm font-semibold">{t("modal.successSummary")}</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>{t("modal.successItem1")}</li>
              <li>{t("modal.successItem2")}</li>
              <li>{t("modal.successItem3")}</li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}


