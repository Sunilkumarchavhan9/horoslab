import { MemoryStarLogo } from "./memory-star-logo";
import { EpochLogo } from "@/components/epoch/primitives/epoch-logo";
import { NavMegaDropdown } from "./nav-mega-dropdown";
import { Globe, Box, Code, ShieldCheck, Lock, FileText, Brain, Network, Dna, Activity, Zap, Store, Wrench, Cpu, Shield, Terminal, FileCheck, Rocket, Search, Bot, CheckCircle, ClipboardList, BookOpen, FileCode2, GitBranch, Webhook, Package, Database, Lightbulb, Gamepad2, Layers, ExternalLink, Cloud, PlayCircle, Eye, ScrollText, Microscope, Book, Rss, History, Map, Users, HelpCircle, Briefcase, ImageIcon } from "lucide-react";

const PRODUCT_SECTIONS = [
  {
    title: "FOUNDATION",
    items: [
      {
        label: "Reality Fabric",
        description: "Memory, decisions, evidence, and fitness.",
        href: "/product/reality-fabric",
        icon: <Globe className="w-5 h-5" />
      },
      {
        label: "Institution Runtime",
        description: "Run governed autonomous organizations.",
        href: "/product/institution-runtime",
        icon: <Box className="w-5 h-5" />
      },
      {
        label: "Institution Compiler",
        description: "Compile missions into versioned genomes.",
        href: "/product/institution-compiler",
        icon: <Code className="w-5 h-5" />
      }
    ]
  },
  {
    title: "EXECUTION",
    items: [
      {
        label: "Verified Agent Execution",
        description: "Govern one autonomous institution run.",
        href: "/product/verified-agent-execution",
        icon: <ShieldCheck className="w-5 h-5" />
      },
      {
        label: "AI Infrastructure Assurance",
        description: "Verify agentic infra before reality changes.",
        href: "/product/ai-infrastructure-assurance",
        icon: <Lock className="w-5 h-5" />
      },
      {
        label: "Assurance Cases",
        description: "Evidence-linked mission proof.",
        href: "/product/assurance-cases",
        icon: <FileText className="w-5 h-5" />
      }
    ]
  },
  {
    title: "INTELLIGENCE",
    items: [
      {
        label: "Root Cause Intelligence",
        description: "Find why something happened.",
        href: "/product/root-cause-intelligence",
        icon: <Brain className="w-5 h-5" />
      },
      {
        label: "Decision Graph",
        description: "Every decision becomes queryable.",
        href: "/product/decision-graph",
        icon: <Network className="w-5 h-5" />
      },
      {
        label: "Company DNA",
        description: "Principles, policies, institutions, outcomes.",
        href: "/product/company-dna",
        icon: <Dna className="w-5 h-5" />
      }
    ]
  },
  {
    title: "EVOLUTION",
    items: [
      {
        label: "Evolution Runtime",
        description: "Mutate and simulate institutions.",
        href: "/product/evolution-runtime",
        icon: <Activity className="w-5 h-5" />
      },
      {
        label: "Evolution Lab",
        description: "Simulation and mutation testing.",
        href: "/product/evolution-lab",
        icon: <Zap className="w-5 h-5" />
      },
      {
        label: "Institution Marketplace",
        description: "Install reusable operating units.",
        href: "/product/institution-marketplace",
        icon: <Store className="w-5 h-5" />
      }
    ]
  }
];

const SOLUTIONS_SECTIONS = [
  {
    title: "BY TEAM",
    items: [
      {
        label: "Platform Engineering",
        description: "Govern AI workforces in production.",
        href: "/solutions/platform-engineering",
        icon: <Wrench className="w-5 h-5" />
      },
      {
        label: "AI Infrastructure",
        description: "Control agentic changes to infra.",
        href: "/solutions/ai-infrastructure",
        icon: <Cpu className="w-5 h-5" />
      },
      {
        label: "SRE",
        description: "Turn incidents into verified institutions.",
        href: "/solutions/sre",
        icon: <Activity className="w-5 h-5" />
      },
      {
        label: "Security",
        description: "Lease, revoke, and prove authority.",
        href: "/solutions/security",
        icon: <Shield className="w-5 h-5" />
      },
      {
        label: "ML Platform",
        description: "Verify model and agent deployment loops.",
        href: "/solutions/ml-platform",
        icon: <Network className="w-5 h-5" />
      },
      {
        label: "Developer Productivity",
        description: "Coordinate coding agents safely.",
        href: "/solutions/developer-productivity",
        icon: <Terminal className="w-5 h-5" />
      }
    ]
  },
  {
    title: "BY USE CASE",
    items: [
      {
        label: "Inference Change Assurance",
        description: "Verify PRs before GPU execution.",
        href: "/solutions/inference-change-assurance",
        icon: <FileCheck className="w-5 h-5" />
      },
      {
        label: "Release Governance",
        description: "Automate release checklists.",
        href: "/solutions/release-governance",
        icon: <Rocket className="w-5 h-5" />
      },
      {
        label: "Incident Investigation",
        description: "Root cause analysis with proof.",
        href: "/solutions/incident-investigation",
        icon: <Search className="w-5 h-5" />
      },
      {
        label: "Agent Verification",
        description: "Prove agent actions mathematically.",
        href: "/solutions/agent-verification",
        icon: <Bot className="w-5 h-5" />
      },
      {
        label: "Deployment Correctness",
        description: "Settle deployment reality against intent.",
        href: "/solutions/deployment-correctness",
        icon: <CheckCircle className="w-5 h-5" />
      },
      {
        label: "Compliance Automation",
        description: "Generate automated audit trails.",
        href: "/solutions/compliance-automation",
        icon: <ClipboardList className="w-5 h-5" />
      }
    ]
  },
  {
    title: "PROGRAMS",
    items: [
      {
        label: "Founder Program",
        description: "Design your first governed institution with Epoch.",
        href: "/design-partner",
        icon: <Globe className="w-5 h-5" />
      },
      {
        label: "Founder Sprint",
        description: "Turn one agent workflow into a governed institution.",
        href: "/verified-mission-sprint",
        icon: <Zap className="w-5 h-5" />
      }
    ]
  }
];

const DEVELOPER_SECTIONS = [
  {
    title: "START BUILDING",
    items: [
      {
        label: "Documentation",
        description: "Comprehensive guides.",
        href: "/docs",
        icon: <BookOpen className="w-5 h-5" />
      },
      {
        label: "Quickstart",
        description: "Get up and running in minutes.",
        href: "/docs/quickstart",
        icon: <Rocket className="w-5 h-5" />
      },
      {
        label: "API Reference",
        description: "Complete API documentation.",
        href: "/docs/api",
        icon: <Code className="w-5 h-5" />
      },
      {
        label: "TypeScript SDK",
        description: "Official Node.js and browser SDK.",
        href: "/docs/sdk",
        icon: <FileCode2 className="w-5 h-5" />
      },
      {
        label: "CLI",
        description: "Command-line tools.",
        href: "/docs/cli",
        icon: <Terminal className="w-5 h-5" />
      },
      {
        label: "MCP",
        description: "Model Context Protocol.",
        href: "/docs/mcp",
        icon: <Cpu className="w-5 h-5" />
      },
      {
        label: "GitHub",
        description: "Open source repositories.",
        href: "https://github.com/epoch",
        icon: <GitBranch className="w-5 h-5" />
      }
    ]
  },
  {
    title: "TOOLS",
    items: [
      {
        label: "REST API",
        description: "Direct API access.",
        href: "/tools/rest-api",
        icon: <Globe className="w-5 h-5" />
      },
      {
        label: "Webhooks",
        description: "Real-time event subscriptions.",
        href: "/tools/webhooks",
        icon: <Webhook className="w-5 h-5" />
      },
      {
        label: "Artifacts",
        description: "Manage generated outputs.",
        href: "/tools/artifacts",
        icon: <Package className="w-5 h-5" />
      },
      {
        label: "Schemas",
        description: "Data validation schemas.",
        href: "/tools/schemas",
        icon: <Database className="w-5 h-5" />
      },
      {
        label: "Examples",
        description: "Ready-to-use boilerplate.",
        href: "/tools/examples",
        icon: <Lightbulb className="w-5 h-5" />
      },
      {
        label: "Playground",
        description: "Interactive API testing.",
        href: "/tools/playground",
        icon: <Gamepad2 className="w-5 h-5" />
      },
      {
        label: "Architecture",
        description: "System design docs.",
        href: "/tools/architecture",
        icon: <Layers className="w-5 h-5" />
      }
    ]
  },
  {
    title: "RESOURCES",
    items: [
      {
        label: "See Developer Docs",
        description: "Browse the full developer portal.",
        href: "/docs",
        icon: <ExternalLink className="w-5 h-5" />
      }
    ]
  }
];

const ENTERPRISE_SECTIONS = [
  {
    title: "TRUST",
    items: [
      {
        label: "Verification",
        description: "Mathematically prove outcomes.",
        href: "/enterprise/verification",
        icon: <ShieldCheck className="w-5 h-5" />
      },
      {
        label: "Correctness Engine",
        description: "Enforce state machine constraints.",
        href: "/enterprise/correctness-engine",
        icon: <Cpu className="w-5 h-5" />
      },
      {
        label: "Assurance Cases",
        description: "Inspect every claim and proof.",
        href: "/enterprise/assurance-cases",
        icon: <FileText className="w-5 h-5" />
      },
      {
        label: "Reality Settlement",
        description: "Reconcile intent with production.",
        href: "/enterprise/reality-settlement",
        icon: <CheckCircle className="w-5 h-5" />
      }
    ]
  },
  {
    title: "SECURITY",
    items: [
      {
        label: "Capability Leases",
        description: "Time-bound, revokable permissions.",
        href: "/enterprise/capability-leases",
        icon: <Lock className="w-5 h-5" />
      },
      {
        label: "Mission Scoped Access",
        description: "Zero-trust execution environments.",
        href: "/enterprise/mission-scoped-access",
        icon: <Shield className="w-5 h-5" />
      },
      {
        label: "Audit Trail",
        description: "Immutable logs of every action.",
        href: "/enterprise/audit-trail",
        icon: <ClipboardList className="w-5 h-5" />
      },
      {
        label: "Tenant Isolation",
        description: "Dedicated runtime instances.",
        href: "/enterprise/tenant-isolation",
        icon: <Box className="w-5 h-5" />
      },
      {
        label: "Sandboxing",
        description: "Secure, isolated execution.",
        href: "/enterprise/sandboxing",
        icon: <Code className="w-5 h-5" />
      }
    ]
  },
  {
    title: "DEPLOYMENT",
    items: [
      {
        label: "AWS",
        description: "Amazon Web Services integration.",
        href: "/enterprise/aws",
        icon: <Cloud className="w-5 h-5" />
      },
      {
        label: "Azure",
        description: "Microsoft Azure support.",
        href: "/enterprise/azure",
        icon: <Cloud className="w-5 h-5" />
      },
      {
        label: "GCP",
        description: "Google Cloud Platform support.",
        href: "/enterprise/gcp",
        icon: <Cloud className="w-5 h-5" />
      },
      {
        label: "Kubernetes",
        description: "Native K8s deployments.",
        href: "/enterprise/kubernetes",
        icon: <Box className="w-5 h-5" />
      },
      {
        label: "Datadog",
        description: "Observability and alerting.",
        href: "/enterprise/datadog",
        icon: <Activity className="w-5 h-5" />
      },
      {
        label: "GitHub",
        description: "VCS and CI/CD integration.",
        href: "/enterprise/github",
        icon: <GitBranch className="w-5 h-5" />
      }
    ]
  },
  {
    title: "RESOURCES",
    items: [
      {
        label: "Enterprise Architecture",
        description: "Explore the full architecture reference.",
        href: "/enterprise-architecture",
        icon: <ExternalLink className="w-5 h-5" />
      }
    ]
  }
];

const RESOURCES_SECTIONS = [
  {
    title: "LEARN",
    items: [
      {
        label: "How It Works",
        description: "Deep dive into the mechanics.",
        href: "/how-it-works",
        icon: <PlayCircle className="w-5 h-5" />
      },
      {
        label: "Vision",
        description: "The future of enterprise AI.",
        href: "/vision",
        icon: <Eye className="w-5 h-5" />
      },
      {
        label: "Manifesto",
        description: "Our founding principles.",
        href: "/manifesto",
        icon: <ScrollText className="w-5 h-5" />
      },
      {
        label: "Research",
        description: "Academic and technical papers.",
        href: "/research",
        icon: <Microscope className="w-5 h-5" />
      },
      {
        label: "Whitepaper",
        description: "The complete technical design.",
        href: "/whitepaper",
        icon: <Book className="w-5 h-5" />
      }
    ]
  },
  {
    title: "COMPANY",
    items: [
      {
        label: "Blog",
        description: "News, updates, and thoughts.",
        href: "/blog",
        icon: <Rss className="w-5 h-5" />
      },
      {
        label: "Changelog",
        description: "New features and improvements.",
        href: "/changelog",
        icon: <History className="w-5 h-5" />
      },
      {
        label: "Roadmap",
        description: "What we're building next.",
        href: "/roadmap",
        icon: <Map className="w-5 h-5" />
      },
      {
        label: "Customers",
        description: "Success stories from partners.",
        href: "/customers",
        icon: <Users className="w-5 h-5" />
      },
      {
        label: "FAQ",
        description: "Frequently asked questions.",
        href: "/faq",
        icon: <HelpCircle className="w-5 h-5" />
      },
      {
        label: "Careers",
        description: "Join our growing team.",
        href: "/careers",
        icon: <Briefcase className="w-5 h-5" />
      }
    ]
  },
  {
    title: "ASSETS",
    items: [
      {
        label: "Media Kit",
        description: "Logos, brand assets, and press.",
        href: "/media-kit",
        icon: <ImageIcon className="w-5 h-5" />
      }
    ]
  }
];

export function LandingNav() {
  return (
    <header className="relative z-50 bg-white border-b border-slate-100">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-2 sm:px-10 lg:h-[60px] lg:px-16 lg:py-0 xl:px-20">
        <div className="flex items-center shrink-0">
          <a href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <EpochLogo size="lg" className="text-black" />
          </a>
        </div>

        <nav className="hidden lg:flex flex-wrap items-center justify-center gap-2 text-[14px] font-medium text-[#101827] lg:flex-nowrap lg:gap-3 xl:gap-6">
          <NavMegaDropdown 
            label="Product" 
            sections={PRODUCT_SECTIONS} 
          />
          <NavMegaDropdown 
            label="Solutions" 
            sections={SOLUTIONS_SECTIONS} 
          />
          <NavMegaDropdown 
            label="Developers" 
            sections={DEVELOPER_SECTIONS} 
          />
          <NavMegaDropdown 
            label="Enterprise" 
            sections={ENTERPRISE_SECTIONS} 
          />
          <NavMegaDropdown 
            label="Resources" 
            sections={RESOURCES_SECTIONS} 
          />
        </nav>

        <div className="flex items-center justify-end gap-2 md:gap-4 text-[14px] shrink-0">
          <a
            href="/auth/sign-up"
            className="inline-flex items-center bg-[#0015FF] font-medium text-white transition hover:bg-[#0015FF]/90 rounded-md"
          >
            <span className="hidden sm:inline px-5 py-2">Open Institution Runtime</span>
            <span className="sm:hidden px-3 py-2">Open</span>
          </a>
          <button className="lg:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      </div>
    </header>
  );
}


