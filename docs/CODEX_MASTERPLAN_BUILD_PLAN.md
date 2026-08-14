# memoryosTM Masterplan-Only Build Plan

This document follows `docs/postman/masterplan.md` only.

## First Launch Scope Lock

The full masterplan is future vision. The active first-launch scope is locked in `docs/FIRST_LAUNCH_MVP_LOCK.md`.

First launch must prove one loop:

```text
GitHub / Markdown docs / manual notes / agent chat paste
  -> Company Brain
  -> MemoryIgnition
  -> Inheritance Contract
  -> Inheritance Package
  -> AgentRun + Agent Black Box
  -> Outcome Capture
  -> Future Instruction
  -> Mistake Immunity
  -> Skill Installed
  -> Evaluation Replay Proof
```

Do not prioritize Agent Workforce OS, Marketplace, Robot / Machine Inheritance, Web No-API Layer, Compliance Evidence Room, Cost Governor, or Model Router before this loop proves that the second agent avoids the first agent's mistake.

memoryosTM is AI Agent Inheritance Infrastructure for AI-native companies.

```text
Agents execute.
memoryosTM makes them inherit, act safely, prove work, and compound.
```

## Product promise

Make every AI agent work like it already knows your company.

memoryosTM connects company sources, extracts trusted memory, builds agent-ready work context, governs what agents can do, tracks every run, captures outcomes, and turns each result into future-agent intelligence.

## Final product loop

```text
Company Sources
  → Source Ingestion Layer
  → Memory Extraction Engine
  → Knowledge Integrity Engine
  → Company Memory Graph
  → Work Graph
  → Policy-as-Code Engine
  → MemoryIgnition Control Plane
  → Universal Agent Inheritance Package
  → Agent Permission Runtime
  → Agent Work Blueprint
  → Delivery Layer
  → Any AI Agent
  → Agent Run Timeline
  → Agent Reliability Engine
  → Outcome Capture
  → Human Correction Loop
  → Future-Agent Instruction Compiler
  → Skill Library
  → Agent Workforce OS
  → Next agent works better
```

## Seven product pillars

Build every feature around these pillars:

1. **Inheritance** — agents inherit company knowledge before acting.
2. **Governance** — agents follow company rules.
3. **Execution** — agents do repeatable work.
4. **Proof** — every agent action is explainable.
5. **Evaluation** — agents are measured before trusted.
6. **Learning** — every run improves future runs.
7. **Scale** — companies operate many agents safely.

## First real production path

Do not build temporary demo logic.

Build this first:

```text
1. User creates workspace.
2. User imports GitHub repo, docs, and agent chat.
3. memoryosTM extracts structured memories.
4. User opens MemoryIgnition.
5. User asks to prepare an agent.
6. memoryosTM generates inheritance package.
7. User clicks Send Now.
8. AgentRun is created.
9. User captures outcome.
10. FutureAgentInstruction is created.
11. Next agent inherits the lesson.
```

This is the real product loop.

---

# Stage 1 — Real Product Foundation

## Goal

Create the foundation for the memoryosTM operating layer.

## Build

```text
auth
workspace
database schema
console shell
navigation
team roles
settings
```

## Required data models

```text
Workspace {
  id
  name
  ownerId
  plan
  region
  createdAt
}
```

## Required frontend shell

Left sidebar:

```text
Overview
MemoryIgnition
Agent Workforce
Agent Operations
Company Sources
Company Brain
Work Graph
Agent Runs
Experience
Future Instructions
Risk + Approval
Policy Center
Blueprints
Skill Library
Knowledge Integrity
Evaluation Lab
Web Agent Layer
Cost Governor
Compliance Room
Agent Access
Settings
```

Top bar:

```text
workspace selector
global command search
Create / Prepare Agent button
sync status
notifications
user avatar
```

## Acceptance criteria

Every page must answer:

```text
What is happening?
Why does it matter?
What proof exists?
What should the user do next?
What did the agent learn?
```

---

# Stage 2 — Source + Memory Core

## Goal

Turn company sources into trusted company memory.

## Build

```text
manual import
GitHub import
agent chat paste
source items
memory extraction
Company Brain
memory quality score
memory search
```

## Source Ingestion Layer

Sources to support first:

```text
GitHub
Markdown docs
agent chat paste
manual notes
```

Later sources:

```text
GitLab
Bitbucket
Slack
Linear
Jira
Notion
Confluence
Google Docs
Zendesk
Intercom
Sentry
Vercel
Cloudflare
AWS
DigitalOcean
PostHog
Datadog
browser sessions
meeting transcripts
customer feedback
```

## Source ingestion must do

```text
sync source
parse source
chunk source
extract metadata
detect source type
deduplicate
store proof
start memory extraction job
```

## Required data models

```text
Source {
  id
  workspaceId
  provider
  type
  status
  permissions
  lastSyncedAt
  createdAt
}
```

```text
SourceItem {
  id
  workspaceId
  sourceId
  type
  title
  content
  url
  metadata
  createdAt
}
```

```text
Memory {
  id
  workspaceId
  sourceItemId
  type
  title
  summary
  content
  proof
  confidenceScore
  freshnessScore
  qualityScore
  riskLevel
  relatedFiles
  relatedTests
  status
  createdAt
}
```

## Memory types

```text
decision
architecture
bug
incident
customer_pain
support_issue
risky_file
required_test
process
runbook_rule
approval_rule
agent_session
human_correction
future_instruction
workflow_candidate
```

## Memory requirements

Every memory must have:

```text
title
summary
type
source proof
confidence score
freshness score
quality score
related files
related tests
risk level
linked workflow
linked outcome
```

## Company Brain page

Build tabs:

```text
All
Decisions
Architecture
Bugs
Incidents
Customer Pain
Risky Files
Required Tests
Processes
Agent Sessions
Human Corrections
Future Instructions
```

Memory row must show:

```text
title
type
source
quality score
freshness
risk
used count
last used
status
```

---

# Stage 3 — MemoryIgnition Core

## Goal

Create the command center that prepares any agent to work safely.

## Build

```text
command center
task parser
memory retrieval
3 Things
package generator
trace proof
agent readiness score
Send Now
```

## MemoryIgnition flow

User types:

```text
Prepare any agent to fix this bug safely.
```

MemoryIgnition must:

```text
parse task
detect task type
find relevant memories
find past failures
find risky files
find required tests
find approval rules
check memory quality
check policies
build trace proof
calculate readiness
show 3 things
generate inheritance package
send now
create agent run
require outcome
```

## MemoryIgnition UI

Top:

```text
large command box
voice button
target agent selector
target format selector
autonomy level selector
safety mode selector
```

Command box placeholder:

```text
Prepare any agent to fix this safely...
```

After submit, show:

```text
3 Things panel
Agent Readiness Score
Memory Quality Score
Policy Check
Risk Warnings
Required Tests
Trace Proof
Package Preview
Send Now
```

3 Things panel:

```text
1. What the agent needs to know
2. What the agent must be careful about
3. What the agent should do next
```

Right panel:

```text
retrieved memories
past failures
risky files
required tests
approval rules
proof sources
```

Bottom actions:

```text
copy prompt
export JSON
send via MCP
create agent run
save as blueprint
```

## Universal Agent Inheritance Package

Required fields:

```text
package_id
workspace_id
task
why_it_matters
target_agent
target_format
safety_mode
autonomy_level
agent_readiness_score
memory_quality_score
agent_reliability_score
context_summary
company_memory
repo_context
product_context
customer_context
support_context
browser_context
past_decisions
past_failed_attempts
past_successful_fixes
risky_files
required_tests
approval_rules
policy_rules
blocked_actions
tool_permissions
trace_proof
contradictions
recommended_first_action
agent_instructions
outcome_reporting_schema
future_agent_learning_instructions
```

Formats:

```text
Generic prompt
Cursor prompt
Codex prompt
Claude prompt
Devin brief
Windsurf prompt
Cline prompt
Aider prompt
OpenCode prompt
MCP JSON
API JSON
CLI output
SDK payload
Browser injection
IDE extension payload
Custom enterprise format
```

## Required data model

```text
InheritancePackage {
  id
  workspaceId
  task
  targetAgent
  targetFormat
  autonomyLevel
  safetyMode
  agentReadinessScore
  memoryQualityScore
  reliabilityScore
  payload
  proof
  createdAt
}
```

## API plan

```text
POST /api/memoryignition/prepare
POST /api/memoryignition/package
POST /api/memoryignition/send-now

GET /api/packages/:id
GET /api/packages/:id/proof
```

## Package acceptance criteria

Every package must show:

```text
what agent needs to know
what agent must be careful about
what agent should do next
why this context was selected
what proof supports it
what outcome must be reported
```

---

# Stage 4 — Outcome Learning Loop

## Goal

Every agent run must create proof, capture outcome, and improve the next run.

## Build

```text
AgentRun
AgentRunEvent
timeline
outcome capture
experience record
future-agent instruction
human correction loop
```

## Agent Run Timeline

Every package creates an AgentRun.

Timeline events:

```text
task_created
memory_retrieved
risk_detected
tests_recommended
policy_checked
package_generated
send_now_clicked
agent_started
agent_planned
file_read
file_changed
tool_called
command_run
approval_requested
approval_granted
approval_rejected
test_passed
test_failed
outcome_saved
human_corrected
future_instruction_created
skill_candidate_created
```

## Required data models

```text
AgentRun {
  id
  workspaceId
  packageId
  agentRoleId
  targetAgent
  status
  cost
  startedAt
  endedAt
  outcomeId
}
```

```text
AgentRunEvent {
  id
  workspaceId
  agentRunId
  type
  payload
  proof
  timestamp
}
```

```text
Outcome {
  id
  workspaceId
  agentRunId
  summary
  filesChanged
  testsPassed
  testsFailed
  worked
  failed
  humanCorrection
  futureLesson
  createdAt
}
```

```text
FutureAgentInstruction {
  id
  workspaceId
  triggerContext
  instruction
  affectedFiles
  requiredTests
  riskLevel
  proof
  status
  createdAt
}
```

## Outcome Capture

Outcome form asks:

```text
What did the agent do?
Which files changed?
Which tests passed?
Which tests failed?
What worked?
What failed?
Was human correction needed?
What should future agents remember?
Should this become a skill?
```

## Human Correction Loop

When a human corrects an agent, memoryosTM creates:

```text
CorrectionRecord
ExperienceRecord
FutureAgentInstruction
Risk update
Test update
Skill candidate
```

## API plan

```text
POST /api/agent-runs
GET /api/agent-runs/:id
POST /api/agent-runs/:id/events
GET /api/agent-runs/:id/timeline

POST /api/outcomes
GET /api/outcomes/:id

GET /api/future-instructions
POST /api/future-instructions/:id/approve
```

---

# Stage 5 — Governance

## Goal

Agents follow company rules before, during, and after execution.

## Build

```text
Risk Records
Approval Rules
Policy Center
Agent Permission Runtime
blocked actions
approval inbox
audit logs
```

## Agent Permission Runtime

Controls:

```text
what memory agent can access
what files agent can read
what files agent can write
what tools agent can call
what domains agent can open
what browser actions are allowed
what actions need approval
what actions are blocked
what outcome report is required
```

Modes:

```text
Observe
Draft
Assist
Sandbox Execute
Approval Execute
Policy Execute
Autonomous Workflow
```

## Policy-as-Code Engine

Policy examples:

```text
If task touches billing, require approval.
If task touches auth, require security reviewer.
If task touches database migration, force sandbox.
If memory quality is below 70, block Execute Mode.
If customer PII appears, redact before agent access.
If required tests are missing, block Send Now.
If stale memory is used, require human verification.
```

Policy actions:

```text
allow
warn
redact
require_approval
force_sandbox
require_tests
block
escalate
```

## Required data model

```text
Policy {
  id
  workspaceId
  name
  scope
  condition
  action
  severity
  status
  createdAt
}
```

## API plan

```text
GET /api/policies
POST /api/policies
POST /api/policies/check

GET /api/risks
POST /api/risks

GET /api/approvals
POST /api/approvals/:id/respond
```

---

# Stage 6 — Work Layer

## Goal

Turn agent preparation into repeatable company work.

## Build

```text
Work Graph
Blueprints
Bug Fix Blueprint
Support-to-Agent Blueprint
Agent Handoff Blueprint
Workflow run history
```

## Work Graph nodes

```text
business goal
customer pain
support issue
product decision
engineering task
workflow blueprint
agent role
agent run
outcome
future lesson
```

Example path:

```text
Customer pain
→ Signup email bug
→ Onboarding workflow
→ Coding Agent
→ Inheritance Package
→ Fix outcome
→ Future-agent instruction
```

## Agent Work Blueprints

Blueprints:

```text
Bug Fix Blueprint
Support-to-PR Blueprint
Incident Investigation Blueprint
Security Review Blueprint
Billing Debug Blueprint
Auth Risk Review Blueprint
PR Memory Update Blueprint
Agent Handoff Blueprint
Web Console Investigation Blueprint
Customer Pain-to-Agent Task Blueprint
Compliance Evidence Blueprint
```

Blueprint fields:

```text
trigger
goal
required memories
required tools
allowed actions
risk checks
approval rules
required tests
success criteria
output format
outcome schema
future learning rule
```

## Required data model

```text
WorkflowBlueprint {
  id
  workspaceId
  name
  trigger
  steps
  requiredMemories
  requiredTools
  riskChecks
  approvalRules
  successCriteria
  outcomeSchema
}
```

## API plan

```text
GET /api/blueprints
POST /api/blueprints/:id/run
```

---

# Stage 7 — Agent Workforce Layer

## Goal

Manage AI agent roles like company workers.

## Build

```text
Agent Roles
Agent Workforce page
Agent Operations Center
Agent Reliability Engine
Skill Library
Agent queues
```

## Agent roles

```text
Coding Agent
QA Agent
Security Agent
Support Agent
Infra Agent
Research Agent
Ops Agent
Billing Agent
Browser Agent
Founder Chief-of-Staff Agent
Custom Internal Agent
```

## Required data model

```text
AgentRole {
  id
  workspaceId
  name
  purpose
  allowedMemories
  allowedTools
  allowedDomains
  allowedActions
  blockedActions
  approvalRules
  defaultBlueprints
  evaluationRequirements
}
```

## Agent Workforce card fields

Each card shows:

```text
role
status
allowed tools
allowed memories
reliability score
runs completed
open tasks
cost this week
risk level
```

## Agent Operations Center

Top metrics:

```text
Active Runs
Queued Runs
Blocked Runs
Approvals Waiting
Risk Events
Failed Workflows
Cost Today
Reliability Average
```

Main table:

```text
run
agent
task
status
risk
policy result
current step
cost
started at
owner
```

Status badges:

```text
Preparing
Waiting Approval
Running
Blocked
Needs Outcome
Completed
Failed
Learning Created
```

## Agent Reliability Engine

Tracks:

```text
success rate
failure rate
human correction rate
test pass rate
risk violation rate
approval rejection rate
cost per successful run
repeated mistake rate
handoff quality
memory usefulness
```

Output:

```text
safe for Observe
safe for Draft
safe for Assist
safe for Sandbox Execute
not safe for Execute
needs more evaluation
```

## Skill Library

Every successful repeatable workflow can become a skill.

Skill lifecycle:

```text
candidate
review
approved
active
deprecated
```

Required data model:

```text
AgentSkill {
  id
  workspaceId
  name
  trigger
  requiredMemories
  requiredTools
  requiredTests
  approvalRules
  successRate
  version
  status
}
```

API plan:

```text
POST /api/agent-roles
GET /api/agent-roles

GET /api/skills
POST /api/skills/:id/approve
```

---

# Stage 8 — Developer Access

## Goal

Expose memoryosTM through MCP, API, SDK, CLI, webhooks, and custom agent formats.

## Build

```text
MCP server
API keys
SDK
CLI
webhooks
custom agent format
developer docs
```

## Agent Access page

Sections:

```text
API keys
MCP server setup
SDK install
CLI install
Webhooks
Custom agent formats
Browser extension
IDE extension
Docs
Examples
```

---

# Stage 8.5 — OpenClaw Execution Adapter

## Rule

Do not build this first.

First build:

```text
Source → Memory → MemoryIgnition → Package → AgentRun → Outcome
```

Then add:

```text
Package → OpenClaw → Execution → Outcome → Future Instruction
```

## Goal

Use OpenClaw as an execution runtime inside memoryosTM.

```text
memoryosTM prepares.
memoryosTM governs.
memoryosTM proves.
memoryosTM learns.

OpenClaw executes.
```

## Build

```text
OpenClaw target agent option
OpenClaw gateway connection
OpenClaw package formatter
OpenClaw Send Now
OpenClaw run record
OpenClaw timeline events
OpenClaw outcome capture
OpenClaw safety policy
OpenClaw skill allowlist
BYO model provider support
```

## OpenClaw UI placement

Add OpenClaw to MemoryIgnition target agent selector:

```text
Target Agent:
Any Agent
Cursor
Codex
Claude
Devin
Windsurf
Cline
OpenCode
OpenClaw
Custom Agent
```

When OpenClaw is selected, show:

```text
OpenClaw Gateway
OpenClaw Workspace
OpenClaw Skill
Model Provider
Execution Mode
Allowed Tools
Blocked Tools
Sandbox Required
Outcome Required
```

Buttons:

```text
Copy OpenClaw Prompt
Export OpenClaw JSON
Send Now to OpenClaw
Create OpenClaw AgentRun
```

## OpenClaw data models

```text
OpenClawIntegration {
  id
  workspaceId
  gatewayUrl
  workspaceName
  status
  authType
  encryptedCredentialRef
  defaultSkill
  defaultExecutionMode
  defaultModelProvider
  createdAt
  updatedAt
}
```

```text
OpenClawRun {
  id
  workspaceId
  agentRunId
  packageId
  integrationId
  openclawWorkspace
  openclawSkill
  modelProvider
  executionMode
  status
  result
  cost
  createdAt
  completedAt
}
```

```text
OpenClawRunEvent {
  id
  workspaceId
  openclawRunId
  type
  payload
  proof
  timestamp
}
```

## OpenClaw API plan

```text
POST /api/integrations/openclaw/connect
GET /api/integrations/openclaw/status
PATCH /api/integrations/openclaw/config
DELETE /api/integrations/openclaw/disconnect

POST /api/memoryignition/package/openclaw
GET /api/packages/:id/openclaw-prompt
GET /api/packages/:id/openclaw-json

POST /api/openclaw/send-now
POST /api/openclaw/send-test
GET /api/openclaw/runs
GET /api/openclaw/runs/:id
POST /api/openclaw/runs/:id/events
POST /api/openclaw/runs/:id/outcome
```

---

# Stage 9 — Web / No-API Layer

## Goal

Capture memory from web tools with no API.

## Build

```text
browser session capture
screenshot proof
structured extraction
web workflow recorder
scheduled web monitoring
console-to-agent brief
```

## Web Agent Layer tabs

```text
Browser Sessions
Web Workflows
Captured Screenshots
Structured Extractions
Monitoring Jobs
No-API Connectors
```

---

# Stage 10 — Evaluation + Cost

## Goal

Prove inheritance improves agents and control spending.

## Build

```text
Evaluation Lab
baseline vs inherited run
cost governor
model router
benchmark report
```

## Evaluation Lab

Experiment setup:

```text
choose task
choose agent
choose baseline prompt
choose inheritance package
run baseline
run inherited version
compare
```

Comparison metrics:

```text
success
time
cost
tests remembered
risks detected
human correction required
mistakes repeated
quality score
```

## Cost Governor

Metrics:

```text
tokens today
cost today
cost per run
cost per workflow
cost per successful outcome
wasted context
cost saved by inheritance
```

Recommendations:

```text
use cheaper model
compress memory
remove stale context
cache package
reuse runbook
reduce duplicate tool calls
```

---

# Stage 11 — Enterprise Trust

## Goal

Provide enterprise trust, audit, compliance, and deployment controls.

## Build

```text
Compliance Evidence Room
Enterprise Memory Topology
VPC/private deployment
SSO
retention controls
BYO LLM
BYO vector store
```

## Compliance Evidence Room

Evidence types:

```text
agent run evidence
approval evidence
policy evidence
test evidence
memory proof
source proof
outcome proof
incident proof
```

Export buttons:

```text
Export audit report
Export SOC2 packet
Export incident report
Export customer RCA
Export security review packet
```

## Enterprise Memory Topology

Deployment modes:

```text
Cloud workspace
Private cloud
VPC deployment
On-prem connector
Local memory index
Hybrid memory
Bring-your-own-vector-store
Bring-your-own-LLM
```

---

# Stage 12 — Advanced Autonomy

## Goal

Enable advanced autonomy after the governed memory-to-outcome loop is working.

## Build

```text
Execution Sandbox
Shadow Mode
Synthetic Company Simulator
Agent Contract Testing
Multi-Agent Inheritance
Autonomous Knowledge Discovery
```

---

# Frontend acceptance criteria

Every page must answer:

```text
What is happening?
Why does it matter?
What proof exists?
What should the user do next?
What did the agent learn?
```

Every card must have:

```text
title
status
score
timestamp
primary action
proof link
```

Every agent workflow must show:

```text
context
risk
policy
proof
action
outcome
learning
```

Every package must show:

```text
what agent needs to know
what agent must be careful about
what agent should do next
why this context was selected
what proof supports it
what outcome must be reported
```

---

# Final moat

```text
Every source improves memory.
Every memory improves inheritance.
Every inheritance improves execution.
Every execution creates proof.
Every proof improves trust.
Every outcome improves future agents.
Every correction becomes a skill.
Every skill improves the AI workforce.
Every workflow compounds the company.
```

# Final product sentence

memoryosTM is the Agent Workforce Operating Infrastructure for AI-native companies. It turns company knowledge into governed AI agent work, captures proof and outcomes from every run, and compounds those lessons into a safer, smarter AI workforce.
