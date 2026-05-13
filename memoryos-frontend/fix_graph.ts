import * as fs from 'fs';

const filepath = String.raw`c:\projects\MemoryOS\memoryos-frontend\components\developer-console\sections\memories-section.tsx`;
let content = fs.readFileSync(filepath, 'utf8');

const targetSVG = content.substring(content.indexOf('{memoryGraph.edges.map((edge) => {'), content.indexOf('</svg>'));

const newSVG = `{memoryGraph.edges.map((edge) => {
                    const from = memoryGraph.nodes.find((node) => node.id === edge.from);
                    const to = memoryGraph.nodes.find((node) => node.id === edge.to);
                    if (!from || !to) return null;
                    const offset = Math.abs(to.x - from.x) / 2;
                    const selected = selectedGraphEdge?.id === edge.id;
                    const isFaint = selectedGraphNode ? (from.id !== selectedGraphNode.id && to.id !== selectedGraphNode.id) : false;
                    
                    // Thicker strokes for memory connections to simulate sankey ribbons
                    const strokeWidth = selected ? 6 : from.kind === "memory" && to.kind === "memory" ? 4 : 2;
                    const strokeOpacity = selected ? 0.8 : isFaint ? 0.05 : edge.opacity * 1.2;

                    return (
                      <g key={edge.id} className="cursor-pointer" onClick={() => setSelectedGraphItem({ kind: "edge", id: edge.id })}>
                        <path
                          d={\`M \${from.x} \${from.y} C \${from.x + offset} \${from.y}, \${to.x - offset} \${to.y}, \${to.x} \${to.y}\`}
                          fill="none"
                          stroke={edge.color}
                          strokeOpacity={strokeOpacity}
                          strokeWidth={strokeWidth}
                        />
                        <path
                          d={\`M \${from.x} \${from.y} C \${from.x + offset} \${from.y}, \${to.x - offset} \${to.y}, \${to.x} \${to.y}\`}
                          fill="none"
                          stroke="transparent"
                          strokeWidth="12"
                        />
                      </g>
                    );
                  })}
                  {memoryGraph.nodes.map((node) => {
                    const selected = selectedGraphNode?.id === node.id;
                    const rectHeight = node.kind === "operation" ? 36 : 18;
                    const rectWidth = 6;
                    return (
                      <g
                        key={node.id}
                        className="cursor-pointer transition-opacity duration-300"
                        onClick={() => setSelectedGraphItem({ kind: "node", id: node.id })}
                        style={{ opacity: selectedGraphNode && !selected ? 0.3 : 1 }}
                      >
                        {/* Glow effect */}
                        {selected && (
                          <rect
                            x={node.x - rectWidth / 2 - 4}
                            y={node.y - rectHeight / 2 - 4}
                            width={rectWidth + 8}
                            height={rectHeight + 8}
                            fill={node.color}
                            opacity={0.3}
                            rx={4}
                          />
                        )}
                        <rect
                          x={node.x - rectWidth / 2}
                          y={node.y - rectHeight / 2}
                          width={rectWidth}
                          height={rectHeight}
                          fill={selected ? "#ffffff" : node.color}
                          rx={2}
                        />
                        {node.kind !== "session" || selected ? (
                          <text
                            x={node.x + 12}
                            y={node.y + 4}
                            fill={selected ? "#ffffff" : "#d4d8df"}
                            fontSize={node.kind === "operation" ? "12" : "10"}
                            fontWeight={node.kind === "operation" || node.kind === "memory" ? "800" : "600"}
                          >
                            {node.label}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                `;

content = content.replace(targetSVG, newSVG);
fs.writeFileSync(filepath, content, 'utf8');
