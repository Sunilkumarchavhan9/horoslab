"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AutomationTrigger, AutomationTriggerType } from "@/lib/continuity-lab/automation-storage";
import {
  CIRCLE_DAYS,
  WEEKDAY_OPTIONS,
  buildRruleFromVisual,
  formatGmtOffset,
  formatTimePill,
  formatTimezoneLabel,
  getBrowserTimezone,
  mergeScheduleConfig,
  parseRruleToVisual,
  scheduleChipSummary,
  weekdayCodeFromConfig,
  type ScheduleIntervalUnit,
  type WeekdayCode,
} from "@/lib/continuity-lab/schedule-trigger";

const SCHEDULE_TYPES: AutomationTriggerType[] = [
  "schedule",
  "schedule_hourly",
  "schedule_daily",
  "schedule_weekly",
];

export function isScheduleTriggerType(type: AutomationTriggerType): boolean {
  return SCHEDULE_TYPES.includes(type);
}

type ScheduleTriggerRowProps = {
  trigger: AutomationTrigger;
  onRemove: () => void;
  onConfigPatch: (patch: Record<string, string>) => void;
};

function parseHourMinute(config: Record<string, string>): { hour: number; minute: number } {
  const hour = Number.parseInt(config.hour ?? "9", 10);
  const minute = Number.parseInt(config.minute ?? "0", 10);
  return {
    hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 9,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0,
  };
}

/** Compact schedule chip: blue text on translucent blue, compact radius. */
const pillBase =
  "inline-flex items-center gap-0.5 rounded-[5px] px-2 py-0.5 text-xs font-medium text-[#60A5FA] bg-[#2563EB]/20";

const rowShell =
  "flex items-center gap-2 rounded-md border border-white/[0.06] bg-[#1a1a1a] px-3 py-2";

const popoverShell =
  "absolute left-0 top-full z-40 mt-1.5 w-[min(100vw-2rem,17.5rem)] rounded-md border border-white/10 bg-[#141416] p-3 shadow-lg";

const applyButtonClass =
  "h-8 w-full rounded-md bg-[#2563EB] text-xs font-semibold text-white hover:bg-[#3B82F6]";

function SchedulePill({
  children,
  onClick,
  className,
  reduceMotion,
  tabular,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  reduceMotion: boolean | null;
  tabular?: boolean;
}) {
  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={!reduceMotion ? { opacity: 0.92 } : undefined}
        whileTap={!reduceMotion ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.1, ease: "easeOut" }}
        className={cn(pillBase, "hover:bg-[#2563EB]/28", tabular && "tabular-nums", className)}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <span className={cn(pillBase, tabular && "tabular-nums", className)}>{children}</span>
  );
}

function ScheduleRowText({ children }: { children: ReactNode }) {
  return <span className="text-xs text-white/50">{children}</span>;
}

export function ScheduleTriggerRow({ trigger, onRemove, onConfigPatch }: ScheduleTriggerRowProps) {
  const reduceMotion = useReducedMotion();
  const [weekdayOpen, setWeekdayOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const { hour, minute } = parseHourMinute(trigger.config);
  const tzLabel = formatGmtOffset(trigger.config.timezone);
  const weekdayCode = weekdayCodeFromConfig(trigger.config);
  const customConfigured = Boolean(trigger.config.rrule?.trim());

  const patch = useCallback(
    (next: Record<string, string>) => {
      onConfigPatch(mergeScheduleConfig(trigger.type, trigger.config, next));
    },
    [onConfigPatch, trigger.config, trigger.type],
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rowRef.current?.contains(e.target as Node)) {
        setWeekdayOpen(false);
        setTimeOpen(false);
        setCustomOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const customPillLabel = customConfigured
    ? scheduleChipSummary(trigger.type, trigger.config)
    : "Select schedule…";

  return (
    <div ref={rowRef} className={rowShell}>
      <Clock className="size-4 shrink-0 text-white/50" aria-hidden />

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {trigger.type === "schedule_hourly" ? (
          <SchedulePill reduceMotion={reduceMotion}>Every hour</SchedulePill>
        ) : null}

        {trigger.type === "schedule_daily" ? (
          <>
            <SchedulePill reduceMotion={reduceMotion}>Every day</SchedulePill>
            <ScheduleRowText>at</ScheduleRowText>
            <TimePillDropdown
              open={timeOpen}
              onOpenChange={setTimeOpen}
              hour={hour}
              minute={minute}
              reduceMotion={reduceMotion}
              onApply={(h, m) => patch({ hour: String(h), minute: String(m) })}
            />
            <ScheduleRowText>{tzLabel}</ScheduleRowText>
          </>
        ) : null}

        {trigger.type === "schedule_weekly" ? (
          <>
            <ScheduleRowText>Every week on</ScheduleRowText>
            <WeekdayPillDropdown
              open={weekdayOpen}
              onOpenChange={setWeekdayOpen}
              selected={weekdayCode}
              reduceMotion={reduceMotion}
              onSelect={(code) => patch({ dayOfWeek: code, repeatDays: code })}
            />
            <TimePillDropdown
              open={timeOpen}
              onOpenChange={setTimeOpen}
              hour={hour}
              minute={minute}
              reduceMotion={reduceMotion}
              onApply={(h, m) => patch({ hour: String(h), minute: String(m) })}
            />
            <ScheduleRowText>{tzLabel}</ScheduleRowText>
          </>
        ) : null}

        {trigger.type === "schedule" ? (
          <>
            <ScheduleRowText>Custom schedule</ScheduleRowText>
            <div className="relative">
              <SchedulePill
                reduceMotion={reduceMotion}
                onClick={() => setCustomOpen((open) => !open)}
              >
                {customPillLabel}
                <ChevronDown className="size-3 opacity-70" />
              </SchedulePill>
              <CustomSchedulePopover
                open={customOpen}
                config={trigger.config}
                reduceMotion={reduceMotion}
                onApply={(next) => {
                  patch(next);
                  setCustomOpen(false);
                }}
              />
            </div>
            {customConfigured ? <ScheduleRowText>{tzLabel}</ScheduleRowText> : null}
          </>
        ) : null}
      </div>

      <motion.button
        type="button"
        onClick={onRemove}
        whileHover={reduceMotion ? undefined : { opacity: 1 }}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        className="ml-auto shrink-0 rounded p-0.5 text-white/35 transition hover:text-white/55"
        aria-label="Remove schedule trigger"
      >
        <Trash2 className="size-3.5" />
      </motion.button>
    </div>
  );
}

function WeekdayPillDropdown({
  open,
  onOpenChange,
  selected,
  reduceMotion,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: WeekdayCode;
  reduceMotion: boolean | null;
  onSelect: (code: WeekdayCode) => void;
}) {
  const label = WEEKDAY_OPTIONS.find((d) => d.code === selected)?.fullLabel ?? "Monday";

  return (
    <div className="relative">
      <SchedulePill reduceMotion={reduceMotion} onClick={() => onOpenChange(!open)}>
        {label}
        <ChevronDown className="size-3 opacity-70" />
      </SchedulePill>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            exit={reduceMotion ? {} : { opacity: 0, y: -4 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="absolute left-0 z-30 mt-1 min-w-[9.25rem] overflow-hidden rounded-md border border-white/10 bg-[#0E0E10] py-0.5 shadow-lg"
          >
            {WEEKDAY_OPTIONS.map((day) => (
              <button
                key={day.code}
                type="button"
                onClick={() => {
                  onSelect(day.code);
                  onOpenChange(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs text-white/90 hover:bg-white/[0.06]"
              >
                {day.fullLabel}
                {selected === day.code ? <Check className="size-3.5 text-white" strokeWidth={2.5} /> : null}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function TimePillDropdown({
  open,
  onOpenChange,
  hour,
  minute,
  reduceMotion,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hour: number;
  minute: number;
  reduceMotion: boolean | null;
  onApply: (hour: number, minute: number) => void;
}) {
  const [draftHour, setDraftHour] = useState(hour);
  const [draftMinute, setDraftMinute] = useState(minute);

  return (
    <div className="relative">
      <SchedulePill
        reduceMotion={reduceMotion}
        tabular
        onClick={() => {
          if (!open) {
            setDraftHour(hour);
            setDraftMinute(minute);
          }
          onOpenChange(!open);
        }}
      >
        {formatTimePill(hour, minute)}
      </SchedulePill>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            exit={reduceMotion ? {} : { opacity: 0, y: -4 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="absolute left-0 z-30 mt-1 w-[10.5rem] rounded-md border border-white/10 bg-[#0E0E10] p-2.5 shadow-lg"
          >
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[10px] text-white/45">
                Hour
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={draftHour}
                  onChange={(e) => setDraftHour(Number(e.target.value) || 0)}
                  className="mt-1 h-7 w-full rounded-md border border-white/10 bg-transparent px-2 text-xs text-white"
                />
              </label>
              <label className="text-[10px] text-white/45">
                Minute
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={draftMinute}
                  onChange={(e) => setDraftMinute(Number(e.target.value) || 0)}
                  className="mt-1 h-7 w-full rounded-md border border-white/10 bg-transparent px-2 text-xs text-white"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                onApply(
                  Math.min(23, Math.max(0, draftHour)),
                  Math.min(59, Math.max(0, draftMinute)),
                );
                onOpenChange(false);
              }}
              className={cn(applyButtonClass, "mt-2")}
            >
              Apply
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CustomSchedulePopover({
  open,
  config,
  reduceMotion,
  onApply,
}: {
  open: boolean;
  config: Record<string, string>;
  reduceMotion: boolean | null;
  onApply: (patch: Record<string, string>) => void;
}) {
  const configKey = [
    config.rrule,
    config.interval,
    config.intervalUnit,
    config.repeatDays,
    config.hour,
    config.minute,
  ].join("|");

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key={configKey}
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          exit={reduceMotion ? {} : { opacity: 0, y: -4 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className={popoverShell}
          role="dialog"
          aria-label="Custom schedule"
        >
          <CustomSchedulePanel config={config} onApply={onApply} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ScheduleTabControl({
  tab,
  onTabChange,
}: {
  tab: "visual" | "rrule";
  onTabChange: (tab: "visual" | "rrule") => void;
}) {
  return (
    <div className="flex rounded-md bg-white/[0.05] p-0.5">
      {(["visual", "rrule"] as const).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={cn(
            "flex-1 rounded px-2 py-1 text-xs font-semibold transition",
            tab === id ? "bg-[#2563EB] text-white" : "text-white/50 hover:text-white/70",
          )}
        >
          {id === "rrule" ? "RRULE" : "Visual"}
        </button>
      ))}
    </div>
  );
}

function CustomSchedulePanel({
  config,
  onApply,
}: {
  config: Record<string, string>;
  onApply: (patch: Record<string, string>) => void;
}) {
  const [tab, setTab] = useState<"visual" | "rrule">("visual");
  const timezone = config.timezone?.trim() || getBrowserTimezone();
  const timezoneLabel = formatTimezoneLabel(timezone);
  const { hour: initHour, minute: initMinute } = parseHourMinute(config);

  const [interval, setInterval] = useState(config.interval ?? "1");
  const [intervalUnit, setIntervalUnit] = useState<ScheduleIntervalUnit>(
    (config.intervalUnit as ScheduleIntervalUnit) ?? "week",
  );
  const [repeatDays, setRepeatDays] = useState<string[]>(() =>
    (config.repeatDays ?? weekdayCodeFromConfig(config))
      .split(",")
      .map((d) => d.trim().toUpperCase())
      .filter(Boolean),
  );
  const [hour, setHour] = useState(initHour);
  const [minute, setMinute] = useState(initMinute);
  const [rruleDraft, setRruleDraft] = useState(config.rrule ?? buildRruleFromVisual(config));

  function toggleDay(code: string) {
    setRepeatDays((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code],
    );
  }

  function applyVisual() {
    const days = repeatDays.length > 0 ? repeatDays.join(",") : "MO";
    onApply({
      timezone,
      interval,
      intervalUnit,
      repeatDays: days,
      dayOfWeek: repeatDays[0] ?? "MO",
      hour: String(hour),
      minute: String(minute),
      rrule: buildRruleFromVisual({
        interval,
        intervalUnit,
        repeatDays: days,
        hour: String(hour),
        minute: String(minute),
      }),
    });
  }

  function applyRrule() {
    const parsed = parseRruleToVisual(rruleDraft);
    const days = parsed.repeatDays ?? parsed.dayOfWeek ?? "MO";
    onApply({
      timezone,
      rrule: rruleDraft.trim().toUpperCase(),
      ...parsed,
      repeatDays: days,
      hour: parsed.hour ?? String(hour),
      minute: parsed.minute ?? String(minute),
      interval: parsed.interval ?? interval,
      intervalUnit: parsed.intervalUnit ?? intervalUnit,
    });
  }

  return (
    <>
      <ScheduleTabControl tab={tab} onTabChange={setTab} />

      {tab === "visual" ? (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-xs text-white/50">Repeat every</p>
            <div className="mt-1 flex gap-1.5">
              <input
                type="number"
                min={1}
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="h-8 w-12 rounded-md border border-white/10 bg-transparent px-1.5 text-xs text-white"
              />
              <select
                value={intervalUnit}
                onChange={(e) => setIntervalUnit(e.target.value as ScheduleIntervalUnit)}
                className="h-8 min-w-0 flex-1 rounded-md border border-white/10 bg-transparent px-2 text-xs capitalize text-white"
              >
                <option value="hour">Hour</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
              </select>
            </div>
          </div>

          {intervalUnit === "week" ? (
            <div>
              <p className="text-xs text-white/50">Repeat on</p>
              <div className="mt-1.5 flex justify-between gap-0.5">
                {CIRCLE_DAYS.map((day) => {
                  const selected = repeatDays.includes(day.code);
                  return (
                    <button
                      key={day.code}
                      type="button"
                      onClick={() => toggleDay(day.code)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-[11px] font-semibold transition",
                        selected
                          ? "bg-[#2563EB] text-white"
                          : "bg-white/[0.06] text-white/50 hover:bg-white/10",
                      )}
                      aria-pressed={selected}
                    >
                      {day.circle}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-xs text-white/50">Time ({timezoneLabel})</p>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              <label className="text-[10px] text-white/45">
                Hour
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value) || 0)}
                  className="mt-0.5 h-8 w-full rounded-md border border-white/10 bg-transparent px-2 text-xs text-white"
                />
              </label>
              <label className="text-[10px] text-white/45">
                Minute
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value) || 0)}
                  className="mt-0.5 h-8 w-full rounded-md border border-white/10 bg-transparent px-2 text-xs text-white"
                />
              </label>
            </div>
          </div>

          <button type="button" onClick={applyVisual} className={applyButtonClass}>
            Apply
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <textarea
            value={rruleDraft}
            onChange={(e) => setRruleDraft(e.target.value)}
            rows={3}
            placeholder="FREQ=WEEKLY;BYDAY=MO;BYHOUR=3;BYMINUTE=30"
            className="w-full resize-y rounded-md border border-white/10 bg-transparent px-2.5 py-2 font-mono text-xs leading-relaxed text-white placeholder:text-white/35 focus:border-[#2563EB]/50 focus:outline-none"
          />
          <p className="text-[11px] text-white/45">RFC 5545 RRULE in UTC.</p>
          <button type="button" onClick={applyRrule} className={applyButtonClass}>
            Apply
          </button>
        </div>
      )}
    </>
  );
}
