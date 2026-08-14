export type RealityExchangePhase = {
  title: string;
  horizon: string;
  summary: string;
  items: string[];
};

export type RealityExchangePlan = {
  version: string;
  company: string;
  product: string;
  initialWedge: string;
  oneLiner: string;
  firstCustomer: {
    profile: string;
    buyer: string;
    dailyUsers: string[];
    firstUseCase: string;
  };
  buildNow: RealityExchangePhase;
  buildNext: RealityExchangePhase;
  buildLater: RealityExchangePhase;
  mandateContract: {
    sourceProgram: string;
    requiredFields: string[];
    states: string[];
  };
  institutionCompilerPipeline: string[];
  signatureDemo: {
    mission: string;
    initialInstitution: string[];
    demoSequence: string[];
    closingScreen: string[];
  };
  northStar: {
    mission: string;
    proof: string;
    acceptanceCriteria: string[];
  };
};

export const REALITY_EXCHANGE_PLAN: RealityExchangePlan = {
  version: "3.0",
  company: "Reality Exchange",
  product: "Institution Compiler",
  initialWedge: "Verified production-engineering outcomes",
  oneLiner:
    "memoryosTM compiles production missions into governed AI engineering institutions and independently verifies the outcome.",
  firstCustomer: {
    profile:
      "AI-native software company with 10 to 100 engineers that uses coding agents, GitHub, CI, and observability but does not trust autonomous production execution.",
    buyer: "Founder, CTO, VP Engineering, Head of Platform, or Head of Developer Productivity",
    dailyUsers: [
      "SRE",
      "Platform engineer",
      "Staff engineer",
      "Incident commander",
      "Security engineer",
      "AI platform engineer",
    ],
    firstUseCase:
      "Historical production incident replay, then read-only shadow investigation and human-approved preview or canary execution.",
  },
  buildNow: {
    title: "Build Now",
    horizon: "12-week category proof",
    summary:
      "The first product proof is a dynamically compiled institution that solves and verifies a production mission a single agent and static team cannot reliably complete.",
    items: [
      "Mandate Contract",
      "Institution IR",
      "two candidate topologies",
      "AI Agent Registry",
      "role-specific inheritance",
      "Tool Gateway",
      "Constitutional VM",
      "basic constitutional type checks",
      "Evidence Graph",
      "proof-carrying action receipts",
      "dynamic reconfiguration",
      "one counterfactual replay mode",
      "independent verifier",
      "settlement certificate v0",
      "benchmark against single and static multi-agent baselines",
    ],
  },
  buildNext: {
    title: "Build Next",
    horizon: "Months 4 to 9",
    summary:
      "The next phase deepens explainability, verification, and resilience after the first institutional loop proves itself.",
    items: [
      "full Institution Package",
      "compiler explainability",
      "Living World Model",
      "stronger counterfactual lab",
      "recovery and compensation",
      "verifier quorum",
      "Institutional Chaos Lab",
      "capability passports",
      "private institution tournament",
      "formal validation of critical state machines",
    ],
  },
  buildLater: {
    title: "Build Later",
    horizon: "Months 10 to 36",
    summary:
      "The long-term platform expands into portfolios, external participants, settlement, and eventually the broader Reality Exchange.",
    items: [
      "mission portfolio manager",
      "external A2A participants",
      "external verifier network",
      "cross-company passports",
      "escrow",
      "payments",
      "bonds",
      "insurance",
      "institution bidding",
      "domain packs",
      "closed Reality Exchange",
      "open Reality Exchange",
    ],
  },
  mandateContract: {
    sourceProgram: "The mandate is the source program of the Institution Compiler.",
    requiredFields: [
      "Mandate",
      "Baseline",
      "Desired outcome",
      "Invariants",
      "Authority",
      "Budget",
      "Verification",
      "Termination",
    ],
    states: [
      "DRAFT",
      "NEEDS_CLARIFICATION",
      "UNMEASURABLE",
      "UNSAFE",
      "READY",
      "ACTIVE",
      "PAUSED",
      "VERIFIED",
      "REJECTED",
      "INCONCLUSIVE",
      "DISSOLVED",
    ],
  },
  institutionCompilerPipeline: [
    "Mission parsing",
    "Mission classification",
    "Consequence and risk analysis",
    "Capability inference",
    "Candidate topology generation",
    "Role synthesis",
    "Authority synthesis",
    "Budget synthesis",
    "Verification topology",
    "Candidate scoring",
    "Static validation",
    "Emit versioned Institution IR",
  ],
  signatureDemo: {
    mission:
      "Eliminate duplicate subscription charges while preserving legitimate payment retries. Do not perform an unapproved database migration. Maximum experiment budget: $100.",
    initialInstitution: [
      "Mission Governor",
      "Application Investigator",
      "Database Investigator",
      "Retry Worker Investigator",
      "Adversarial Reviewer",
      "Limited Executor",
      "Independent Verifier",
    ],
    demoSequence: [
      "Compile the mandate.",
      "Reproduce the baseline duplicate-charge scenario.",
      "Let application and database investigators form competing hypotheses.",
      "Reject the unsafe 'disable retries' intervention.",
      "Detect the missing payment-integrity capability.",
      "Recompile Institution IR v2 with the new specialist.",
      "Block the schema migration without approval.",
      "Run the corrected patch in sandbox and canary it only after approval.",
      "Verify target and protected metrics separately.",
      "Issue a settlement decision and dissolve the institution.",
    ],
    closingScreen: [
      "REALITY SETTLED",
      "Settlement: VERIFIED",
      "Institution: DISSOLVED",
      "Authority violations: 0",
      "Unsafe interventions rejected: 2",
      "Capability learning: RETAINED",
    ],
  },
  northStar: {
    mission:
      "Keep duplicate subscription charges at zero for seven days while preserving failed-payment retries, maintaining availability above 99.95%, and using no more than $100 in experiments.",
    proof:
      "The system detects missing baseline data, compiles multiple candidate institutions, rejects unsafe interventions, recompiles when evidence changes, and independently verifies the sustained outcome before settlement.",
    acceptanceCriteria: [
      "Mandatory typed mandate contract",
      "At least two candidate institution topologies",
      "Bounded authority and budgets",
      "Independent verifier separation",
      "Human approval for high-risk actions",
      "Signed settlement certificate",
    ],
  },
};

