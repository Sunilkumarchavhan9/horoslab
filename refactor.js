const fs = require('fs');
const file = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\mission-control\\account-home-dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace state
content = content.replace(
    /const \[column1Type, setColumn1Type\] = useState<ColumnType>\("Institutions"\);\s*const \[column2Type\] = useState<ColumnType>\("Missions"\);\s*const \[column3Type, setColumn3Type\] = useState<ColumnType>\("Recents"\);/g,
    `const [dashboardColumns, setDashboardColumns] = useState([
  { id: "col1_Institutions", type: "Institutions" as ColumnType },
  { id: "col2_Missions", type: "Missions" as ColumnType },
  { id: "col3_Recents", type: "Recents" as ColumnType },
]);

const pushColumn = (newType: ColumnType) => {
  setDashboardColumns(prev => [
    prev[1],
    prev[2],
    { id: \`col_\${Date.now()}_\${newType}\`, type: newType }
  ]);
};`
);

// Find the section to replace: from {/* Column 1: Institutions */} down to {renderColumnContent(column3Type)}
// wait, the easiest way is to use regex from {/* Column 1: Institutions */} to `{renderColumnContent(column3Type)}\n  </div>\n  </div>`

const replacement = `{/* 4. 3-Column Customizable Widget Cards Wired to Backend Data */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mx-auto mb-16">
    <AnimatePresence mode="popLayout">
      {dashboardColumns.map((col, idx) => {
        let addLabel = "Add item";
        let addAction = () => {};
        let showAllAction = () => {};
        
        if (col.type === "Institutions") {
          addLabel = "Add institution";
          addAction = () => onNavigate?.("workspace-institutions");
          showAllAction = () => onNavigate?.("workspace-institutions");
        } else if (col.type === "Missions") {
          addLabel = "Start mission";
          addAction = () => onNavigate?.("workspace-missions");
          showAllAction = () => onNavigate?.("workspace-missions");
        } else {
          addLabel = "Add recent";
          addAction = () => onNavigate?.("recents");
          showAllAction = () => onNavigate?.("recents");
        }

        return (
          <motion.div
            layout
            key={col.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.15, filter: "blur(10px)", transition: { duration: 0.25, ease: "easeOut" } }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="flex flex-col relative"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1 text-[15px] font-semibold text-foreground dark:text-white cursor-pointer hover:text-[#0f52ff]">
                <span>{col.type}</span>
                <ChevronRight className="size-4 text-muted-foreground dark:text-white/40" />
              </div>

              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === col.id ? null : col.id)}
                  className="text-muted-foreground dark:text-white/40 hover:text-foreground dark:text-white p-1 rounded-md hover:bg-accent dark:bg-white/5 dark:hover:bg-card/5 transition-colors"
                >
                  <MoreHorizontal className="size-4" />
                </button>

                <AnimatePresence>
                  {activeMenu === col.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-7 z-50 w-[200px] bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md shadow-xl p-1.5 text-xs text-foreground/90 dark:text-white/90"
                    >
                      <button onClick={addAction} className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">
                        <Plus className="size-3.5" /> {addLabel}
                      </button>
                      <button onClick={showAllAction} className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">
                        <MoreHorizontal className="size-3.5" /> Show all
                      </button>
                      <div className="border-t border-[#f0f0f2] dark:border-white/5 dark:border-white/5 my-1" />
                      <div className="relative">
                        <button
                          onClick={() => setActiveSubMenu(activeSubMenu === \`\${col.id}-change\` ? null : \`\${col.id}-change\`)}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <LayoutGrid className="size-3.5" /> Change column
                          </span>
                          <ChevronRight className="size-3.5 text-muted-foreground dark:text-white/40" />
                        </button>
                        {activeSubMenu === \`\${col.id}-change\` && (
                          <div className="absolute left-full top-0 ml-1 z-50 w-[160px] bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md shadow-xl p-1.5 space-y-0.5">
                            {(["Reality Fabric", "Missions", "Institutions", "Agents", "Execution", "Evidence", "Verification", "Settlement", "Governance", "Observe", "Developer", "Account", "Recents"] as ColumnType[]).map((t) => (
                              <button
                                key={t}
                                onClick={() => {
                                  pushColumn(t);
                                  setActiveMenu(null);
                                  setActiveSubMenu(null);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-between",
                                  col.type === t ? "bg-card dark:bg-[#0f52ff]/20 text-[#0f52ff]" : "hover:bg-card dark:bg-white/10 text-foreground/90 dark:text-white/90"
                                )}
                              >
                                <span>{t}</span>
                                {col.type === t && <Check className="size-3.5" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {renderColumnContent(col.type)}
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>`;

// Replace from {/\* Column 1: Institutions \*/} to {renderColumnContent(column3Type)}\n </div>\n </div>
const regex = /\{\/\* 4\. 3-Column Customizable Widget Cards Wired to Backend Data \*\/\}\s*<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mx-auto mb-16">[\s\S]*?\{renderColumnContent\(column3Type\)\}\s*<\/div>\s*<\/div>/;

if (!regex.test(content)) {
    console.log("Could not find the target HTML to replace!");
} else {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Refactored columns successfully!");
}
