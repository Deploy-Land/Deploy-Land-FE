import { useState } from "react";
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

const endpointPath = "/api/status/{pipelineId}";

const errorResponseExample = `{
  "message": "Error: 'pipelineId' missing from path parameters."
}`;

export function CICDStatusModal() {
  const [copied, setCopied] = useState(false);

  const handleCopyFailure = async () => {
    try {
      await navigator.clipboard.writeText(errorResponseExample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className="text-lg px-8 py-6 border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          문서 보기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl sm:max-w-3xl">
        <DialogHeader className="space-y-2">
          <DialogTitle>CI/CD 상태 조회 API</DialogTitle>
          <DialogDescription>
            파이프라인 상태를 조회하기 위한 REST 엔드포인트 상세 정보입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm text-muted-foreground">
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
              유효한 <span className="font-medium">pipelineId</span>가 전달되고 DynamoDB에 해당 항목이 존재하는 경우,
              파이프라인의 현재 상태, 전체 Job 목록, 총 Job 개수를 포함한 모든 상태 정보를 JSON으로 반환합니다.
            </p>
          </section>

          <section className="space-y-2 text-foreground">
            <h3 className="text-sm font-semibold">정상 응답 포함 정보</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>파이프라인 전체 상태 요약</li>
              <li>각 Job의 세부 상태, 실행 순서 및 메타데이터</li>
              <li>전체 Job 개수와 완료 비율</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-3 text-foreground">
            <div>
              <h3 className="text-sm font-semibold">잘못된 요청 (400 Bad Request)</h3>
              <p className="text-sm text-muted-foreground">
                경로 파라미터에 <span className="font-medium">pipelineId</span>가 누락된 경우 아래와 같은 JSON 오류 응답이 반환됩니다.
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="w-fit"
              onClick={handleCopyFailure}
            >
              {copied ? "복사 완료" : "실패 응답 복사"}
            </Button>
            <pre className="overflow-x-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100">
{errorResponseExample}
            </pre>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}


