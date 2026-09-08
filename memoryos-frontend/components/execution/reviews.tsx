"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, GitPullRequest, GitMerge, MessageSquare, AlertCircle, ShieldCheck, Check, X, ChevronRight, FileDiff, Cpu, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_REVIEWS = [
  { id: "rev-1", title: "Security Review: Auth Module", worker: "SecOps Bot", status: "PENDING", evidence: 18, issues: 2, time: "10m ago", author: "Claude 4" },
  { id: "rev-2", title: "Code Quality: Refactor utils", worker: "Lint Bot", status: "APPROVED", evidence: 5, issues: 0, time: "1h ago", author: "Claude 4" },
  { id: "rev-3", title: "Integration Tests: Stripe API", worker: "Jest Runner", status: "REJECTED", evidence: 42, issues: 12, time: "3h ago", author: "Claude 4" },
]

export function ExecutionReviews() {
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  
  const selectedReview = MOCK_REVIEWS.find(r => r.id === selectedReviewId)

  return (
    <div className="flex h-full w-full bg-white relative">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all ${selectedReview ? 'lg:w-[400px] lg:flex-none border-r border-black/10' : 'w-full'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 bg-[#fafafa]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black">Reviews</h1>
              <p className="text-sm text-black/50 mt-1">Did the execution produce acceptable work?</p>
            </div>
            {!selectedReview && (
              <div className="flex gap-2">
                 <Button className="bg-[#2da44e] hover:bg-[#2c974b] text-[#F0EFE2] rounded-md shadow-sm h-8 px-3 text-xs">
                    New Review Queue
                 </Button>
              </div>
            )}
          </div>
          
          {/* Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
             <div className="flex bg-black/5 p-1 rounded-md">
                <button className="px-4 py-1.5 rounded-md bg-white text-black shadow-sm text-sm font-medium">Open</button>
                <button className="px-4 py-1.5 rounded-md text-black/60 hover:text-black text-sm font-medium transition-colors">Closed</button>
             </div>
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/40" />
               <input 
                 type="text"
                 placeholder="Search reviews..."
                 className="w-full pl-9 pr-4 py-1.5 bg-white border border-black/10 hover:border-black/20 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#0f52ff] transition-all"
               />
             </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          {MOCK_REVIEWS.map((review) => (
             <div 
               key={review.id}
               onClick={() => setSelectedReviewId(review.id)}
               className={`p-4 border-b border-black/5 cursor-pointer flex gap-4 transition-colors ${selectedReviewId === review.id ? 'bg-[#0f52ff]/5 border-l-4 border-l-[#0f52ff]' : 'hover:bg-[#f6f8fa] border-l-4 border-l-transparent'}`}
             >
                <div className="mt-1 shrink-0">
                   {review.status === 'APPROVED' ? <GitMerge className="size-5 text-[#8250df]" /> : 
                    review.status === 'REJECTED' ? <GitPullRequest className="size-5 text-red-500" /> : 
                    <GitPullRequest className="size-5 text-[#2da44e]" />}
                </div>
                <div className="flex-1 min-w-0">
                   <h3 className="text-[15px] font-semibold text-black mb-1 truncate group-hover:text-[#0f52ff]">{review.title}</h3>
                   <div className="text-xs text-black/50 flex items-center flex-wrap gap-2">
                      <span>#{review.id.split('-')[1]} opened {review.time} by {review.author}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Cpu className="size-3" /> Reviewed by {review.worker}</span>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                   {review.issues > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                         <AlertCircle className="size-3" /> {review.issues}
                      </span>
                   )}
                   <span className="flex items-center gap-1 text-xs text-black/50">
                      <MessageSquare className="size-3" /> 4
                   </span>
                </div>
             </div>
          ))}
        </div>
      </div>

      {/* Deep Dive Inspector */}
      {selectedReview && (
        <div className="flex-1 bg-white flex flex-col min-w-0 relative z-10 border-l border-black/10">
          <div className="px-6 py-4 border-b border-black/5 flex items-center gap-4 bg-[#f6f8fa] sticky top-0 z-10">
             <button className="lg:hidden p-2 -ml-2 rounded hover:bg-black/5" onClick={() => setSelectedReviewId(null)}>
                <ChevronLeft className="size-5 text-black/50" />
             </button>
             <div className="flex-1">
                <h2 className="text-xl font-semibold text-black flex items-center gap-3">
                   {selectedReview.title}
                   <span className="text-black/40 font-normal">#{selectedReview.id.split('-')[1]}</span>
                </h2>
                <div className="flex items-center gap-2 mt-2">
                   <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#F0EFE2] ${selectedReview.status === 'APPROVED' ? 'bg-[#8250df]' : selectedReview.status === 'REJECTED' ? 'bg-[#cf222e]' : 'bg-[#2da44e]'}`}>
                      {selectedReview.status === 'APPROVED' ? <GitMerge className="size-3.5" /> : <GitPullRequest className="size-3.5" />}
                      {selectedReview.status === 'PENDING' ? 'Open' : selectedReview.status === 'APPROVED' ? 'Merged' : 'Closed'}
                   </div>
                   <span className="text-sm text-black/60">
                      <strong className="text-black font-semibold">{selectedReview.author}</strong> wants to merge output into main
                   </span>
                </div>
             </div>
             
             {selectedReview.status === 'PENDING' && (
                <div className="flex gap-2">
                   <Button variant="outline" className="h-8 text-xs bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border-black/10">
                      Reject
                   </Button>
                   <Button className="h-8 text-xs bg-[#2da44e] hover:bg-[#2c974b] text-[#F0EFE2] shadow-sm">
                      Approve & Merge
                   </Button>
                </div>
             )}
          </div>
          
          <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
             <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Initial Post */}
                <div className="flex gap-4">
                   <div className="size-10 rounded-full bg-[#0f52ff]/10 flex items-center justify-center shrink-0 border border-[#0f52ff]/20">
                      <Cpu className="size-5 text-[#0f52ff]" />
                   </div>
                   <div className="flex-1 border border-[#d0d7de] rounded-md overflow-hidden">
                      <div className="bg-[#f6f8fa] px-4 py-2 border-b border-[#d0d7de] text-sm text-black/60">
                         <strong className="text-black">{selectedReview.author}</strong> commented {selectedReview.time}
                      </div>
                      <div className="p-4 text-sm text-black leading-relaxed bg-white">
                         <p>This output resolves the API migration tasks. I have updated the authentication middleware to use the new VestAuth tokens.</p>
                         <p className="mt-3"><strong>Evidence Linked:</strong></p>
                         <ul className="list-disc pl-5 mt-2 space-y-1 text-black/70">
                            <li><a href="#" className="text-[#0969da] hover:underline">Artifact: auth.ts diff</a></li>
                            <li><a href="#" className="text-[#0969da] hover:underline">Trace: tr-92f8a1 Logs</a></li>
                         </ul>
                      </div>
                   </div>
                </div>

                {/* Timeline Line */}
                <div className="relative pl-[19px]">
                   <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-[#d0d7de]" />
                   
                   {/* Automated Reviewer */}
                   <div className="relative py-4 flex gap-4">
                      <div className="absolute left-[-11px] top-5 size-6 rounded-full bg-[#f6f8fa] border-2 border-[#d0d7de] flex items-center justify-center z-10">
                         <ShieldCheck className="size-3 text-black/50" />
                      </div>
                      <div className="ml-8 flex-1 border border-[#d0d7de] rounded-md overflow-hidden">
                         <div className="bg-[#f6f8fa] px-4 py-2 border-b border-[#d0d7de] text-sm text-black/60 flex justify-between">
                            <span><strong className="text-black">{selectedReview.worker}</strong> left a review</span>
                            {selectedReview.issues > 0 ? (
                               <span className="text-[#cf222e] font-semibold flex items-center gap-1"><X className="size-3"/> Changes requested</span>
                            ) : (
                               <span className="text-[#2da44e] font-semibold flex items-center gap-1"><Check className="size-3"/> Approved</span>
                            )}
                         </div>
                         <div className="p-4 bg-white">
                            {selectedReview.issues > 0 ? (
                               <div className="text-sm text-black">
                                  Found potential rate-limiting vulnerability in the new token parsing logic. See diff below.
                               </div>
                            ) : (
                               <div className="text-sm text-black">
                                  All security checks passed. No PII leaks detected.
                               </div>
                            )}
                         </div>
                      </div>
                   </div>
                   
                   {/* Diff View */}
                   <div className="relative py-4 flex gap-4">
                      <div className="absolute left-[-11px] top-5 size-6 rounded-full bg-[#f6f8fa] border-2 border-[#d0d7de] flex items-center justify-center z-10">
                         <FileDiff className="size-3 text-black/50" />
                      </div>
                      <div className="ml-8 flex-1 border border-[#d0d7de] rounded-md overflow-hidden bg-white">
                         <div className="bg-[#f6f8fa] px-4 py-2 border-b border-[#d0d7de] text-sm text-black font-mono flex items-center gap-2">
                            <ChevronRight className="size-4 text-black/50"/> src/api/auth.ts
                         </div>
                         <div className="text-xs font-mono">
                            <div className="flex bg-[#f6f8fa] text-black/40 border-b border-[#d0d7de]"><div className="w-10 text-right pr-2 border-r border-[#d0d7de]">@@</div><div className="px-4">...</div></div>
                            <div className="flex bg-[#ffebe9] text-black"><div className="w-10 text-right pr-2 border-r border-[#d0d7de] text-black/40">42</div><div className="px-4">- const headerValue = req.headers.authorization;</div></div>
                            <div className="flex bg-[#e6ffec] text-black"><div className="w-10 text-right pr-2 border-r border-[#d0d7de] text-black/40">42</div><div className="px-4">+ const authValue = await vestAuth.validate(req);</div></div>
                         </div>
                         {selectedReview.issues > 0 && (
                            <div className="mx-4 my-2 border border-[#d0d7de] rounded-md overflow-hidden">
                               <div className="bg-[#f6f8fa] px-3 py-1 text-xs font-semibold text-black border-b border-[#d0d7de]">
                                  {selectedReview.worker}
                               </div>
                               <div className="p-3 bg-white text-sm text-black">
                                  Missing try/catch block around `vestAuth.validate`. This will crash the server on network failure.
                               </div>
                            </div>
                         )}
                      </div>
                   </div>
                   
                   {/* Bottom Approval Area */}
                   <div className="relative pt-6 pb-12 flex gap-4">
                      <div className="absolute left-[-11px] top-8 size-6 rounded-full bg-[#2da44e] flex items-center justify-center z-10 border-[3px] border-white">
                         <Check className="size-3 text-[#F0EFE2]" />
                      </div>
                      <div className="ml-8 w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-4">
                         <h4 className="font-semibold text-black mb-2">Add your review</h4>
                         <textarea className="w-full h-24 border border-[#d0d7de] rounded bg-white p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f52ff]" placeholder="Leave a comment..."></textarea>
                         <div className="flex justify-end mt-3 gap-2">
                            <Button variant="outline" className="h-8 text-xs bg-[#f3f4f6]">Comment</Button>
                            <Button className="h-8 text-xs bg-[#2da44e] hover:bg-[#2c974b] text-[#F0EFE2]">Approve Review</Button>
                         </div>
                      </div>
                   </div>

                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
