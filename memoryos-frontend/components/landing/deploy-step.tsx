"use client";

import React, { useState } from "react";
import { Cloud, ExternalLink, Rocket, Check, Cpu, Server, Radio, Bot, Send, Settings } from "lucide-react";
import { NvidiaLogo, RunPodLogo, ModalLogo, K8sFaviconLogo, HorosLogo, TeslaLogo, OneXLogo } from "@/components/horos/primitives/brand-icons";
type PlatformCategory = "computational" | "edge" | "physical" | "industrial";

interface TargetItem {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  gpus: string[];
}

export function DeployStep() {
  const [activeCategory, setActiveCategory] = useState<PlatformCategory>("computational");
  const [selectedTarget, setSelectedTarget] = useState<string>("horos");
  const [activeTab, setActiveTab] = useState<string>("dockerfile");

  const categories: { id: PlatformCategory; label: string; icon: React.ReactNode }[] = [
    { id: "computational", label: "Computational", icon: <Cloud size={11} /> },
    { id: "edge", label: "Edge", icon: <Radio size={11} /> },
    { id: "physical", label: "Physical", icon: <Bot size={11} /> },
    { id: "industrial", label: "Industrial", icon: <Settings size={11} /> },
  ];

  const targetsByCategory: Record<PlatformCategory, TargetItem[]> = {
    computational: [
      {
        id: "horos",
        name: "HOROS Cloud",
        desc: "Fully managed endpoint, auto-scaling",
        icon: <div className="flex items-center justify-center w-8 h-8 shrink-0"><HorosLogo size={32} /></div>,
        gpus: ["H100", "L40S", "A100", "L4"],
      },
      {
        id: "runpod",
        name: "Your RunPod",
        desc: "Deploy to your own RunPod account",
        icon: (
          <div className="flex items-center justify-center w-8 h-8 shrink-0">
            <RunPodLogo size={26} />
          </div>
        ),
        gpus: ["H100", "A100", "RTX 4090", "L40S"],
      },
      {
        id: "modal",
        name: "Your Modal",
        desc: "Deploy to your own Modal workspace",
        icon: (
          <div className="flex items-center justify-center w-8 h-8 shrink-0">
            <ModalLogo size={26} />
          </div>
        ),
        gpus: ["H100", "A100", "L40S", "T4"],
      },
      {
        id: "k8s-native",
        name: "Kubernetes (K8s)",
        desc: "Native Helm charts & custom operators",
        icon: (
          <div className="flex items-center justify-center w-8 h-8 text-[#326CE5] shrink-0">
            <K8sFaviconLogo size={26} />
          </div>
        ),
        gpus: ["L40S Pool", "A100 NVLink"],
      },
    ],
    edge: [
      {
        id: "jetson-orin",
        name: "NVIDIA Jetson AGX Orin",
        desc: "Real-time edge perception & inference",
        icon: (
          <div className="flex items-center justify-center w-8 h-8 text-[#76B900] shrink-0">
            <NvidiaLogo size={26} />
          </div>
        ),
        gpus: ["64GB Orin AGX", "275 TOPS"],
      },
      {
        id: "industrial-pc",
        name: "Local Gateway / IPC",
        desc: "On-site industrial compute node",
        icon: (
          <div className="flex items-center justify-center w-8 h-8 text-[#F0EFE2] shrink-0">
            <Radio size={22} />
          </div>
        ),
        gpus: ["RTX 4000 Ada", "Intel NUC"],
      },
      {
        id: "stream-aggregator",
        name: "Edge Stream Aggregator",
        desc: "RTSP / LiDAR real-time intake engine",
        icon: (
          <div className="flex items-center justify-center w-8 h-8 text-[#818CF8] shrink-0">
            <Radio size={22} />
          </div>
        ),
        gpus: ["Jetson Orin Nano", "30 FPS"],
      },
    ],
    physical: [
      {
        id: "vehicle-drive",
        name: "Autonomous Vehicles",
        desc: "In-vehicle NVIDIA DRIVE AGX & CAN-Bus",
        icon: (
          <div className="flex items-center justify-center w-8 h-8 text-[#F97316] shrink-0">
            <TeslaLogo size={26} />
          </div>
        ),
        gpus: ["DRIVE Orin Dual", "CAN-Bus v2"],
      },
      {
        id: "robotics-ros2",
        name: "Robotics (ROS 2)",
        desc: "On-robot workcell ROS 2 node controller",
        icon: (
          <div className="flex items-center justify-center w-8 h-8 text-[#C084FC] shrink-0">
            <OneXLogo size={26} />
          </div>
        ),
        gpus: ["ROS 2 Humble", "RealSense"],
      },
    ],
    industrial: [
      {
        id: "industrial-factory",
        name: "Industrial & Factories",
        desc: "Siemens PLC & SCADA safety gateway",
        icon: (
          <div className="flex items-center justify-center w-8 h-8 text-[#06B6D4] shrink-0">
            <Server size={22} />
          </div>
        ),
        gpus: ["S7-1500 PLC", "OPC-UA"],
      },
      {
        id: "energy-grid",
        name: "Energy Grid Controller",
        desc: "Smart grid load balancing unit",
        icon: (
          <div className="flex items-center justify-center w-8 h-8 text-[#75bf00] shrink-0">
            <Cpu size={22} />
          </div>
        ),
        gpus: ["Edge TPU", "RS-485"],
      },
    ],
  };

  const currentTargets = targetsByCategory[activeCategory];

  return (
    <div className="w-full h-full flex flex-col justify-between border border-dashed border-[#333333] p-6 lg:p-8 bg-[#151515] rounded-[1px] font-mono text-sm select-none">

      {/* Header Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-6 h-6 bg-[#162010] rounded-[1px] border border-[#2e4719] text-[#75bf00]">
              <Cloud size={13} strokeWidth={2.2} />
            </div>

            <span className="text-[#F0EFE2] font-medium text-[13px]">Deploy, Apply, or Actuate</span>
          </div>

          <div className="text-[10px] text-[#A3A3A3] px-2.5 py-0.5 rounded-[1px] bg-[#181818] border border-[#2a2a2a] flex items-center gap-1">
            <Check size={11} className="text-[#75bf00]" />
            ready
          </div>
        </div>

        <div className="text-[#C8C7BA] text-[11px] pl-8">
          Select target across Computational, Edge, Physical, or Industrial systems.
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#101010] border border-[#222222] rounded-[1px] mt-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setSelectedTarget(targetsByCategory[cat.id][0].id);
            }}
            className={`flex items-center justify-center gap-1.5 py-1 text-[10px] rounded-[1px] transition-colors ${
              activeCategory === cat.id
                ? "bg-[#202020] text-[#F0EFE2] font-medium border border-[#333333]"
                : "text-[#777777] hover:text-[#aaaaaa]"
            }`}
          >
            {cat.icon}
            <span className="truncate">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Target Section */}
      <div className="space-y-1.5 mt-2">
        <div className="flex items-center justify-between text-[9px] text-[#666666] uppercase tracking-wider font-semibold">
          <span>TARGET</span>
          <span>HARDWARE / GPUS</span>
        </div>

        <div className="border border-[#222222] bg-[#141414] rounded-[1px] divide-y divide-[#1c1c1c] overflow-hidden">
          {currentTargets.map((target) => (
            <div
              key={target.id}
              onClick={() => setSelectedTarget(target.id)}
              className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${
                selectedTarget === target.id
                  ? "bg-[#181a16] border-l-2 border-l-[#75bf00]"
                  : "hover:bg-[#161616]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {target.icon}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-[#F0EFE2]">{target.name}</span>
                  </div>
                  <div className="text-[9px] text-[#666666] truncate max-w-[200px]">
                    {target.desc}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {target.gpus.map((gpu) => (
                  <span
                    key={gpu}
                    className="flex items-center gap-1.5 text-[9px] px-2 py-1 rounded-[1px] bg-[#1b1b1b] border border-[#282828] text-[#999999]"
                  >
                    {gpu}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Artifact Section */}
      <div className="flex-1 flex flex-col mt-2 min-h-0">
        <div className="flex items-center justify-between pb-1.5">
          <span className="text-[10px] text-[#666666] uppercase tracking-wider font-semibold">
            GENERATED ARTIFACT
          </span>
          <div className="flex items-center gap-1.5">
            {["dockerfile", "servesh", "horosyaml"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] transition-colors ${
                  activeTab === tab
                    ? "px-2 py-0.5 rounded-[1px] bg-[#222222] text-[#d4d4d4] border border-[#333333]"
                    : "text-[#666666] hover:text-[#aaaaaa]"
                }`}
              >
                {tab === "dockerfile" ? "Dockerfile" : tab === "servesh" ? "serve.sh" : "horos.yaml"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-2.5 bg-[#0d0d0d] rounded-[1px] border border-[#1e1e1e] text-[11px] leading-[1.7] font-mono overflow-hidden text-[#d4d4d4]">
          <div className="flex"><span className="text-[#555555] select-none w-5 text-right mr-3 shrink-0">1</span><span>FROM horos/vllm:0.6.3-l40s</span></div>
          <div className="flex"><span className="text-[#555555] select-none w-5 text-right mr-3 shrink-0">2</span><span>ENV MODEL=Llama-3.1-8B-Instruct</span></div>
          <div className="flex"><span className="text-[#555555] select-none w-5 text-right mr-3 shrink-0">3</span><span>ENV QUANTIZATION=awq_marlin</span></div>
          <div className="flex"><span className="text-[#555555] select-none w-5 text-right mr-3 shrink-0">4</span><span>COPY ./weights /models</span></div>
          <div className="flex"><span className="text-[#555555] select-none w-5 text-right mr-3 shrink-0">5</span><span>CMD vllm serve $MODEL \</span></div>
          <div className="flex"><span className="text-[#555555] select-none w-5 text-right mr-3 shrink-0">6</span><span className="pl-4">--quantization awq_marlin \</span></div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#222222] mt-2">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-[#F0EFE2] font-medium">$0.12 / 1M</span>
          <span className="text-[#666666]">38ms p95</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-[1px] border border-[#333333] bg-[#1a1a1a] text-[10px] text-[#cccccc] hover:text-[#F0EFE2] hover:bg-[#252525] transition-colors">
            <ExternalLink size={10} className="text-[#C8C7BA]" />
            Apply Policy
          </button>

          {activeCategory === "physical" || activeCategory === "industrial" ? (
            <button className="flex items-center gap-1.5 px-3 py-1 rounded-[1px] bg-[#75bf00] text-black font-semibold text-[10px] hover:bg-[#86d900] transition-colors">
              <Send size={10} className="fill-black" />
              Actuate (Act)
            </button>
          ) : (
            <button className="flex items-center gap-1.5 px-3.5 py-1 rounded-[1px] bg-[#75bf00] text-black font-semibold text-[10px] hover:bg-[#86d900] transition-colors">
              <Rocket size={11} className="fill-black" />
              Deploy
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
