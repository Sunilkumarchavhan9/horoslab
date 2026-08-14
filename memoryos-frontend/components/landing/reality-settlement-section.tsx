"use client";

import React from "react";
import { Reveal } from "./motion";
import { motion, useInView } from "framer-motion";
import { CalendarDays } from "lucide-react";
import Dither, { InViewDither } from "../ui/Dither";

const icons = {
  github: <svg viewBox="0 0 24 24" className="w-8 h-8"><path fill="#181717" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" /></svg>,
  microsoft: <svg viewBox="0 0 24 24" className="w-8 h-8"><path fill="#f35325" d="M11.4 2.4H1.2v10.2h10.2V2.4z" /><path fill="#81bc06" d="M22.8 2.4H12.6v10.2h10.2V2.4z" /><path fill="#05a6f0" d="M11.4 13.8H1.2V24h10.2V13.8z" /><path fill="#ffba08" d="M22.8 13.8H12.6V24h10.2V13.8z" /></svg>,
  google: <svg viewBox="0 0 24 24" className="w-8 h-8"><path fill="#4285F4" d="M23.745 12.27c0-.825-.075-1.62-.21-2.385H12.24v4.515h6.45c-.285 1.455-1.08 2.7-2.31 3.525v2.925h3.735c2.19-2.01 3.63-5.01 3.63-8.58z" /><path fill="#34A853" d="M12.24 24c3.24 0 5.955-1.08 7.935-2.925l-3.735-2.925c-1.08.72-2.46 1.155-4.2 1.155-3.225 0-5.955-2.175-6.93-5.1h-3.87v3C3.39 21.09 7.425 24 12.24 24z" /><path fill="#FBBC05" d="M5.31 14.205c-.255-.75-.39-1.56-.39-2.385s.135-1.635.39-2.385v-3h-3.87A11.968 11.968 0 000 11.82c0 1.92.465 3.735 1.29 5.385l3.87-3v-.045z" /><path fill="#EA4335" d="M12.24 4.755c1.77 0 3.36.6 4.605 1.8l3.42-3.42C18.18 1.17 15.48 0 12.24 0 7.425 0 3.39 2.91 1.44 6.84l3.87 3c.975-2.925 3.705-5.085 6.93-5.085z" /></svg>,
  slack: <svg viewBox="0 0 127 127" className="w-8 h-8"><path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A" /><path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0" /><path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="#2EB67D" /><path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E" /></svg>,
  zendesk: <svg viewBox="0 0 24 24" className="w-8 h-8"><path fill="#03363D" d="M12.914 2.904V16.29L24 2.905H12.914zM0 2.906C0 5.966 2.483 8.45 5.543 8.45s5.542-2.484 5.543-5.544H0zm11.086 4.807L0 21.096h11.086V7.713zm7.37 7.84c-3.063 0-5.542 2.48-5.542 5.543H24c0-3.06-2.48-5.543-5.543-5.543z" /></svg>,
  datadog: <svg viewBox="0 0 24 24" className="w-8 h-8"><path fill="#632CA6" d="M19.57 17.04l-1.997-1.316-1.665 2.782-1.937-.567-1.706 2.604.087.82 9.274-1.71-.538-5.794zm-8.649-2.498l1.488-.204c.241.108.409.15.697.223.45.117.97.23 1.741-.16.18-.088.553-.43.704-.625l6.096-1.106.622 7.527-10.444 1.882zm11.325-2.712l-.602.115L20.488 0 .789 2.285l2.427 19.693 2.306-.334c-.184-.263-.471-.581-.96-.989-.68-.564-.44-1.522-.039-2.127.53-1.022 3.26-2.322 3.106-3.956-.056-.594-.15-1.368-.702-1.898-.02.22.017.432.017.432s-.227-.289-.34-.683c-.112-.15-.2-.199-.319-.4-.085.233-.073.503-.073.503s-.186-.437-.216-.807c-.11.166-.137.48-.137.48s-.241-.69-.186-1.062c-.11-.323-.436-.965-.343-2.424.6.421 1.924.321 2.44-.439.171-.251.288-.939-.086-2.293-.24-.868-.835-2.16-1.066-2.651l-.028.02c.122.395.374 1.223.47 1.625.293 1.218.372 1.642.234 2.204-.116.488-.397.808-1.107 1.165-.71.358-1.653-.514-1.713-.562-.69-.55-1.224-1.447-1.284-1.883-.062-.477.275-.763.445-1.153-.243.07-.514.192-.514.192s.323-.334.722-.624c.165-.109.262-.178.436-.323a9.762 9.762 0 0 0-.456.003s.42-.227.855-.392c-.318-.014-.623-.003-.623-.003s.937-.419 1.678-.727c.509-.208 1.006-.147 1.286.257.367.53.752.817 1.569.996.501-.223.653-.337 1.284-.509.554-.61.99-.688.99-.688s-.216.198-.274.51c.314-.249.66-.455.66-.455s-.134.164-.259.426l.03.043c.366-.22.797-.394.797-.394s-.123.156-.268.358c.277-.002.838.012 1.056.037 1.285.028 1.552-1.374 2.045-1.55.618-.22.894-.353 1.947.68.903.888 1.609 2.477 1.259 2.833-.294.295-.874-.115-1.516-.916a3.466 3.466 0 0 1-.716-1.562 1.533 1.533 0 0 0-.497-.85s.23.51.23.96c0 .246.03 1.165.424 1.68-.039.076-.057.374-.1.43-.458-.554-1.443-.95-1.604-1.067.544.445 1.793 1.468 2.273 2.449.453.927.186 1.777.416 1.997.065.063.976 1.197 1.15 1.767.306.994.019 2.038-.381 2.685l-1.117.174c-.163-.045-.273-.068-.42-.153.08-.143.241-.5.243-.572l-.063-.111c-.348.492-.93.97-1.414 1.245-.633.359-1.363.304-1.838.156-1.348-.415-2.623-1.327-2.93-1.566 0 0-.01.191.048.234.34.383 1.119 1.077 1.872 1.56l-1.605.177.759 5.908c-.337.048-.39.071-.757.124-.325-1.147-.946-1.895-1.624-2.332-.599-.384-1.424-.47-2.214-.314l-.05.059a2.851 2.851 0 0 1 1.863.444c.654.413 1.181 1.481 1.375 2.124.248.822.42 1.7-.248 2.632-.476.662-1.864 1.028-2.986.237.3.481.705.876 1.25.95.809.11 1.577-.03 2.106-.574.452-.464.69-1.434.628-2.456l.714-.104.258 1.834 11.827-1.424zM15.05 6.848c-.034.075-.085.125-.007.37l.004.014.013.032.032.073c.14.287.295.558.552.696.067-.011.136-.019.207-.023.242-.01.395.028.492.08.009-.048.01-.119.005-.222-.018-.364.072-.982-.626-1.308-.264-.122-.634-.084-.757.068a.302.302 0 0 1 .058.013c.186.066.06.13.027.207m1.958 3.392c-.092-.05-.52-.03-.821.005-.574.068-1.193.267-1.328.372-.247.191-.135.523.047.66.511.382.96.638 1.432.575.29-.038.546-.497.728-.914.124-.288.124-.598-.058-.698m-5.077-2.942c.162-.154-.805-.355-1.556.156-.554.378-.571 1.187-.041 1.646.053.046.096.078.137.104a4.77 4.77 0 0 1 1.396-.412c.113-.125.243-.345.21-.745-.044-.542-.455-.456-.146-.749" /></svg>,
  docker: <svg viewBox="0 0 24 24" className="w-8 h-8"><path fill="#2496ED" d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z" /></svg>,
  sentry: <svg viewBox="0 0 24 24" className="w-8 h-8"><path fill="#362D59" d="M13.91 2.505c-.873-1.448-2.972-1.448-3.844 0L6.904 7.92a15.478 15.478 0 0 1 8.53 12.811h-2.221A13.301 13.301 0 0 0 5.784 9.814l-2.926 5.06a7.65 7.65 0 0 1 4.435 5.848H2.194a.365.365 0 0 1-.298-.534l1.413-2.402a5.16 5.16 0 0 0-1.614-.913L.296 19.275a2.182 2.182 0 0 0 .812 2.999 2.24 2.24 0 0 0 1.086.288h6.983a9.322 9.322 0 0 0-3.845-8.318l1.11-1.922a11.47 11.47 0 0 1 4.95 10.24h5.915a17.242 17.242 0 0 0-7.885-15.28l2.244-3.845a.37.37 0 0 1 .504-.13c.255.14 9.75 16.708 9.928 16.9a.365.365 0 0 1-.327.543h-2.287c.029.612.029 1.223 0 1.831h2.297a2.206 2.206 0 0 0 1.922-3.31z" /></svg>,
};
const LeftAppNode = ({ icon }: { icon: React.ReactNode }) => (
  <div className="relative flex items-center justify-end w-full group">
    {/* Horizontal Line into center */}
    <div className="absolute left-1/2 right-0 h-px bg-slate-200 z-0 hidden md:block"></div>
    <div className="w-[72px] h-[72px] md:w-[92px] md:h-[92px] bg-[#f8f9fa] border border-slate-200 rounded-none p-2.5 flex items-center justify-center relative z-10 mr-0 md:mr-16 transition-transform hover:-translate-y-1">
      <div className="w-full h-full bg-white rounded-none border border-slate-200/50 shadow-sm flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
);

const RightAppNode = ({ icon }: { icon: React.ReactNode }) => (
  <div className="relative flex items-center justify-start w-full group">
    {/* Horizontal Line into center */}
    <div className="absolute right-1/2 left-0 h-px bg-slate-200 z-0 hidden md:block"></div>
    <div className="w-[72px] h-[72px] md:w-[92px] md:h-[92px] bg-[#f8f9fa] border border-slate-200 rounded-none p-2.5 flex items-center justify-center relative z-10 ml-0 md:ml-16 transition-transform hover:-translate-y-1">
      <div className="w-full h-full bg-white rounded-none border border-slate-200/50 shadow-sm flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
);

function InstitutionRuntimeWidget() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <div ref={containerRef} className="w-full bg-white border border-slate-200 rounded-[12px] overflow-hidden flex flex-col relative z-20 shadow-none">
      {/* Scanner Animation Layer */}
      {isInView && (
        <motion.div
          initial={{ left: "-30%" }}
          animate={{ left: "120%" }}
          transition={{ duration: 2.2, ease: "easeInOut", delay: 0.2 }}
          className="absolute top-0 bottom-0 z-50 pointer-events-none"
          style={{
            width: "250px",
            background: "linear-gradient(to right, transparent, rgba(99, 102, 241, 0.05) 70%, rgba(99, 102, 241, 0.4) 100%)",
            borderRight: "2px solid rgba(79, 70, 229, 0.8)",
            boxShadow: "2px 0 15px rgba(79, 70, 229, 0.3)"
          }}
        />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="p-5 pb-4 border-b border-slate-100 bg-slate-50/50"
      >
        <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-500"><path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          Institution Runtime
        </h3>
      </motion.div>

      {/* Institution */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="px-6 pt-5 pb-5"
      >
        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-4 opacity-70">Institution</h4>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500">Release Governance</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500">Version</span>
            <span className="font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm text-[12px]">v2.4</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500">Mission</span>
            <span className="font-medium text-slate-700">Deploy GPT-5.5 Router</span>
          </div>
        </div>
      </motion.div>

      {/* Evidence */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="px-6 pt-5 pb-5 border-t border-slate-100"
      >
        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-4 opacity-70">Evidence</h4>

        <div className="grid grid-cols-2 gap-4 text-[13px]">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-slate-800 text-[15px]">52</span>
            <span className="text-slate-500 text-[12px]">Records</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-slate-800 text-[15px]">18</span>
            <span className="text-slate-500 text-[12px]">Tests</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-slate-800 text-[15px]">4</span>
            <span className="text-slate-500 text-[12px]">Reviewers</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-slate-800 text-[15px]">12</span>
            <span className="text-slate-500 text-[12px]">Telemetry Streams</span>
          </div>
        </div>
      </motion.div>

      {/* Settlement */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, delay: 1.6 }}
        className="px-6 pt-5 pb-5 border-t border-slate-100"
      >
        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-4 opacity-70">Settlement</h4>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500">Reality Confirmed</span>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-500"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500">Confidence</span>
            <span className="font-medium text-emerald-600">99.4%</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500">Decision</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-sm tracking-wider">PASS</span>
          </div>
        </div>
      </motion.div>

      {/* Evolution */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, delay: 2.0 }}
        className="px-6 pt-5 pb-6 border-t border-slate-100 bg-slate-50/50"
      >
        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-4 opacity-70">Evolution</h4>

        <div className="flex flex-col gap-2.5 mb-5">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            <span className="text-emerald-500 font-bold bg-emerald-50 w-4 h-4 flex items-center justify-center rounded-sm text-[12px]">+</span> Rollback Policy
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            <span className="text-emerald-500 font-bold bg-emerald-50 w-4 h-4 flex items-center justify-center rounded-sm text-[12px]">+</span> Stronger Approval Chain
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            <span className="text-emerald-500 font-bold bg-emerald-50 w-4 h-4 flex items-center justify-center rounded-sm text-[12px]">+</span> Larger Canary Window
          </div>
        </div>

        <div className="flex justify-between items-center text-[13px] pt-4 border-t border-slate-200/60">
          <span className="font-medium text-slate-800">Institution Fitness</span>
          <span className="font-medium text-emerald-700 bg-emerald-100 border border-emerald-200 shadow-sm px-2.5 py-1 rounded-md text-[13px]">+5.2%</span>
        </div>
      </motion.div>

    </div>
  )
}

export function RealitySettlementSection() {
  return (
    <section className="bg-[#FAFAFA] border-y border-slate-200 text-slate-900 font-sans py-24 relative overflow-hidden">
      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12 z-10">

        {/* Top Centered Section */}
        <div className="flex flex-col items-center text-center mx-auto max-w-3xl mb-20">
          <Reveal>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.1] mb-6">
              Proof is not enough. The institution must <span className="text-[#0015FF]">settle</span> <br className="hidden sm:block" />
              with reality.
            </h2>
            <p className="text-[16px] leading-relaxed text-slate-600 max-w-2xl mx-auto">
              Settlement confirms whether the mission worked, what it cost, which evidence held up, and which institutional mutation should be tested next.
            </p>
          </Reveal>
        </div>

        {/* UI Widget Section */}
        <div className="relative w-full max-w-[1000px] mx-auto py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(auto,560px)_1fr] gap-10 md:gap-0 w-full items-center relative">

            {/* Left Icons */}
            <div className="flex flex-row md:flex-col justify-center gap-8 md:gap-14 items-center md:items-end relative z-10 w-full">
              <Reveal delay={0.1}><LeftAppNode icon={icons.github} /></Reveal>
              <Reveal delay={0.2}><LeftAppNode icon={icons.docker} /></Reveal>
              <Reveal delay={0.3}><LeftAppNode icon={icons.sentry} /></Reveal>
            </div>

            {/* Center Widget */}
            <div className="z-20 w-full md:w-[560px] flex flex-col justify-center relative md:p-6 lg:p-8">

              {/* Dithers removed per user request */}

              {/* Dashed Frame (forms the # shape) */}
              <div className="absolute top-0 bottom-0 left-0 w-px border-l border-dashed border-slate-200 -my-[500px] z-0 hidden md:block pointer-events-none"></div>
              <div className="absolute top-0 bottom-0 right-0 w-px border-l border-dashed border-slate-200 -my-[500px] z-0 hidden md:block pointer-events-none"></div>
              <div className="absolute left-0 right-0 top-0 h-px border-t border-dashed border-slate-200 -mx-[500px] z-0 hidden md:block pointer-events-none"></div>
              <div className="absolute left-0 right-0 bottom-0 h-px border-t border-dashed border-slate-200 -mx-[500px] z-0 hidden md:block pointer-events-none"></div>

              <Reveal delay={0.4} className="w-full relative z-20">
                <InstitutionRuntimeWidget />
              </Reveal>
            </div>

            {/* Right Icons */}
            <div className="flex flex-row md:flex-col justify-center gap-8 md:gap-14 items-center md:items-start relative z-10 w-full">
              <Reveal delay={0.5}><RightAppNode icon={icons.slack} /></Reveal>
              <Reveal delay={0.6}><RightAppNode icon={icons.zendesk} /></Reveal>
              <Reveal delay={0.7}><RightAppNode icon={icons.datadog} /></Reveal>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}


