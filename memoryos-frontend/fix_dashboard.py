import sys
import re

def main():
    file_path = 'components/mission-control/account-home-dashboard.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Look for where the search suggestions block and return is.
    # We will just rewrite from `const handleSearchKeyDown = ...` all the way to `Column 1: Institutions`
    
    start_str = "  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {"
    end_str = "{/* Column 1: Institutions */}"
    
    if start_str in content and end_str in content:
        start_idx = content.find(start_str)
        end_idx = content.find(end_str)
        
        replacement = """  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchFocused && searchResults.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsSearchFocused(true);
      }
    }

    if (!isSearchFocused) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = searchResults[searchSelectedIndex];
      if (selected) {
        if (selected.type === 'tip') {
          setSearchQuery(selected.label.split(':')[0] + ': ');
        } else {
          setSearchQuery(selected.label);
          setIsSearchFocused(false);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchFocused(false);
    }
  };

  useEffect(() => {
    setSearchSelectedIndex(0);
  }, [searchQuery, isSearchFocused]);

  return (
    <div className="-mx-8 -mt-8 p-8 md:p-12 min-h-screen bg-[#FBFBFB] text-[#111] font-sans flex flex-col relative" data-popover>
      
      {/* 1. Top Greeting Header */}
      <div className="flex flex-col items-center mb-7">
        <h1 className="text-[34px] font-bold text-[#111] tracking-tight text-center">
          What are we building today?
        </h1>
      </div>

      {/* 3. Centered Search Input Bar */}
      <div className="max-w-3xl w-full mx-auto mb-12 relative z-50">
        <div className={cn(
          "relative flex items-center w-full bg-white border rounded-xl h-11 px-4 shadow-xs transition-all",
          isSearchFocused ? "border-[#0f52ff] ring-1 ring-[#0f52ff]/20 rounded-b-none" : "border-[#e2e2e8]"
        )}>
          <Search className="size-4 text-[#888] pointer-events-none mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search institutions, missions, evidence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={(e) => {
              setTimeout(() => setIsSearchFocused(false), 200);
            }}
            onKeyDown={handleSearchKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-[14.5px] text-[#111] placeholder:text-[#999] min-w-0"
          />
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <kbd className="inline-flex h-5 items-center justify-center rounded border border-[#e2e2e7] bg-[#f8f8fa] px-1.5 text-[10.5px] font-medium text-[#666]">Ctrl</kbd>
            <kbd className="inline-flex h-5 items-center justify-center rounded border border-[#e2e2e7] bg-[#f8f8fa] px-1.5 text-[10.5px] font-medium text-[#666]">K</kbd>
          </div>
        </div>

        {/* Search Dropdown / Command Palette */}
        <AnimatePresence>
          {isSearchFocused && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 bg-white border border-[#e2e2e8] border-t-0 rounded-b-xl shadow-lg overflow-hidden flex flex-col"
            >
              <div className="p-2 text-xs font-semibold text-[#888] px-4 py-3 bg-[#fbfbfb] border-b border-[#e2e2e8]">
                {searchQuery.trim() === "" ? "Search tips" : "Suggestions"}
              </div>
              <div className="max-h-[300px] overflow-y-auto py-2">
                {searchResults.map((item, index) => (
                  <div
                    key={item.id}
                    onMouseDown={(e) => {
                      e.preventDefault(); 
                      if (item.type === 'tip') {
                        setSearchQuery(item.label.split(':')[0] + ': ');
                      } else {
                        setSearchQuery(item.label);
                        setIsSearchFocused(false);
                      }
                    }}
                    onMouseEnter={() => setSearchSelectedIndex(index)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors",
                      searchSelectedIndex === index ? "bg-[#f4f7ff] text-[#0f52ff]" : "hover:bg-[#f8f8fa] text-[#444]"
                    )}
                  >
                    <div className={cn("shrink-0", item.type !== 'tip' && "size-6 rounded-full border flex items-center justify-center bg-[#f8f8fa] border-[#e2e2e8]")}>
                      {item.icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={cn("text-[13px] truncate", searchSelectedIndex === index ? "font-medium" : "")}>
                        {item.type === 'tip' ? (
                          <>
                            <strong className="font-semibold text-[#111]">{item.label.split('—')[0]}</strong>
                            <span className="text-[#666]"> — {item.label.split('—')[1]}</span>
                          </>
                        ) : (
                          item.label
                        )}
                      </span>
                      {item.sub && (
                        <span className="text-[11px] text-[#888] truncate">{item.sub}</span>
                      )}
                    </div>
                    {item.type === 'tip' && (
                      <ChevronRight className={cn("size-3.5 ml-auto", searchSelectedIndex === index ? "text-[#0f52ff]" : "text-[#aaa]")} />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="px-4 py-2 bg-[#f8f8fa] border-t border-[#e2e2e8] flex items-center gap-4 text-[11px] text-[#777]">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center border border-[#e2e2e7] bg-white rounded-[3px] px-1 shadow-sm leading-none h-4">↑</span>
                  <span className="inline-flex items-center justify-center border border-[#e2e2e7] bg-white rounded-[3px] px-1 shadow-sm leading-none h-4">↓</span>
                  <span>to navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center border border-[#e2e2e7] bg-white rounded-[3px] px-1 shadow-sm leading-none h-4">↵</span>
                  <span>to select</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="inline-flex items-center justify-center border border-[#e2e2e7] bg-white rounded-[3px] px-1 shadow-sm leading-none h-4">esc</span>
                  <span>to close</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AnimatePresence for Loading Skeleton vs Main Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <DashboardSkeletonLoader key="skeleton_loader" />
        ) : (
          <motion.div
            key="dashboard_content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* 4. 3-Column Customizable Widget Cards Wired to Backend Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mx-auto mb-16">
              
              """
        
        new_content = content[:start_idx] + replacement + content[end_idx:]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Fixed!")
    else:
        print("Could not find boundaries")

if __name__ == "__main__":
    main()
