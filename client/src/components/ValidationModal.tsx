import { useState, useEffect, useCallback, useRef } from "react";
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
import { ExternalLink, Copy, Check, Loader2, X } from "lucide-react";
import { callValidationWebhook } from "@/lib/api/cicd";
import type { ValidationWebhookResponse } from "@/types/cicd";

interface ValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValidationComplete?: (beanstalkUrl?: string) => void;
}

export function ValidationModal({
  open,
  onOpenChange,
  onValidationComplete,
}: ValidationModalProps) {
  const [validationResult, setValidationResult] =
    useState<ValidationWebhookResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);
  const hasValidatedRef = useRef(false);

  const handleValidation = useCallback(async () => {
    if (isLoading) return; // 이미 로딩 중이면 중복 호출 방지
    
    setIsLoading(true);
    setError(null);
    setValidationResult(null);
    hasValidatedRef.current = true;

    try {
      console.log("🔍 벨리데이션 웹훅 호출 시작...");
      const result = await callValidationWebhook({});
      console.log("✅ 벨리데이션 웹훅 응답:", result);
      setValidationResult(result);
      onValidationComplete?.(result.beanstalkUrl);
    } catch (err) {
      console.error("❌ 벨리데이션 웹훅 호출 실패:", err);
      const errorMessage =
        err instanceof Error ? err : new Error(String(err));
      setError(errorMessage);
      onValidationComplete?.(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onValidationComplete]);

  // 모달이 열릴 때 벨리데이션 웹훅 호출
  useEffect(() => {
    if (open && !hasValidatedRef.current && !isLoading) {
      handleValidation();
    }
    // 모달이 닫힐 때 상태 초기화 (다음 호출을 위해)
    if (!open) {
      setValidationResult(null);
      setError(null);
      setCopied(false);
      hasValidatedRef.current = false;
    }
  }, [open, handleValidation, isLoading]);

  const handleCopyUrl = async () => {
    if (validationResult?.beanstalkUrl) {
      try {
        await navigator.clipboard.writeText(validationResult.beanstalkUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("URL 복사 실패:", err);
      }
    }
  };

  const handleRetry = () => {
    setValidationResult(null);
    setError(null);
    handleValidation();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 flex flex-col">
        <DialogHeader className="space-y-1 flex-shrink-0">
          <DialogTitle className="text-xl font-bold">
            🚀 벨리데이션 결과
          </DialogTitle>
          <DialogDescription className="text-sm">
            Beanstalk 환경 URL 검증 결과를 확인하세요
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-sm text-muted-foreground">
                Beanstalk 환경 URL을 가져오는 중...
              </p>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !isLoading && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-destructive">
                  ❌ 벨리데이션 실패
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  className="text-xs h-7"
                >
                  다시 시도
                </Button>
              </div>
              <p className="text-sm text-destructive/90 break-words">
                {error.message}
              </p>
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  상세 정보
                </summary>
                <pre className="mt-2 p-2 bg-destructive/5 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                  {JSON.stringify({ error: error.message }, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* 성공 상태 */}
          {validationResult && !isLoading && !error && (
            <div className="space-y-4">
              {/* 메시지 */}
              <div className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600">
                    성공
                  </Badge>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    {validationResult.message}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Beanstalk URL */}
              {validationResult.beanstalkUrl && (
                <div className="rounded-md border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      🌐 Beanstalk 환경 URL
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyUrl}
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
                          URL 복사
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <a
                      href={validationResult.beanstalkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {validationResult.beanstalkUrl}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        window.open(validationResult.beanstalkUrl, "_blank");
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <ExternalLink className="h-3 w-3" />
                      새 창에서 열기
                    </Button>
                  </div>
                </div>
              )}

              {/* 전체 응답 (개발 모드) */}
              {import.meta.env.DEV && (
                <div className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold">전체 응답 (개발 모드)</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            JSON.stringify(validationResult, null, 2)
                          );
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (err) {
                          console.error("복사 실패:", err);
                        }
                      }}
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
                    {JSON.stringify(validationResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* 초기 상태 */}
          {!isLoading && !error && !validationResult && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">벨리데이션을 시작하려면 아래 버튼을 클릭하세요.</p>
              <Button
                onClick={handleValidation}
                className="mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    검증 중...
                  </>
                ) : (
                  "벨리데이션 시작"
                )}
              </Button>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t flex-shrink-0">
          {error && (
            <Button variant="outline" onClick={handleRetry} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  재시도 중...
                </>
              ) : (
                "다시 시도"
              )}
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} variant="default">
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

