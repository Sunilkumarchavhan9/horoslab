const fs = require('fs');
const path = require('path');
const file = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\mission-control\\account-home-dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Insert enforceGridPadding function right before `let cachedAccountHomeSnapshot`
const enforceFunc = `
function enforceGridPadding(arr: (MetricCardData | null)[]): (MetricCardData | null)[] {
  let lastFilled = -1;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null && arr[i] !== undefined) {
      lastFilled = i;
      break;
    }
  }
  const targetLength = Math.ceil((lastFilled + 2) / 4) * 4;
  const next = [...arr];
  next.length = targetLength;
  for (let i = 0; i < targetLength; i++) {
    if (next[i] === undefined) next[i] = null;
  }
  return next;
}

`;
if (!content.includes('enforceGridPadding')) {
    content = content.replace('let cachedAccountHomeSnapshot', enforceFunc + 'let cachedAccountHomeSnapshot');
}

// 2. Update buildLiveMetricSlots to use enforceGridPadding and remove the extra catalog items
content = content.replace(/  \{ \.\.\.AVAILABLE_METRICS_CATALOG\.find[\s\S]*?\];\n\}/m, (match) => {
    return `  { ...AVAILABLE_METRICS_CATALOG.find(m => m.id === "cache_rate") as MetricCardData, spanSize: "1x1" }
  ]);
}`;
});

// Wrap return inside buildLiveMetricSlots
content = content.replace(/  return \[\n\s*\{\n\s*id: "active_institutions",/m, '  return enforceGridPadding([\n  {\n  id: "active_institutions",');

// 3. Update handleAddMetricToSlot
content = content.replace(
    'return next;\n  });\n  setActiveSlotMenuIndex(null);',
    'return enforceGridPadding(next);\n  });\n  setActiveSlotMenuIndex(null);'
);

// 4. Update handleRemoveMetricFromSlot
content = content.replace(
    'return next;\n  });\n  setActiveMenu(null);',
    'return enforceGridPadding(next);\n  });\n  setActiveMenu(null);'
);

fs.writeFileSync(file, content);
console.log("Grid logic updated.");
