"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart3,
  ImageIcon,
  LineChart,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface EnhanceWithVisualsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Topic or section title shown in the description */
  contextTitle: string;
}

export function EnhanceWithVisualsDialog({
  open,
  onOpenChange,
  contextTitle,
}: EnhanceWithVisualsDialogProps) {
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="min-w-0 max-w-[calc(100%-2rem)] overflow-hidden sm:max-w-md"
        showCloseButton
      >
        <DialogHeader className="min-w-0 space-y-0 text-left sm:text-left">
          <DialogTitle className="flex items-start gap-2 pr-8 font-heading leading-snug">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="min-w-0 break-words">
              Enhance with Visuals
              {contextTitle ? (
                <>
                  {" "}
                  <span className="font-normal text-muted-foreground">
                    · {contextTitle}
                  </span>
                </>
              ) : null}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid min-w-0 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-14 w-full min-w-0 shrink !whitespace-normal items-start justify-start gap-3 px-3 py-3 text-left font-normal"
            onClick={close}
          >
            <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="min-w-0 break-words text-sm font-medium text-foreground">
              Visual / Dynamic Chart
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-14 w-full min-w-0 shrink !whitespace-normal items-start justify-start gap-3 px-3 py-3 text-left font-normal"
            onClick={close}
          >
            <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="min-w-0 break-words text-sm font-medium text-foreground">
              Image
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-14 w-full min-w-0 shrink !whitespace-normal items-start justify-start gap-3 px-3 py-3 text-left font-normal"
            onClick={close}
          >
            <LineChart className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="min-w-0 break-words text-sm font-medium text-foreground">
              Graph
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full min-w-0 shrink !whitespace-normal items-start justify-start gap-3 px-3 py-3 text-left font-normal"
            onClick={close}
          >
            <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="flex min-w-0 flex-col gap-0.5 break-words text-left">
              <span className="text-sm font-medium text-foreground">
                Re-analyse & generate (this topic only)
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                Regenerate notes and visuals for this topic only—other topics in
                the workspace stay unchanged.
              </span>
            </span>
          </Button>
        </div>

        <DialogFooter className="gap-3 sm:justify-end">
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
