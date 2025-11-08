import { useState } from "react";
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

const endpointPath = "/api/status/{pipelineId}";

const errorResponseExample = `{
  "message": "Error: 'pipelineId' missing from path parameters."
}`;

export function CICDStatusModal() {
  const { t } = useTranslation();
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

          <section className="space-y-2 text-foreground">
            <h3 className="text-sm font-semibold">{t("modal.successSummary")}</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>{t("modal.successItem1")}</li>
              <li>{t("modal.successItem2")}</li>
              <li>{t("modal.successItem3")}</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-3 text-foreground">
            <div>
              <h3 className="text-sm font-semibold">{t("modal.failureTitle")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("modal.failureDescription")}
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="w-fit"
              onClick={handleCopyFailure}
            >
              {copied ? t("modal.copySuccess") : t("modal.copyFailure")}
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


