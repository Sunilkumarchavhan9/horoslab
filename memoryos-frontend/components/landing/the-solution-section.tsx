"use client";

import { motion } from "framer-motion";
import {
  Database, Server, Workflow, Activity,
  Settings, User, Box, Truck, Factory,
  PieChart, Network, Layers, Code, Zap
} from "lucide-react";

export function TheSolutionSection() {
  return (
    <section className="relative w-full bg-[#f8fafc] border-b border-slate-200 overflow-hidden py-32 flex flex-col font-sans min-h-[1200px] items-center justify-center">

      {/* Background Noise & Gradient */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-slate-50/50 to-slate-100/50"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-multiply"></div>
      </div>

      {/* Header */}
      <div className="relative z-20 text-center mb-16 space-y-4 max-w-2xl px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-mono uppercase tracking-widest shadow-sm">
          <Zap size={14} className="text-emerald-500" /> The MemoryOS Architecture
        </div>
        <h2 className="mt-16 mb-16 text-3xl md:text-4xl lg:text-5xl font-medium text-slate-900 tracking-tight leading-tight text-center px-4">
          A truly unified operating system <br /> for <span className="text-emerald-500">agentic workflows.</span>
        </h2>
      </div>

      {/* Isometric 3D Canvas */}
      <div className="relative z-10 w-full max-w-[1200px] h-[900px] flex items-center justify-center perspective-[2000px]">

        {/* The Rotated World */}
        <div
          className="relative w-[800px] h-[800px] transform-style-3d"
          style={{
            transform: 'rotateX(55deg) rotateZ(-45deg)',
            transformStyle: 'preserve-3d'
          }}
        >

          {/* SVG Wires (Data Streams) - Drawn inside the 3D world */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'translateZ(-1px)' }}>
            <defs>
              <linearGradient id="wire-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Ontology to Analytics */}
            <WirePath d="M 250,300 C 250,200 150,250 150,150" delay={0} />
            <WirePath d="M 300,300 C 300,200 180,250 180,150" delay={0.2} />
            <WirePath d="M 350,300 C 350,200 210,250 210,150" delay={0.4} />

            {/* Ontology to Workflows */}
            <WirePath d="M 400,300 L 400,150" delay={0.1} />
            <WirePath d="M 450,300 L 450,150" delay={0.3} />
            <WirePath d="M 350,300 L 350,150" delay={0.5} />

            {/* Ontology to Integrations */}
            <WirePath d="M 550,300 C 550,200 650,250 650,150" delay={0.2} />
            <WirePath d="M 500,300 C 500,200 620,250 620,150" delay={0.4} />
            <WirePath d="M 450,300 C 450,200 590,250 590,150" delay={0.6} />

            {/* Data to Ontology */}
            <WirePath d="M 200,600 C 200,500 300,550 300,450" delay={0} />
            <WirePath d="M 250,600 C 250,500 350,550 350,450" delay={0.3} />
            <WirePath d="M 300,600 C 300,500 400,550 400,450" delay={0.6} />

            {/* Models to Ontology */}
            <WirePath d="M 600,600 C 600,500 500,550 500,450" delay={0.1} />
            <WirePath d="M 550,600 C 550,500 450,550 450,450" delay={0.4} />
            <WirePath d="M 500,600 C 500,500 400,550 400,450" delay={0.7} />
          </svg>

          {/* TOP ROW: Analytics, Workflows, Integrations */}
          <div className="absolute top-0 left-0 w-full flex justify-between h-[150px]">
            {/* Analytics */}
            <IsometricPlane title="Analytics" className="w-[200px] h-[150px] flex items-center justify-center p-4">
              <div className="w-full h-full border border-emerald-100 bg-emerald-50/50 rounded flex flex-col gap-2 p-2">
                <div className="flex gap-1 h-1/2 items-end">
                  <div className="w-1/4 h-[40%] bg-slate-200"></div>
                  <div className="w-1/4 h-[70%] bg-emerald-300"></div>
                  <div className="w-1/4 h-[100%] bg-slate-200"></div>
                  <div className="w-1/4 h-[60%] bg-slate-200"></div>
                </div>
                <div className="h-1/2 w-full border-t border-slate-200 relative pt-1">
                  <PieChart size={24} className="text-emerald-500 mx-auto" />
                </div>
              </div>
            </IsometricPlane>

            {/* Workflows */}
            <IsometricPlane title="Workflows" className="w-[240px] h-[150px] p-4">
              <div className="w-full h-full border border-slate-200 bg-slate-50 rounded flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-16 h-6 border border-emerald-500 bg-emerald-50 rounded mb-4 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 border border-slate-300 bg-white rounded"></div>
                  <div className="w-8 h-8 border border-slate-300 bg-white rounded"></div>
                  <div className="w-8 h-8 border border-slate-300 bg-white rounded"></div>
                </div>
                {/* Flow lines */}
                <svg className="absolute inset-0 w-full h-full" style={{ stroke: '#cbd5e1', strokeWidth: 2, fill: 'none' }}>
                  <path d="M 120,40 L 120,60 L 60,60 L 60,80" />
                  <path d="M 120,40 L 120,60 L 180,60 L 180,80" />
                  <path d="M 120,40 L 120,80" />
                </svg>
              </div>
            </IsometricPlane>

            {/* Integrations */}
            <IsometricPlane title="Integrations" className="w-[200px] h-[150px] p-4">
              <div className="w-full h-full border border-slate-200 bg-slate-50 rounded grid grid-cols-2 gap-2 p-2 relative">
                <div className="border border-slate-200 bg-white rounded flex items-center justify-center"><Code size={16} className="text-slate-600" /></div>
                <div className="border border-slate-200 bg-white rounded flex items-center justify-center"><Network size={16} className="text-slate-600" /></div>
                <div className="border border-emerald-200 bg-emerald-50 rounded flex items-center justify-center"><Settings size={16} className="text-emerald-500" /></div>
                <div className="border border-slate-200 bg-white rounded flex items-center justify-center"><Database size={16} className="text-slate-600" /></div>
              </div>
            </IsometricPlane>
          </div>


          {/* MIDDLE ROW: Ontology Layer */}
          <div className="absolute top-[250px] left-0 w-full h-[300px]">
            <IsometricPlane title="Ontology" className="w-full h-full p-8 relative">

              {/* Network Grid Background */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]"></div>

              {/* Nodes and Links */}
              <div className="relative w-full h-full">

                {/* Internal Wires */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4' }}>
                  <path d="M 150,70 L 350,150 L 600,100" />
                  <path d="M 350,150 L 500,250 L 650,200" />
                  <path d="M 150,70 L 200,200 L 500,250" />
                  <path d="M 350,150 L 200,200" />
                </svg>

                {/* Nodes */}
                <OntologyNode x={150} y={70} icon={Factory} label="Factory" active />
                <OntologyNode x={350} y={150} icon={User} label="Customer" badge="Records" active />
                <OntologyNode x={600} y={100} icon={Database} label="Inventory" />

                <OntologyNode x={200} y={200} icon={Box} label="Shipment" badge="Produces" />
                <OntologyNode x={500} y={250} icon={Truck} label="Logistics" badge="Transports" active />
                <OntologyNode x={650} y={200} icon={Activity} label="Finance" />

                {/* Asset Panel (Floating above plane, counter-rotated) */}
                <div
                  className="absolute left-[-40px] top-[150px] bg-white border border-slate-300 shadow-xl rounded-lg p-3 w-[160px] text-xs font-mono text-slate-600"
                  style={{ transform: 'rotateZ(45deg) rotateX(-55deg)', transformOrigin: 'center' }}
                >
                  <div className="font-medium text-slate-800 border-b border-slate-200 pb-2 mb-2">ASSET #731</div>
                  <div className="flex justify-between mb-1"><span>Engineer</span><span className="text-slate-800">J. Simmons</span></div>
                  <div className="flex justify-between mb-1"><span>Region</span><span className="text-slate-800">JP14</span></div>
                  <div className="flex justify-between mb-2"><span>Location</span><span className="text-slate-800">39.414°</span></div>
                  <div className="flex justify-between items-center bg-emerald-50 px-2 py-1 rounded text-emerald-700 font-medium">
                    <span>Health</span>
                    <span className="text-lg">89%</span>
                  </div>
                </div>

              </div>
            </IsometricPlane>
          </div>


          {/* BOTTOM ROW: Data, Models */}
          <div className="absolute top-[650px] left-[100px] w-[600px] flex justify-between h-[150px]">

            {/* Data */}
            <IsometricPlane title="Data" className="w-[260px] h-[150px] p-4">
              <div className="w-full h-full grid grid-cols-4 grid-rows-2 gap-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`border rounded flex items-center justify-center ${i === 2 || i === 5 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                    {i % 2 === 0 ? <Database size={14} className={i === 2 ? 'text-emerald-500' : 'text-slate-600'} /> : <Server size={14} className={i === 5 ? 'text-emerald-500' : 'text-slate-600'} />}
                  </div>
                ))}
              </div>
            </IsometricPlane>

            {/* Models */}
            <IsometricPlane title="Models" className="w-[260px] h-[150px] p-4">
              <div className="w-full h-full grid grid-cols-4 grid-rows-2 gap-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`border rounded flex items-center justify-center ${i === 3 || i === 6 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                    {i % 2 === 0 ? <Network size={14} className={i === 6 ? 'text-emerald-500' : 'text-slate-600'} /> : <Layers size={14} className={i === 3 ? 'text-emerald-500' : 'text-slate-600'} />}
                  </div>
                ))}
              </div>
            </IsometricPlane>
          </div>

        </div>
      </div>
    </section>
  );
}

// Reusable Isometric Platform Component
function IsometricPlane({ children, className, title }: { children: React.ReactNode, className: string, title?: string }) {
  return (
    <div className={`relative bg-white border border-slate-200 shadow-md transition-all duration-500 hover:shadow-xl ${className}`}>

      {/* 3D Depth Edges */}
      {/* Bottom edge */}
      <div
        className="absolute top-full left-0 w-full h-[12px] bg-slate-100 border-b border-l border-slate-300 origin-top"
        style={{ transform: 'rotateX(-90deg)' }}
      ></div>
      {/* Right edge */}
      <div
        className="absolute top-0 left-full w-[12px] h-full bg-slate-200 border-b border-r border-slate-300 origin-left"
        style={{ transform: 'rotateY(90deg)' }}
      ></div>

      {/* Face-the-camera Title */}
      {title && (
        <div
          className="absolute -top-12 left-1/2 text-slate-700 font-medium tracking-[0.2em] uppercase text-sm whitespace-nowrap pointer-events-none"
          style={{ transform: 'rotateZ(45deg) rotateX(-55deg) translate(-50%, -50%)', transformOrigin: 'left top' }}
        >
          {title}
        </div>
      )}

      {children}
    </div>
  )
}

// Animated SVG Wires for Isometric Grid
function WirePath({ d, delay }: { d: string, delay: number }) {
  return (
    <motion.path
      d={d}
      stroke="url(#wire-gradient)"
      strokeWidth="2"
      strokeDasharray="4 6"
      fill="none"
      initial={{ strokeDashoffset: 100 }}
      animate={{ strokeDashoffset: 0 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay }}
    />
  );
}

// Ontology Node Component (Counter-rotates its children to stand up)
function OntologyNode({ x, y, icon: Icon, label, badge, active = false }: any) {
  return (
    <div
      className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
    >
      {/* Platform/Base */}
      <div className={`w-16 h-16 rounded-full border-2 ${active ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'} shadow-sm relative z-0 flex items-center justify-center`}>

        {/* 3D Standing Element */}
        <div
          className="absolute z-10 flex flex-col items-center justify-center gap-1"
          style={{ transform: 'rotateZ(45deg) rotateX(-55deg) translateY(-20px)' }}
        >
          {/* Main Icon */}
          <div className={`p-2 rounded-md border ${active ? 'bg-emerald-100 border-emerald-300 text-emerald-600' : 'bg-white border-slate-300 text-slate-600'} shadow-md`}>
            <Icon size={16} />
          </div>

          {/* Connection Badge */}
          {badge && (
            <div className={`absolute top-full mt-1 whitespace-nowrap px-2 py-0.5 rounded-full text-[8px] font-medium uppercase tracking-wider ${active ? 'bg-emerald-500 text-[#C8C7BA]' : 'bg-slate-200 text-slate-600'} shadow-sm`}>
              {badge}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
