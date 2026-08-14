"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  CIRCLE_DAYS,
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
} from "@/lib/continuity-lab/schedule-trigger";
import {
  frequencyConfigRecord,
  frequencySummary,
} from "@/lib/continuity-lab/lab-schedules-runtime";
import type { LabScheduleFrequency } from "@/lib/continuity-lab/lab-schedules-types";
import { cn } from "@/lib/utils";

const applyButtonClass =
  "h-8 w-full rounded-md bg-[#2563EB] text-xs font-semibold text-white hover:bg-[#3B82F6]";

const pillBase =
  "inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-xs font-medium text-[#60A5FA] bg-[#2563EB]/20 hover:bg-[#2563EB]/28";

const popoverShell =
  "absolute left-0 top-full z-50 mt-1.5 w-[min(100vw-2rem,17.5rem)] rounded-md border border-white/10 bg-[#141416] p-3 shadow-lg";

function frequencyToConfig(frequency: LabScheduleFrequency): Record<string, string> {
  return frequencyConfigRecord(frequency);
}

function configToFrequency(config: Record<string, string>, prev: LabScheduleFrequency): LabScheduleFrequency {
  return {
    timezone: config.timezone ?? prev.timezone,
    hour: config.hour ?? prev.hour,
    minute: config.minute ?? prev.minute,
    interval: config.interval ?? prev.interval,
    intervalUnit: (config.intervalUnit as LabScheduleFrequency["intervalUnit"]) ?? prev.intervalUnit,
    repeatDays: config.repeatDays ?? prev.repeatDays,
    rrule: config.rrule ?? prev.rrule,
    cron: config.cron ?? prev.cron,
  };
}

function FrequencySchedulePanel({
  config,
  onApply,
}: {
  config: Record<string, string>;
  onApply: (patch: Record<string, string>) => void;
}) {
  const [tab, setTab] = useState<"visual" | "rrule">("visual");
  const timezone = config.timezone?.trim() || getBrowserTimezone();
  const timezoneLabel = formatTimezoneLabel(timezone);
  const hour = Number.parseInt(config.hour ?? "9", 10);
  const minute = Number.parseInt(config.minute ?? "0", 10);

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
  const [draftHour, setDraftHour] = useState(Number.isFinite(hour) ? hour : 9);
  const [draftMinute, setDraftMinute] = useState(Number.isFinite(minute) ? minute : 0);
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
      hour: String(draftHour),
      minute: String(draftMinute),
      rrule: buildRruleFromVisual({
        interval,
        intervalUnit,
        repeatDays: days,
        hour: String(draftHour),
        minute: String(draftMinute),
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
      hour: parsed.hour ?? String(draftHour),
      minute: parsed.minute ?? String(draftMinute),
      interval: parsed.interval ?? interval,
      intervalUnit: parsed.intervalUnit ?? intervalUnit,
    });
  }

  return (
    <>
      <div className="flex rounded-md bg-white/[0.05] p-0.5">
        {(["visual", "rrule"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 rounded px-2 py-1 text-xs font-semibold transition",
              tab === id ? "bg-[#2563EB] text-white" : "text-white/50 hover:text-white/70",
            )}
          >
            {id === "rrule" ? "Custom" : "Visual"}
          </button>
        ))}
      </div>

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
            <p className="text-xs text-white/50">
              Time ({timezoneLabel}) · {formatGmtOffset(timezone)}
            </p>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              <label className="text-[10px] text-white/45">
                Hour
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={draftHour}
                  onChange={(e) => setDraftHour(Number(e.target.value) || 0)}
                  className="mt-0.5 h-8 w-full rounded-md border border-white/10 bg-transparent px-2 text-xs text-white"
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
            placeholder="FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0"
            className="w-full resize-y rounded-md border border-white/10 bg-transparent px-2.5 py-2 font-mono text-xs leading-relaxed text-white placeholder:text-white/35 focus:border-[#2563EB]/50 focus:outline-none"
          />
          <p className="text-[11px] text-white/45">
            RFC 5545 RRULE. Applied summary: {scheduleChipSummary("schedule", config)}
          </p>
          <button type="button" onClick={applyRrule} className={applyButtonClass}>
            Apply
          </button>
        </div>
      )}
    </>
  );
}

export function ContinuityLabScheduleFrequencyField({
  frequency,
  onChange,
}: {
  frequency: LabScheduleFrequency;
  onChange: (next: LabScheduleFrequency) => void;
}) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const config = frequencyToConfig(frequency);
  const summary = frequencySummary({ type: "recurring", frequency });
  const chipLabel = scheduleChipSummary("schedule", config) || summary;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function applyConfig(patch: Record<string, string>) {
    const merged = mergeScheduleConfig("schedule", config, patch);
    onChange(configToFrequency(merged, frequency));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <p className="text-xs text-[#60A5FA]">{summary}</p>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(pillBase, "transition")}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="truncate">{chipLabel}</span>
        <ChevronDown className={cn("size-3 shrink-0 opacity-70 transition", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            exit={reduceMotion ? {} : { opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={popoverShell}
            role="dialog"
            aria-label="Schedule frequency"
          >
            <FrequencySchedulePanel config={config} onApply={applyConfig} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
