# Epoch Design Philosophy

**Epoch does not manage records. Epoch operates institutions.** 
Every runtime exists to observe, govern, execute, verify, or evolve a living programmable organization. If a UI behaves like CRUD software, redesign it until it behaves like an operating system.

## Design Rules
- One runtime.
- One workspace.
- One toolbar.
- One canvas.
- One inspector.
- No floating dashboard cards.
- Panels over cards.
- Information over decoration.
- Runtime over CRUD.
- Relationships over forms.
- Cause and effect must always be visible.
- Every page answers one operational question.
- Every action updates another runtime.

---

# Epoch Mission Runtime Design Philosophy

**Core Philosophy:** A Mission is not a task. A Mission is an institutional operation.

Every page in the Mission Runtime must exist to answer **exactly one operational question**. Do not let pages overlap. The flow should be a continuous operational story: `plan → execute → verify → update institutional reality`.

## The 9 Operational Perspectives

1. **Overview:** *What is the operational state of my institution?*
   - Should feel like a Mission Command Center, not a KPI dashboard.
   - Show Mission Health, Running Operations, Critical/Suggested Missions, Institution Status, and Recent Changes.

2. **Planner:** *What should happen?*
   - Not a form. Should feel like planning an operation.
   - Flow: Objective → Generated Mission Plan → Required Agents → Required Permissions → Estimated Impact → Verification Plan → Launch.

3. **Active Missions:** *What is currently executing?*
   - A portfolio view.
   - Show Mission, Owner, Institution, Progress, ETA, Health, Priority. Clicking opens Execution.

4. **Mission Templates:** *What operations can I reuse?*
   - Not pretty cards. Think operational playbooks (Security, Infrastructure, HR).
   - Show objective, required agents, policies, expected duration.

5. **Queue:** *What is waiting?*
   - About blocked work. Show *why* it's waiting.
   - Show Mission, Waiting For, Priority, Dependencies, Scheduled Time, Estimated Start.

6. **Automation:** *What launches automatically?*
   - Every row answers: Event → Mission → Result.
   - Very operational (e.g. GitHub Push → Dependency Scan → Security Mission).

7. **Timeline:** *What happened recently?*
   - An operational narrative, not raw logs.
   - Flow: Mission Started → Evidence Created → Policy Evaluated → Verification Passed → Reality Updated. This is the live event stream.

8. **Mission History:** *What happened in the past?*
   - The archive. Searchable, Auditable.

9. **Execution:** *How is this mission executing?*
   - The signature page. The Command Center for a specific mission.
   - Flow: Mission → Execution Flow → Agent Activity → Evidence → Verification → Reality Impact → Institution Updated.

---

# Epoch Institution Runtime Design Philosophy

**Core Philosophy:** An Institution is not a company profile. It is a living programmable organization composed of identity, governance, memory, policies, missions, agents, and evolution.
The Institution Runtime is the source of truth from which every other runtime derives its behavior:
- Reality observes the institution.
- Missions operate the institution.
- Agents execute for the institution.
- Verification protects the institution.
- Evolution changes the institution.

## The 8 Operational Perspectives

1. **Identity:** *Who is this institution?*
   - The canonical definition.
   - Layout: Institution, Mission, Purpose, Owners, Capabilities, Dependencies, Health, Current Version.

2. **Genome:** *What is the Institution DNA?*
   - Core traits (Mission, Risk Appetite, Decision Model, Authority, Learning, Budget, Communication, Memory). Changing Genome literally changes institutional behavior.

3. **Governance:** *Why does it behave this way?*
   - Every policy should answer Why? -> Scope -> Verification -> Affected Missions -> Affected Agents -> Evidence.

4. **Hierarchy:** *How is it organized?*
   - Business Unit -> Department -> Team -> Agent Pool -> Mission. Structure of the organization.

5. **Versions:** *What changed?*
   - Not version numbers. Institution history (v14 -> Policy Updated -> Mission Runtime Added -> Genome Changed -> Approved). Git history for organizations.

6. **Proposals:** *What should change?*
   - Treat like GitHub Pull Requests.
   - Institution Change -> Impact -> Genome -> Policies -> Affected Missions -> Approval -> Merge.

7. **Evolution:** *How has this institution evolved?*
   - The signature page. An evolution graph.
   - Founded -> Genome Updated -> Mission Runtime -> New Agents -> Verification -> Today.

8. **Templates:** *How do we create one?*
   - Think operating models (Engineering Company, Research Lab, Bank). Templates become organizational blueprints.

## Epoch Scorecard

Evaluate all UI and architecture against this scorecard. A score of 10/10 across these dimensions guarantees it feels like Epoch.

- **Engineering Quality:** 10/10
- **Design Quality:** 10/10
- **Enterprise Trust:** 10/10
- **Runtime Experience:** 10/10
- **Operational Clarity:** 10/10
- **Information Density:** 10/10
- **Explainability:** 10/10
- **Cross Runtime Integration:** 10/10
- **Institution Identity:** 10/10
- **Interaction Quality:** 10/10
- **Product Memorability:** 10/10
- **Scalability:** 10/10

---

# Epoch Agent Runtime Design Philosophy

**Core Philosophy:** Agents are not chatbots. They are institutional capabilities executed under temporary authority.

An Agent is a leased operational capability that executes missions on behalf of an institution under policies, verification, and authority constraints.
They do not exist independently. They inherit identity, permissions, memory, and governance from the Institution Runtime.

Every Agent Runtime view must answer one operational question:
- Who is this agent?
- What can it do?
- What is it doing?
- What authority has it been granted?
- What evidence has it produced?
- Can its actions be verified?


---

# Epoch Execution Runtime Philosophy

**Core Philosophy:** Execution is not a workflow engine. It is the institutional runtime that transforms approved plans into verified outcomes. Execution does not merely complete work. It continuously proves that work was performed correctly. Every execution step must leave behind evidence, every decision must be explainable, and every outcome must be verifiable.

Every perspective answers exactly one operational question:
- Planner: What should execute?
- Workers: Who is executing?
- Evidence: What proof has execution produced?
- Validation: What has been evaluated?
- Approvals: What still requires human authority?
- Timeline: What happened during execution?
- Runtime: Is the institution capable of executing work?

---

# Epoch Developer Runtime Philosophy

**Core Philosophy:** Developers do not integrate with Epoch. They extend the Institution Operating System.

Every SDK, API, MCP Server, Verifier, and Extension is a programmable capability.
Every extension must be observable.
Every extension must be verifiable.
Every extension must inherit institutional governance.

Developer Runtime exists to make institutions programmable, not applications.

Every page in the Developer Runtime must feel technical, dense, and fast, answering:
- SDK: How do I build?
- MCP: How do AI systems connect?
- API Keys: Who can access?
- Webhooks: How do events leave Epoch?
- API Watcher: What external APIs changed?
- Verifiers: How do I verify?
- Extensions: How do I extend the institution?
