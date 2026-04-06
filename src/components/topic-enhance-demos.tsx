"use client";

import type { LucideIcon } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import type { EnhanceVisualMode } from "@/components/enhance-with-visuals-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  ImageIcon,
  LineChart,
  RefreshCw,
  X,
} from "lucide-react";

const DEMO_ORDER: EnhanceVisualMode[] = [
  "chart",
  "image",
  "graph",
  "reanalyse",
];

/** Stable integer seed per topic for reproducible AI sample images (Pollinations). */
function topicSeed(topicName: string): number {
  let h = 0;
  for (let i = 0; i < topicName.length; i++) {
    h = (Math.imul(31, h) + topicName.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Pollinations image API — no API key; generates an image from the prompt.
 * @see https://github.com/pollinations/pollinations/blob/master/APIDOCS.md
 */
function aiSampleImageUrl(topicName: string): string {
  const t = topicName.trim() || "study topic";
  const prompt = [
    "Educational illustration for:",
    t + ".",
    "Modern learning-app style, cohesive colors, one clear focal subject,",
    "sharp focus, clean edges, no text or letters in the picture.",
  ].join(" ");
  const encoded = encodeURIComponent(prompt.slice(0, 900));
  const seed = topicSeed(t);
  /* 1280×720 (16:9) — sharper when scaled down; matches frame aspect */
  return `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true&seed=${seed}`;
}

function DemoShell({
  label,
  icon: Icon,
  children,
  onRemove,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/[0.06] to-transparent p-4 ring-1 ring-primary/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-medium text-foreground">
            {label}
          </span>
          <Badge variant="secondary" className="text-[10px] font-normal">
            Demo
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {children}
    </div>
  );
}

function DynamicChartDemo({ topicName }: { topicName: string }) {
  /** Heights 0–100: share of the fixed plot area (demo data). */
  const bars = [
    { label: "Recall", h: 72 },
    { label: "Apply", h: 55 },
    { label: "Analyze", h: 88 },
    { label: "Synthesize", h: 40 },
  ];
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Sample skill emphasis for{" "}
        <span className="font-medium text-foreground">{topicName}</span>{" "}
        (interactive in production).
      </p>
      <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
        {/* Plot area has explicit height so bar % heights resolve correctly */}
        <div className="flex h-32 items-stretch justify-between gap-1.5 sm:gap-2">
          {bars.map((b) => (
            <div
              key={b.label}
              className="flex min-h-0 min-w-0 flex-1 flex-col justify-end"
            >
              <div
                className="mx-auto w-full max-w-[3rem] rounded-t-md bg-primary shadow-sm transition-all hover:bg-primary/90"
                style={{ height: `${b.h}%` }}
                title={`${b.label}: ${b.h}%`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between gap-1.5 border-t border-border/40 pt-2 sm:gap-2">
          {bars.map((b) => (
            <span
              key={b.label}
              className="min-w-0 flex-1 text-center text-[10px] leading-tight text-muted-foreground"
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImageDemo({ topicName }: { topicName: string }) {
  const [failed, setFailed] = useState(false);
  const src = aiSampleImageUrl(topicName);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        AI-generated sample (Pollinations). First load can take a few seconds;
        replace with your image API in production.
      </p>
      <div className="overflow-hidden rounded-lg border border-border/50 bg-muted">
        {failed ? (
          <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-primary/15 via-muted/80 to-primary/10 p-6">
            <div className="text-center">
              <ImageIcon className="mx-auto mb-2 h-10 w-10 text-primary/50" />
              <p className="text-sm font-medium text-foreground/90">{topicName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Could not load AI preview · try again later
              </p>
            </div>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- remote AI image URL; no Next Image remote config
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img
              src={src}
              alt={`AI-generated concept illustration for ${topicName} (demo)`}
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-contain object-center"
              onError={() => setFailed(true)}
            />
          </div>
        )}
        <p className="border-t border-border/40 px-3 py-2 text-center text-[10px] text-muted-foreground">
          <ImageIcon className="mr-1 inline-block h-3 w-3 align-text-bottom text-primary/70" />
          {topicName} · AI-generated sample
        </p>
      </div>
    </div>
  );
}

function GraphDemo({ topicName }: { topicName: string }) {
  const gradId = useId().replace(/[^a-zA-Z0-9_-]/g, "") || "gfill";
  const points = [20, 45, 35, 62, 48, 78, 65];
  const w = 320;
  const h = 112;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const padX = 12;
  const padY = 10;
  const plotBottom = h - 22;
  const plotTop = padY;
  const plotH = plotBottom - plotTop;
  const step = (w - padX * 2) / (points.length - 1);
  const d = points
    .map((p, i) => {
      const x = padX + i * step;
      const y =
        plotBottom - ((p - min) / (max - min || 1)) * plotH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const lastX = padX + (points.length - 1) * step;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Trend of practice score over sessions for{" "}
        <span className="font-medium text-foreground">{topicName}</span>.
      </p>
      <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="block h-32 w-full min-h-32 text-primary sm:h-36"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Line graph of practice scores for ${topicName}`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* subtle grid */}
          {[0, 0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1={padX}
              x2={w - padX}
              y1={plotTop + t * plotH}
              y2={plotTop + t * plotH}
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeWidth={1}
            />
          ))}
          {/* baseline */}
          <line
            x1={padX}
            x2={w - padX}
            y1={plotBottom}
            y2={plotBottom}
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeWidth={1.5}
          />
          <path
            d={`${d} L ${lastX} ${plotBottom} L ${padX} ${plotBottom} Z`}
            fill={`url(#${gradId})`}
          />
          <path
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => {
            const x = padX + i * step;
            const y =
              plotBottom - ((p - min) / (max - min || 1)) * plotH;
            return (
              <circle key={i} cx={x} cy={y} r="5" className="fill-primary" />
            );
          })}
          {/* session labels */}
          <g className="text-[9px] text-muted-foreground [&_text]:fill-current">
            {points.map((_, i) => {
              const x = padX + i * step;
              return (
                <text key={i} x={x} y={h - 4} textAnchor="middle">
                  S{i + 1}
                </text>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

function ReanalyseDemo({ topicName }: { topicName: string }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Simulated regeneration scoped to this topic only (other topics
        unchanged).
      </p>
      <ul className="space-y-2 text-sm text-foreground">
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>
            Tightened summary for{" "}
            <span className="font-medium">{topicName}</span> with clearer
            definitions.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>
            Added one comparison table and a short “common pitfalls” note.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>
            Suggested 3 review questions aligned with your last quiz settings.
          </span>
        </li>
      </ul>
    </div>
  );
}

interface TopicEnhanceDemosProps {
  topicName: string;
  modes: EnhanceVisualMode[];
  onRemove: (mode: EnhanceVisualMode) => void;
}

export function TopicEnhanceDemos({
  topicName,
  modes,
  onRemove,
}: TopicEnhanceDemosProps) {
  if (modes.length === 0) return null;

  const sorted = [...modes].sort(
    (a, b) => DEMO_ORDER.indexOf(a) - DEMO_ORDER.indexOf(b)
  );

  return (
    <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Enhanced visuals
      </p>
      {sorted.map((mode) => {
        switch (mode) {
          case "chart":
            return (
              <DemoShell
                key="chart"
                label="Visual / Dynamic Chart"
                icon={BarChart3}
                onRemove={() => onRemove("chart")}
              >
                <DynamicChartDemo topicName={topicName} />
              </DemoShell>
            );
          case "image":
            return (
              <DemoShell
                key="image"
                label="Image"
                icon={ImageIcon}
                onRemove={() => onRemove("image")}
              >
                <ImageDemo topicName={topicName} />
              </DemoShell>
            );
          case "graph":
            return (
              <DemoShell
                key="graph"
                label="Graph"
                icon={LineChart}
                onRemove={() => onRemove("graph")}
              >
                <GraphDemo topicName={topicName} />
              </DemoShell>
            );
          case "reanalyse":
            return (
              <DemoShell
                key="reanalyse"
                label="Re-analyse & generate"
                icon={RefreshCw}
                onRemove={() => onRemove("reanalyse")}
              >
                <ReanalyseDemo topicName={topicName} />
              </DemoShell>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
