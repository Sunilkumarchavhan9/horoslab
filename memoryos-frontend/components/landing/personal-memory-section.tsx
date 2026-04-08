"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Reveal } from "./motion";

function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawMemoryCore(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  const starBack = new Path2D(
    "M162 170L144 297L120.5 170L0 59L120.5 116.5H158.5L255.5 59L162 170Z",
  );
  const starFront = new Path2D(
    "M117.5 127L135.5 0L159 127L279.5 238L159 180.5H121L24 238L117.5 127Z",
  );
  const starScale = 0.34;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale * starScale, scale * starScale);
  ctx.translate(-140, -148.5);

  const outerGlow = ctx.createRadialGradient(140, 148.5, 20, 140, 148.5, 92);
  outerGlow.addColorStop(0, "rgba(53,236,250,0.34)");
  outerGlow.addColorStop(0.45, "rgba(53,185,249,0.22)");
  outerGlow.addColorStop(1, "rgba(53,185,249,0)");
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(140, 148.5, 96, 0, Math.PI * 2);
  ctx.fill();

  const starGlow = ctx.createRadialGradient(140, 148.5, 10, 140, 148.5, 68);
  starGlow.addColorStop(0, "rgba(109,246,255,0.52)");
  starGlow.addColorStop(0.5, "rgba(53,236,250,0.22)");
  starGlow.addColorStop(1, "rgba(53,236,250,0)");
  ctx.fillStyle = starGlow;
  ctx.beginPath();
  ctx.arc(140, 148.5, 72, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "rgba(53,236,250,0.55)";
  ctx.shadowBlur = 28;
  const gradientBack = ctx.createLinearGradient(0, 59, 0, 297);
  gradientBack.addColorStop(0, "#35B9F9");
  gradientBack.addColorStop(1, "#35ECFA");
  ctx.fillStyle = gradientBack;
  ctx.fill(starBack);

  ctx.shadowColor = "rgba(53,236,250,0.7)";
  ctx.shadowBlur = 22;
  const gradientFront = ctx.createLinearGradient(0, 0, 0, 238);
  gradientFront.addColorStop(0, "#35ECFA");
  gradientFront.addColorStop(1, "#35B9F9");
  ctx.fillStyle = gradientFront;
  ctx.fill(starFront);
  ctx.restore();
}

function drawMiniTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  fill: string,
  stroke: string,
  kind: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.shadowColor = "rgba(0,0,0,0.26)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  roundedRect(ctx, -width / 2, -height / 2, width, height, Math.min(width, height) * 0.26);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.save();
  ctx.translate(0, 1);

  if (kind === "window") {
    roundedRect(ctx, -11, -9, 22, 18, 4);
    ctx.fillStyle = "#f4f8ff";
    ctx.fill();
    ctx.strokeStyle = "#c6d4e6";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#1b2432";
    roundedRect(ctx, -9, -7, 18, 10, 3);
    ctx.fill();
    ctx.fillStyle = "#2f80ff";
    ctx.fillRect(-7, -5, 14, 6);
    ctx.fillStyle = "#ff5353";
    ctx.fillRect(-11, 6, 22, 3);
  } else if (kind === "pdf") {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(-9, -10);
    ctx.lineTo(3, -10);
    ctx.lineTo(9, -4);
    ctx.lineTo(9, 10);
    ctx.lineTo(-9, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ff6159";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, -10);
    ctx.lineTo(3, -4);
    ctx.lineTo(9, -4);
    ctx.stroke();
    ctx.strokeStyle = "#ff6159";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-4, -1);
    ctx.lineTo(2, 5);
    ctx.moveTo(2, -1);
    ctx.lineTo(-4, 5);
    ctx.stroke();
  } else if (kind === "sheet") {
    ctx.fillStyle = "#ffffff";
    for (let row = -7; row <= 1; row += 4) {
      for (let col = -7; col <= 1; col += 4) {
        ctx.fillRect(col, row, 3, 3);
      }
    }
  } else if (kind === "x") {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(6, 6);
    ctx.moveTo(6, -6);
    ctx.lineTo(-6, 6);
    ctx.stroke();
  } else if (kind === "doc") {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(4, -5);
    ctx.moveTo(-5, -1);
    ctx.lineTo(5, -1);
    ctx.moveTo(-5, 3);
    ctx.lineTo(3, 3);
    ctx.stroke();
  } else if (kind === "web") {
    ctx.strokeStyle = "#0f1725";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.moveTo(-7, 0);
    ctx.lineTo(7, 0);
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 7);
    ctx.moveTo(-5, -5);
    ctx.lineTo(5, 5);
    ctx.moveTo(5, -5);
    ctx.lineTo(-5, 5);
    ctx.stroke();
  } else if (kind === "folder") {
    ctx.fillStyle = "#0f2944";
    roundedRect(ctx, -8, -2, 16, 8, 2);
    ctx.fill();
    ctx.fillStyle = "#73c1ff";
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(-2, -2);
    ctx.lineTo(0, -5);
    ctx.lineTo(5, -5);
    ctx.lineTo(8, -2);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "yt") {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.lineTo(5, 0);
    ctx.lineTo(-2, 5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}

function CaptureCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const nodes = [
      { kind: "window", color: "#ffffff", stroke: "#dfe5f0", angle: -2.35, radius: 108, w: 42, h: 42, rot: -0.18 },
      { kind: "sheet", color: "#25bf67", stroke: "#25bf67", angle: -1.5, radius: 104, w: 44, h: 44, rot: -0.02 },
      { kind: "x", color: "#080808", stroke: "#080808", angle: -0.78, radius: 108, w: 42, h: 42, rot: 0.12 },
      { kind: "doc", color: "#2f80ff", stroke: "#2f80ff", angle: 0.05, radius: 108, w: 42, h: 42, rot: 0.16 },
      { kind: "web", color: "#ffffff", stroke: "#dfe5f0", angle: 0.88, radius: 106, w: 42, h: 42, rot: 0.08 },
      { kind: "folder", color: "#5ab4ff", stroke: "#5ab4ff", angle: 1.55, radius: 98, w: 38, h: 38, rot: 0.04 },
      { kind: "yt", color: "#ff2020", stroke: "#ff2020", angle: 2.28, radius: 96, w: 38, h: 38, rot: 0.07 },
      { kind: "pdf", color: "#ffffff", stroke: "#ff6459", angle: 3.02, radius: 98, w: 40, h: 40, rot: -0.2 },
    ];

    let raf = 0;
    let ctx: CanvasRenderingContext2D | null = null;

    const render = (time: number) => {
      const width = canvas.clientWidth || 420;
      const height = canvas.clientHeight || 260;
      ctx = resizeCanvas(canvas, width, height);
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 - 4;
      const pulse = 1 + Math.sin(time / 900) * 0.045;

      const glow = ctx.createRadialGradient(cx, cy, 12, cx, cy, 112);
      glow.addColorStop(0, "rgba(66,223,255,0.40)");
      glow.addColorStop(0.46, "rgba(46,148,255,0.12)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 118, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(111,220,255,0.20)";
      ctx.lineWidth = 1.35;

      nodes.forEach((node, index) => {
        const drift = Math.sin(time / 820 + index * 0.7) * 4;
        const x = cx + Math.cos(node.angle) * (node.radius + drift);
        const y = cy + Math.sin(node.angle) * (node.radius + drift * 0.8);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();

        drawMiniTile(
          ctx,
          x,
          y,
          node.w,
          node.h,
          node.rot + Math.sin(time / 1400 + index) * 0.04,
          node.color,
          node.stroke,
          node.kind,
        );
      });

      drawMemoryCore(ctx, cx, cy, pulse);
      raf = window.requestAnimationFrame(render);
    };

    raf = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative mx-auto h-52 w-full max-w-[430px] overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

function MemoryGraphCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;

    const render = (time: number) => {
      const width = canvas.clientWidth || 430;
      const height = canvas.clientHeight || 260;
      const ctx = resizeCanvas(canvas, width, height);
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const topY = 30;
      const glowY = 118;
      const leftCardX = cx - 92;
      const rightCardX = cx + 18;
      const baseY = 140;
      const pulse = 1 + Math.sin(time / 950) * 0.035;

      const glow = ctx.createRadialGradient(cx, glowY, 18, cx, glowY, 118);
      glow.addColorStop(0, "rgba(57,112,255,0.52)");
      glow.addColorStop(0.4, "rgba(57,112,255,0.18)");
      glow.addColorStop(1, "rgba(57,112,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, glowY, 118 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(123,157,255,0.34)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 26, topY + 92);
      ctx.bezierCurveTo(cx - 22, glowY, cx - 52, glowY + 8, leftCardX + 68, baseY);
      ctx.moveTo(cx + 26, topY + 92);
      ctx.bezierCurveTo(cx + 22, glowY, cx + 52, glowY + 8, rightCardX + 68, baseY);
      ctx.stroke();

      const topFloat = Math.sin(time / 1200) * 3;
      ctx.save();
      ctx.translate(cx - 118, topY + topFloat);
      ctx.shadowColor = "rgba(0,0,0,0.36)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;
      roundedRect(ctx, 0, 0, 236, 96, 18);
      ctx.fillStyle = "#121923";
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = "#263244";
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = "#ff7e79";
      ctx.font = "700 10px Arial";
      ctx.fillText(".memory", 18, 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 14px Arial";
      ctx.fillText("Developer Profile Revision", 18, 40);
      ctx.fillStyle = "#75849b";
      ctx.font = "12px Arial";
      ctx.fillText("Trust timeline linked score updates,", 18, 60);
      ctx.fillText("revision reasons, and retrieval history.", 18, 76);
      ctx.fillStyle = "#63d5ff";
      ctx.font = "700 10px Arial";
      ctx.fillText("243 memory links", 18, 88);
      ctx.fillStyle = "#6c7a90";
      ctx.fillText("Live workspace", 160, 88);
      ctx.restore();

      [
        { x: leftCardX, text: "Resume recall linked to\nproject scoring signals", version: "v1" },
        { x: rightCardX, text: "Trust history explains why\nmemory changed over time", version: "v2" },
      ].forEach((card, index) => {
        const float = Math.sin(time / 900 + index * 0.9) * 2;
        ctx.save();
        ctx.translate(card.x, baseY + float);
        ctx.shadowColor = "rgba(0,0,0,0.34)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;
        roundedRect(ctx, 0, 0, 148, 74, 16);
        ctx.fillStyle = "#111924";
        ctx.fill();
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = "#1d3556";
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = "#d7e3f6";
        ctx.font = "12px Arial";
        const lines = card.text.split("\n");
        ctx.fillText(lines[0] ?? "", 12, 24);
        ctx.fillText(lines[1] ?? "", 12, 42);
        ctx.fillStyle = "#37d39a";
        ctx.font = "700 10px Arial";
        ctx.fillText(card.version, 12, 60);
        ctx.fillText("Latest", 108, 60);
        ctx.restore();
      });

      raf = window.requestAnimationFrame(render);
    };

    raf = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative mx-auto h-52 w-full max-w-[430px] overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

function QueryPreview() {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-4">
      {[
        "Summarize the key ideas from my MemoryOS notes",
        "Which memories connect retrieval and trust?",
        "What are the main themes across this workspace?",
      ].map((query) => (
        <div
          key={query}
          className="inline-flex w-[88%] items-center gap-3 rounded-full border border-[#1d4fb0] bg-[#0f1724] px-5 py-3 text-[14px] text-[#dce7fb]"
        >
          <span className="text-[#57a7ff]">Q</span>
          <span>{query}</span>
        </div>
      ))}
    </div>
  );
}

function ProjectBoards() {
  return (
    <div className="relative flex h-40 items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="relative h-32 w-52 rounded-[18px] border border-[#28384f] bg-[#171f2b] p-3 shadow-[0_14px_36px_rgba(0,0,0,0.3)]">
        <p className="text-[12px] text-[#d9e7ff]">MemoryOS / Retrieval</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 rounded-[8px] border border-[#2d3d57] bg-[#111927]">
              <div className="mx-2 mt-2 h-1 rounded bg-[#2b5fc6]" />
              <div className="mx-2 mt-2 h-1 rounded bg-[#24344d]" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute right-[18%] top-[26%] h-28 w-44 rotate-[6deg] rounded-[18px] border border-[#28384f] bg-[#171f2b]/90 p-3 shadow-[0_14px_36px_rgba(0,0,0,0.25)]">
        <p className="text-[12px] text-[#d9e7ff]">my g-docs</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-9 rounded-[8px] border border-[#2d3d57] bg-[#111927]">
              <div className="mx-2 mt-2 h-1 rounded bg-[#2b5fc6]" />
              <div className="mx-2 mt-2 h-1 rounded bg-[#24344d]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolPill({
  label,
  icon,
}: {
  label: string;
  icon: ReactNode;
}) {
  return (
    <span className="inline-flex h-16 min-w-16 items-center justify-center text-[#aebfd9] opacity-80 transition duration-300 hover:opacity-100 hover:text-[#f4f8ff] hover:[filter:drop-shadow(0_0_14px_rgba(84,200,255,0.38))]">
      <span className="grid h-[30px] place-items-center text-current transition duration-300 hover:scale-[1.06]">
        {icon}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function ClaudeMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[21px] w-[21px]" fill="none" aria-hidden="true">
      <g fill="#ff7043">
        <path d="m14.375 6.48l.49.28v.209l-.14.489l-5.937 1.397l-.558-1.387zm0 0" />
        <path d="m12.155 2.373l.683.143l.182.224l.173.535l-.072.342l-3.983 5.447L7.81 7.737l3.673-4.82z" />
        <path d="m8.719 1.522l.419-.28l.349.14l.349.49l-.957 5.748l-.65-.441l-.279-.769l.49-4.33z" />
        <path d="m4.239 1.614l.43-.55L4.95 1l.558.081l.275.216l2.004 4.442l.724 2.11l-.848.471l-3.231-5.864z" />
        <path d="m2.154 4.665l-.14-.56l.42-.488l.488.07h.14l2.933 2.165l.908.698l1.257.978l-.698 1.187l-.629-.489l-.419-.419l-4.05-2.863z" />
        <path d="M1.316 8.296L1 7.946v-.31l.316-.108l3.562.21l3.491.279l-.113.695l-6.66-.346z" />
        <path d="M3.411 11.931h-.698l-.278-.32v-.382l1.186-.838l4.82-3.068l.487.833z" />
        <path d="m4.738 13.883l-.28.07l-.418-.21l.07-.35l4.12-5.446l.558.768l-3.072 4.05z" />
        <path d="m8.23 14.581l-.21.28l-.419.14l-.349-.28l-.21-.42L8.09 8.646l.629.07z" />
        <path d="M11.791 13.045v.558l-.07.21l-.279.14l-.489-.066l-3.356-4.996l1.331-1.014l1.117 2.025l.105.733z" />
        <path d="m13.398 12.207l.07.349l-.21.279l-.21-.07l-1.187-.838l-1.815-1.606l-1.397-.978l.419-1.326l.698.419l.42.768z" />
        <path d="m12.49 8.645l1.746.14l.419.28l.279.418v.302l-.768.327l-3.911-.978l-1.606-.07l.419-1.466l1.117.838z" />
      </g>
    </svg>
  );
}

function CursorMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="m20.42 6.73l-8-4.62a.82.82 0 0 0-.83 0L3.58 6.73c-.22.12-.35.36-.35.61v9.32c0 .25.13.48.35.61l8.01 4.62c.26.15.57.15.83 0l8.01-4.62c.22-.12.35-.36.35-.61V7.34c0-.25-.13-.48-.35-.61Zm-.5.98L12.19 21.1c-.05.09-.19.05-.19-.05v-8.77c0-.18-.09-.34-.25-.43L4.16 7.47c-.09-.05-.05-.19.05-.19h15.46c.22 0 .36.24.25.43"
      />
    </svg>
  );
}

function VSCodeMark() {
  return (
    <svg viewBox="0 0 128 128" className="h-[21px] w-[21px]" fill="none" aria-hidden="true">
      <mask
        id="memoryos-vscode-mask"
        width="128"
        height="128"
        x="0"
        y="0"
        maskUnits="userSpaceOnUse"
        style={{ maskType: "alpha" }}
      >
        <path
          fill="#fff"
          fillRule="evenodd"
          d="M90.767 127.126a7.97 7.97 0 0 0 6.35-.244l26.353-12.681a8 8 0 0 0 4.53-7.209V21.009a8 8 0 0 0-4.53-7.21L97.117 1.12a7.97 7.97 0 0 0-9.093 1.548l-50.45 46.026L15.6 32.013a5.33 5.33 0 0 0-6.807.302l-7.048 6.411a5.335 5.335 0 0 0-.006 7.888L20.796 64 1.74 81.387a5.336 5.336 0 0 0 .006 7.887l7.048 6.411a5.33 5.33 0 0 0 6.807.303l21.974-16.68 50.45 46.025a8 8 0 0 0 2.743 1.793Zm5.252-92.183L57.74 64l38.28 29.058V34.943Z"
          clipRule="evenodd"
        />
      </mask>
      <g mask="url(#memoryos-vscode-mask)">
        <path
          fill="#0065A9"
          d="M123.471 13.82 97.097 1.12A7.97 7.97 0 0 0 88 2.668L1.662 81.387a5.333 5.333 0 0 0 .006 7.887l7.052 6.411a5.33 5.33 0 0 0 6.811.303l103.971-78.875c3.488-2.646 8.498-.158 8.498 4.22v-.306a8 8 0 0 0-4.529-7.208Z"
        />
        <path
          fill="#007ACC"
          d="m123.471 114.181-26.374 12.698A7.97 7.97 0 0 1 88 125.333L1.662 46.613a5.333 5.333 0 0 1 .006-7.887l7.052-6.411a5.33 5.33 0 0 1 6.811-.303l103.971 78.874c3.488 2.647 8.498.159 8.498-4.219v.306a8 8 0 0 1-4.529 7.208"
        />
        <path
          fill="#1F9CF0"
          d="M97.098 126.882A7.98 7.98 0 0 1 88 125.333c2.952 2.952 8 .861 8-3.314V5.98c0-4.175-5.048-6.266-8-3.313a7.98 7.98 0 0 1 9.098-1.549L123.467 13.8A8 8 0 0 1 128 21.01v85.982a8 8 0 0 1-4.533 7.21Z"
        />
      </g>
    </svg>
  );
}

function OpenCodeMark() {
  return (
    <Image
      src="/opencode.svg"
      alt=""
      width={132}
      height={21}
      className="h-[21px] w-auto opacity-90"
      aria-hidden="true"
    />
  );
}

function WindsurfMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M23.55 5.067a2.177 2.177 0 0 0-2.18 2.177v4.867a1.77 1.77 0 0 1-1.76 1.76a1.82 1.82 0 0 1-1.472-.766l-4.971-7.1a2.2 2.2 0 0 0-1.81-.942c-1.134 0-2.154.964-2.154 2.153v4.896c0 .972-.797 1.76-1.76 1.76c-.57 0-1.136-.287-1.472-.766L.408 5.16A.224.224 0 0 0 0 5.288v4.245c0 .215.066.423.188.6l5.475 7.818c.324.462.8.805 1.351.93a2.164 2.164 0 0 0 2.645-2.098V11.89c0-.972.787-1.76 1.76-1.76h.002a1.8 1.8 0 0 1 1.472.766l4.972 7.1a2.172 2.172 0 0 0 3.96-1.212v-4.895a1.76 1.76 0 0 1 1.76-1.76h.195a.22.22 0 0 0 .22-.22V5.287a.22.22 0 0 0-.22-.22Z"
      />
    </svg>
  );
}

function MoreMark() {
  return (
    <svg viewBox="0 0 64 18" className="h-[21px] w-auto" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.9 14c-2.7 0-4.9-2.2-4.9-5s2.2-5 4.9-5s4.9 2.2 4.9 5s-2.2 5-4.9 5m16.5-5c0 2.8-2.2 5-4.9 5s-4.9-2.2-4.9-5s2.2-5 4.9-5s4.9 2.2 4.9 5m11.5 5C32.2 14 30 11.8 30 9s2.2-5 4.9-5s4.9 2.2 4.9 5s-2.2 5-4.9 5m12.4-.3v-1.6h2.3V5.9h-2.3V4.3h6.5c3.2 0 5.3 1.8 5.3 4.7c0 2.9-2.1 4.7-5.3 4.7zm4.4-3.4h1.9c1.7 0 2.8-.9 2.8-2.5s-1.1-2.5-2.8-2.5h-1.9z"
      />
    </svg>
  );
}

function FeatureCard({
  visual,
  title,
  body,
}: {
  visual: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group overflow-hidden rounded-[22px] border border-[#18304f] bg-[#0d1219] shadow-[0_18px_48px_rgba(0,0,0,0.28)] transition duration-300 hover:border-[#244266] hover:shadow-[0_26px_56px_rgba(0,0,0,0.34)]">
      <div className="min-h-[300px] border-b border-[#172737] bg-[radial-gradient(circle_at_50%_42%,rgba(31,99,242,0.14),rgba(31,99,242,0)_58%),linear-gradient(180deg,#0c1118_0%,#0d131b_100%)] px-5 py-5">
        {visual}
      </div>
      <div className="px-7 py-7">
        <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-white md:text-[22px]">
          {title}
        </h3>
        <p className="mt-3 text-[16px] leading-8 text-[#9ba9bd]">{body}</p>
      </div>
    </div>
  );
}

export function PersonalMemorySection() {
  return (
    <section className="border-b border-[#c9d8ee] bg-[#0b1117] px-5 py-12 text-white">
      <Reveal className="mx-auto max-w-[980px] text-center">
        <div className="inline-flex items-center rounded-full border border-[#1d4fb0] bg-[rgba(20,35,58,0.78)] px-4 py-2 font-mono text-[12px] tracking-[0.08em] text-[#69a7ff]">
          MEMORYOS WORKSPACE MEMORY
        </div>
        <h2 className="mx-auto mt-7 max-w-[820px] text-[44px] font-semibold tracking-[-0.05em] text-white md:text-[64px]">
          One developer memory layer. Across every workflow.
        </h2>
        <p className="mx-auto mt-5 max-w-[760px] text-[22px] leading-[1.75] text-[#8797ae]">
          MemoryOS keeps project context, developer preferences, bug history, and architecture
          decisions available across IDEs, copilots, dashboards, and shared workspaces.
        </p>
      </Reveal>

      <Reveal delay={0.06} className="mx-auto mt-12 max-w-[860px] text-center">
        <p className="font-mono text-[13px] tracking-[0.24em] text-[#5e708a]">
          AVAILABLE ACROSS
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-12 md:gap-16">
          <ToolPill label="Claude" icon={<ClaudeMark />} />
          <ToolPill label="Cursor" icon={<CursorMark />} />
          <ToolPill label="VS Code" icon={<VSCodeMark />} />
          <ToolPill label="OpenCode" icon={<OpenCodeMark />} />
          <ToolPill label="Windsurf" icon={<WindsurfMark />} />
          <ToolPill label="More" icon={<MoreMark />} />
        </div>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-[1080px] gap-5 lg:grid-cols-2">
        <Reveal>
          <FeatureCard
            visual={<CaptureCanvas />}
            title="Capture developer context from anywhere"
            body="Save code findings, design decisions, debugging notes, docs, links, and task history from the tools developers already use every day."
          />
        </Reveal>
        <Reveal delay={0.05}>
          <FeatureCard
            visual={<MemoryGraphCanvas />}
            title="Turn scattered work into connected memory"
            body="MemoryOS links related context across sessions so retrieval, revisions, and continuity planning work from one connected memory graph."
          />
        </Reveal>
        <Reveal delay={0.08}>
          <FeatureCard
            visual={<QueryPreview />}
            title="Ask MemoryOS across everything you have stored"
            body="Query project memory directly and get answers grounded in prior work, documents, conversations, preferences, and technical decisions."
          />
        </Reveal>
        <Reveal delay={0.12}>
          <FeatureCard
            visual={<ProjectBoards />}
            title="Separate memory by workspace and project"
            body="Keep memory scoped to products, repos, teams, research tracks, or debugging streams so context stays clean, searchable, and reusable."
          />
        </Reveal>
      </div>

      <Reveal delay={0.16} className="mx-auto mt-14 max-w-[720px]">
        <div className="grid gap-6 border-t border-[#1b2b40] pt-10 text-center sm:grid-cols-3">
          {[
            ["Shared", "team memory"],
            ["Multi-tool", "integrations"],
            ["Fast", "context recall"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="text-[42px] font-semibold tracking-[-0.05em] text-white">{value}</p>
              <p className="mt-2 text-[18px] text-[#7f8fa7]">{label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
