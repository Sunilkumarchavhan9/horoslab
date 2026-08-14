const fs = require('fs');
const file = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\mission-control\\account-home-dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\s*\}\s*\} else if \(e\.key === 'Escape'\) \{\s*e\.preventDefault\(\);\s*setIsSearchFocused\(false\);\s*\}\s*\};\s*\{\/\* 3\. Centered Search Input Bar \*\//;

const replacement = `
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    setIsSearchFocused(false);
  }
};

useEffect(() => {
  setSearchSelectedIndex(0);
}, [searchQuery]);

return (
  <div className="-mx-8 -mt-8 p-8 md:p-12 min-h-screen bg-background dark:bg-[#0a0a0a] text-foreground dark:text-white font-sans flex flex-col relative" data-popover>

    {/* 1. Top Greeting Header */}
    <div className="flex flex-col items-center mb-7">
      <h1 className="text-[34px] font-bold text-foreground dark:text-white tracking-tight text-center">
        What are we building today?
      </h1>
    </div>

    {/* 3. Centered Search Input Bar */`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("Restored missing code and updated background color.");
