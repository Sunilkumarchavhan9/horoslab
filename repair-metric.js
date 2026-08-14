const fs = require('fs');
const file = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\mission-control\\account-home-dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /title="Drag to resize card continuously with your mouse cursor"/;

if (!regex.test(content)) {
    console.log("Could not find anchor.");
} else {
    const replacement = `</div>
 </div>
 </div>
 </div>

 <MetricCard
   title={card.title}
   value={card.value.toString()}
   trend={card.changeType ?? "neutral"}
   trendValue={card.change ?? ""}
   data={card.points ?? []}
   className="h-full border-none shadow-none bg-transparent -mx-6 -mb-6"
 />

 {/* Bottom-Right Drag Resize Handle Grip */}
 <motion.div
   whileHover={{ scale: 1.25 }}
   whileTap={{ scale: 0.95 }}
   onMouseDown={(e) => handleStartDragResize(e, slotIdx)}
   title="Drag to resize card continuously with your mouse cursor"`;

    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Repaired MetricCard rendering.");
}
