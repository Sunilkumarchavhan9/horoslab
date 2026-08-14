import sys

file_path = "memoryos-frontend/components/mission-control/mission-control-workspace.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update lucide-react imports
if "Activity," not in content:
    content = content.replace("History,", "History,\n  Activity,\n  Cpu,\n  BarChart2,")

# 2. Add imports for new components
if "ObserveRuntime" not in content:
    imports_to_add = """import { ObserveRuntime } from './observe-runtime';
import { ObserveTimeline } from './observe-timeline';
import { ObserveAnalytics } from './observe-analytics';
"""
    content = content.replace("const SECTION_INFO", imports_to_add + "\nconst SECTION_INFO")

# 3. Add entries to SECTION_INFO
if "observe-runtime" not in content:
    section_info_addition = """  "observe-runtime": { title: "Runtime", sub: "Monitoring" },
  "observe-timeline": { title: "Timeline", sub: "Events" },
  "observe-analytics": { title: "Analytics", sub: "Performance" },"""
    content = content.replace('"home":', section_info_addition + '\n  "home":')

# 4. Add entries to SidebarSection type
if '| "observe-runtime"' not in content:
    type_addition = """  | "observe-runtime"
  | "observe-timeline"
  | "observe-analytics"
"""
    content = content.replace('  | "account-members"', '  | "account-members"\n' + type_addition)

# 5. Add observe to expandedSections
if "observe: true" not in content:
    content = content.replace('const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({', 'const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({\n    observe: true,')

# 6. Add the Observe UI block before Governance
observe_ui_block = """
          <div className="flex flex-col">
            <button 
              onClick={() => toggleSection('observe')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <Activity className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Observe
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.observe ? "" : "-rotate-90")} />
            </button>
            {expandedSections.observe && renderSectionItems([
              {
                id: "observe-runtime",
                title: "Runtime",
                sub: "Monitoring"
              },
              {
                id: "observe-timeline",
                title: "Timeline",
                sub: "Events"
              },
              {
                id: "observe-analytics",
                title: "Analytics",
                sub: "Performance"
              }
            ])}
          </div>
"""

if "onClick={() => toggleSection('observe')}" not in content:
    content = content.replace('          <div className="flex flex-col">\n            <button \n              onClick={() => toggleSection(\'governance\')}', observe_ui_block + '          <div className="flex flex-col">\n            <button \n              onClick={() => toggleSection(\'governance\')}')

# 7. Add routing
routing_block = """                  ) : activeSection === "observe-runtime" ? (
                    <ObserveRuntime />
                  ) : activeSection === "observe-timeline" ? (
                    <ObserveTimeline />
                  ) : activeSection === "observe-analytics" ? (
                    <ObserveAnalytics />
"""

if 'activeSection === "observe-runtime"' not in content:
    content = content.replace('                  ) : activeSection === "home" ? (', routing_block + '                  ) : activeSection === "home" ? (')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modification complete!")
