import React from "react";
import { ShieldCheck, FileCheck, Code2, Play, Lock, ChevronRight, CheckCircle2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";

const MOCK_VERIFIER_CODE = `import { Verifier, Evidence, VerificationResult } from '@dhyra/sdk/verify';

export class FinancialTransactionVerifier extends Verifier {
  
  // Define required evidence schema
  evidenceSchema = {
    receipt: 'image/png | application/pdf',
    ledger_entry: 'application/json',
  };

  async verify(evidence: Evidence): Promise<VerificationResult> {
    // 1. Check receipt signature
    const isSigned = await this.crypto.verifySignature(evidence.receipt);
    if (!isSigned) return this.reject('Receipt lacks valid cryptographic signature');

    // 2. Cross-reference amounts
    const receiptAmount = await this.ocr.extractTotal(evidence.receipt);
    const ledgerAmount = evidence.ledger_entry.amount;
    
    if (receiptAmount !== ledgerAmount) {
      return this.reject(\`Amount mismatch: \${receiptAmount} != \${ledgerAmount}\`);
    }

    // 3. Issue certificate
    return this.approve({
      confidence: 0.99,
      metadata: { verified_amount: receiptAmount }
    });
  }
}`;

export function DeveloperVerifiersView() {
  return (
    <div className="flex h-full w-full animate-in fade-in duration-500 bg-background text-foreground">
      
      {/* Left Column: Documentation & Engines */}
      <div className="w-1/2 h-full overflow-y-auto border-r border-border p-12 custom-scrollbar">
         
         <div className="flex flex-col max-w-xl">
            
            <h1 className="text-[32px] font-bold tracking-tight text-foreground leading-tight">
              Verification Engines
            </h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-3xl mt-4">
              Developers can write custom verification engines to evaluate institutional evidence. When a mission completes, these engines determine if the outcome is valid before it affects institutional reality.
            </p>

            {/* Architecture Flow */}
            <div className="flex items-center gap-4 py-8 border-y border-border text-[12px] font-mono text-muted-foreground mt-8">
               <div className="flex items-center gap-2 text-foreground">Input</div>
               <ChevronRight className="size-4 text-[#3f3f46]" />
               <div className="flex items-center gap-2">Checks</div>
               <ChevronRight className="size-4 text-[#3f3f46]" />
               <div className="flex items-center gap-2">Evidence</div>
               <ChevronRight className="size-4 text-[#3f3f46]" />
               <div className="flex items-center gap-2 text-foreground">Result</div>
               <ChevronRight className="size-4 text-[#3f3f46]" />
               <div className="flex items-center gap-2 text-emerald-400"><FileCheck className="size-4" /> Certificate</div>
            </div>

            {/* Active Engines */}
            <div className="mt-8">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-bold text-foreground">Registered Engines (3)</h3>
                  <button className="text-[12px] bg-foreground text-background font-medium px-3 py-1.5 rounded-sm hover:bg-neutral-200 transition-colors">
                     Deploy New Engine
                  </button>
               </div>

               <div className="flex flex-col gap-3">
                  
                  {/* Engine 1 */}
                  <div className="p-4 border border-border bg-card rounded-md hover:border-border/80 hover:border-border transition-colors cursor-pointer border-l-2 border-l-emerald-400">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <ShieldCheck className="size-4 text-emerald-400" />
                           <span className="text-[13px] font-bold text-foreground">FinancialTransactionVerifier</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono rounded-sm border border-emerald-500/20">
                          v1.4.0
                        </span>
                     </div>
                     <p className="text-[12px] text-muted-foreground mt-2">
                        Cross-references raw receipts with ledger entries and verifies cryptographic signatures.
                     </p>
                  </div>

                  {/* Engine 2 */}
                  <div className="p-4 border border-border bg-card rounded-md hover:border-border/80 hover:border-border transition-colors cursor-pointer">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Code2 className="size-4 text-blue-400" />
                           <span className="text-[13px] font-bold text-foreground">CodeQualityVerifier</span>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-mono rounded-sm border border-blue-500/20">
                          v2.1.2
                        </span>
                     </div>
                     <p className="text-[12px] text-muted-foreground mt-2">
                        Runs static analysis and checks test coverage against institutional baselines.
                     </p>
                  </div>

                  {/* Engine 3 */}
                  <div className="p-4 border border-border bg-card rounded-md hover:border-border/80 hover:border-border transition-colors cursor-pointer">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Lock className="size-4 text-purple-400" />
                           <span className="text-[13px] font-bold text-foreground">PIIRedactionVerifier</span>
                        </div>
                        <span className="px-2 py-0.5 bg-[#27272a] text-foreground text-[10px] font-mono rounded-sm">
                          v1.0.0
                        </span>
                     </div>
                     <p className="text-[12px] text-muted-foreground mt-2">
                        Ensures all generated evidence has been successfully scrubbed of PII.
                     </p>
                  </div>

               </div>
            </div>

         </div>
      </div>

      {/* Right Column: Engine Code Editor */}
      <div className="w-1/2 h-full flex flex-col bg-muted/10 border-l border-border">
         <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-muted/10">
            <div className="flex items-center gap-4">
               <span className="text-[12px] font-mono text-foreground flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-emerald-400" /> FinancialTransactionVerifier.ts
               </span>
            </div>
            <div className="flex items-center gap-2">
               <button className="text-[12px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
                 Run Tests
               </button>
               <button className="flex items-center gap-1.5 text-[12px] font-medium bg-foreground hover:bg-neutral-200 text-background px-3 py-1.5 rounded-sm transition-colors">
                  Publish Update
               </button>
            </div>
         </div>
         
         <div className="flex-1 w-full relative">
            <Editor
              height="100%"
              defaultLanguage="typescript"
              theme="vs-dark"
              value={MOCK_VERIFIER_CODE}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 1.6,
                padding: { top: 24, bottom: 24 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                renderLineHighlight: "all",
              }}
            />
         </div>
      </div>

    </div>
  );
}
