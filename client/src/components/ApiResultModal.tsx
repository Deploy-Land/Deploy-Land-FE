import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import type { PipelineStatus } from "@/types/cicd";
import { Skeleton } from "./ui/skeleton";
import { ExternalLink, Copy, Check } from "lucide-react";

interface ApiResultModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  pipelineStatus?: PipelineStatus | null;
  pipelineId?: string | null;
  isLoading?: boolean;
  error?: Error | null;
}

export function ApiResultModal({ 
  open: controlledOpen, 
  onOpenChange, 
  showTrigger = false,
  pipelineStatus,
  pipelineId,
  isLoading = false,
  error = null,
}: ApiResultModalProps = {}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  
  // 제어되거나 내부 상태 사용
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const handleCopyJson = async () => {
    try {
      const dataToCopy = pipelineStatus
        ? JSON.stringify(pipelineStatus, null, 2)
        : error
        ? JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2)
        : "{}";
      
      await navigator.clipboard.writeText(dataToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const getStatusVariant = (status: string) => {
    const statusUpper = status?.toUpperCase() || "";
    // SUCCEEDED 또는 SUCCESS 처리
    if (statusUpper === "SUCCEEDED" || statusUpper === "SUCCESS") {
      return "default";
    }
    // FAILED 또는 FAILURE 처리
    if (statusUpper === "FAILED" || statusUpper === "FAILURE") {
      return "destructive";
    }
    if (statusUpper === "STARTED") {
      return "secondary";
    }
    if (statusUpper === "CANCELED") {
      return "outline";
    }
    return "outline";
  };

  // 실제 API 응답 데이터 (pipelineStatus가 실제 API 응답 형식일 수 있음)
  const apiResponse = pipelineStatus as any;
  const status = apiResponse?.status?.toUpperCase() || "";

  // 상태에 따른 헤드라인 결정
  const getDialogTitle = () => {
    // FAILED 또는 FAILURE 처리
    if (status === "FAILED" || status === "FAILURE") {
      return "진짜"; // FAILED 상태일 때 "진짜" 헤드라인
    }
    // SUCCEEDED 또는 SUCCESS 처리
    if (status === "SUCCEEDED" || status === "SUCCESS") {
      return "파이프라인 성공";
    }
    if (status === "STARTED") {
      return "파이프라인 진행 중";
    }
    if (status === "CANCELED") {
      return "파이프라인 취소됨";
    }
    return "API 호출 결과";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {showTrigger && (
        <Button
          size="lg"
          variant="outline"
          className="text-lg px-8 py-6 border-gray-600 text-gray-300 hover:bg-gray-800"
          onClick={() => setIsOpen(true)}
        >
          API 호출 결과 보기
        </Button>
      )}
      <DialogContent className="max-w-3xl max-h-[85vh] bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 flex flex-col">
        <DialogHeader className="space-y-1 flex-shrink-0">
          <DialogTitle className={`text-base ${status === "FAILED" ? "text-destructive font-bold" : ""}`}>
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pipeline ID: <code className="text-xs px-1 py-0.5 bg-muted rounded">{pipelineId || "없음"}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {/* 새로고침 버튼 제거 - props로 pipelineStatus를 받음 */}
          <div className="flex items-center justify-between gap-2">
            {pipelineStatus && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 text-xs h-7"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    복사 완료
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    JSON 복사
                  </>
                )}
              </Button>
            )}
          </div>

          <Separator className="flex-shrink-0" />

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          )}

          {/* 에러 상태 */}
          {error && !isLoading && (
            <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive space-y-1.5">
              <p className="font-medium text-xs">API 호출 실패</p>
              <p className="text-xs break-words">
                {error instanceof Error ? error.message : String(error)}
              </p>
              <pre className="mt-2 p-2 bg-destructive/5 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                {JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2)}
              </pre>
            </div>
          )}

          {/* 성공 응답 */}
          {pipelineStatus && !isLoading && (
            <div className="space-y-3">
              {/* 기본 정보 카드 */}
              <div className="rounded-md border p-3 space-y-2">
                <h3 className="text-xs font-semibold">기본 정보</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">Pipeline ID:</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[120px]">
                      {apiResponse.pipelineId || apiResponse.pipelineID || pipelineId || "N/A"}
                    </code>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">Status:</span>
                    <Badge variant={getStatusVariant(apiResponse.status || "")} className="text-xs">
                      {apiResponse.status || "N/A"}
                    </Badge>
                  </div>
                  {apiResponse.currentStage && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground text-xs">Current Stage:</span>
                      <Badge variant="outline" className="text-xs">{apiResponse.currentStage}</Badge>
                    </div>
                  )}
                  {apiResponse.totalJobs !== undefined && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground text-xs">Jobs:</span>
                      <span className="text-xs">
                        {apiResponse.completedJobs || 0} / {apiResponse.totalJobs}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 에러 메시지 (있는 경우) */}
              {apiResponse.errorMessage && (
                <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-1.5">
                  <h3 className="text-xs font-semibold text-destructive">에러 메시지</h3>
                  <p className="text-xs text-destructive/90 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                    {apiResponse.errorMessage}
                  </p>
                </div>
              )}

              {/* AI Solution (있는 경우) */}
              {apiResponse.aiSolution && (
                <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3 space-y-1.5">
                  <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                    🤖 AI 솔루션 제안
                  </h3>
                  <p className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                    {apiResponse.aiSolution}
                  </p>
                </div>
              )}

              {/* Log URL (있는 경우) */}
              {apiResponse.logUrl && (
                <div className="rounded-md border p-3 space-y-1.5">
                  <h3 className="text-xs font-semibold">로그 링크</h3>
                  <a
                    href={apiResponse.logUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <span className="break-all">{apiResponse.logUrl}</span>
                  </a>
                </div>
              )}

              {/* Jobs 목록 (있는 경우) */}
              {apiResponse.jobs && Array.isArray(apiResponse.jobs) && apiResponse.jobs.length > 0 && (
                <div className="rounded-md border p-3 space-y-1.5">
                  <h3 className="text-xs font-semibold">Job 목록</h3>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {apiResponse.jobs.map((job: any, index: number) => (
                      <div
                        key={job.jobId || index}
                        className="flex items-center justify-between p-1.5 rounded bg-muted/50 text-xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs text-muted-foreground flex-shrink-0">#{index + 1}</span>
                          <span className="text-xs truncate">{job.name || job.jobId || `Job ${index + 1}`}</span>
                        </div>
                        <Badge
                          variant={getStatusVariant(job.status)}
                          className="text-xs flex-shrink-0"
                        >
                          {job.status || "unknown"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 전체 JSON 응답 */}
              <div className="rounded-md border p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold">전체 JSON 응답</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyJson}
                    className="h-6 text-xs px-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        복사
                      </>
                    )}
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100 max-h-48 overflow-y-auto">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* 데이터 없음 */}
          {!pipelineStatus && !error && !isLoading && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">파이프라인 데이터가 없습니다.</p>
              <p className="text-xs mt-1">새로고침 버튼을 눌러 데이터를 가져오세요.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

