export interface EpochConfig {
    apiKey: string;
    baseUrl?: string;
}
export type EpochWorkerKind = "software" | "ai_agent" | "simulated_edge" | "human";
export type EpochWorkerStatus = "available" | "busy" | "draining" | "offline" | "blocked" | "retired";
export interface EpochWorkerRegistration {
    kind: EpochWorkerKind;
    name: string;
    protocolVersion?: string;
    capabilities?: string[];
    projectScope?: Record<string, unknown>;
    maxConcurrency?: number;
    metadata?: Record<string, unknown>;
}
export interface EpochWorkerRecord extends EpochWorkerRegistration {
    id: string;
    workspaceId: string;
    status: EpochWorkerStatus;
    activeLeases: number;
    lastHeartbeat: string;
}
export interface EpochWorkerLeaseResult {
    jobs: Array<Record<string, unknown>>;
    fencingTokens: Record<string, number>;
    reason?: string;
}
export interface MemoryContractInput {
    goal?: string;
    constraints?: string[];
    decisions?: string[];
    open_risks?: string[];
    next_actions?: string[];
}
export interface MemoryItem {
    id: string;
    content?: string;
    memory?: string;
    memoryType?: string;
    contractCategory?: string;
    finalScore: number;
    updatedAt?: string;
    metadata?: Record<string, unknown>;
}
export interface BeforeModelInput {
    userId: string;
    question: string;
    task?: string;
    task_intent?: string;
    agent_id?: string;
    workspace_id?: string;
    repo_or_task?: string;
    risk_level?: string;
    available_tools?: string[];
    workspace?: string;
    project?: string;
    threadId?: string;
    mode?: "retrieve" | "resume";
    topK?: number;
    includeArchived?: boolean;
    related_reasoning_ids?: string[];
    reasoning_context?: {
        reasoning_id: string;
        task: string;
        source_type: string;
        source_ref: string;
        reasoning_quality?: {
            status: string;
            score: number;
        };
        linked_experiences?: Array<{
            task: string;
            source_ref: string;
        }>;
        recommended_first_action?: string;
    };
}
export interface BeforeModelResult {
    contextText: string;
    memories: MemoryItem[];
    source: "retrieve" | "resume";
    traceId?: string;
    workspace_id?: string;
    agent_id?: string;
    task_intent?: string;
    relevant_memories: MemoryIgnitionMemory[];
    executable_skills: MemoryIgnitionExecutableSkill[];
    past_mistakes: MemoryIgnitionMemory[];
    risky_files: string[];
    required_tests: string[];
    forbidden_actions: string[];
    approval_rules: MemoryIgnitionApprovalRules;
    recommended_first_action: string | null;
    trace_proof: MemoryIgnitionTraceProof[];
    outcome_hooks: string[];
    brief_proof_quality: MemoryIgnitionBriefProofQuality;
    evaluation_gate: MemoryIgnitionEvaluationGate;
    task_understanding: MemoryIgnitionTaskUnderstanding;
    target_agent: MemoryIgnitionTargetAgent;
    inheritance_sections: MemoryIgnitionInheritanceSections;
    past_failure_retrieval: MemoryIgnitionPastFailureRetrieval[];
    risky_file_retrieval: MemoryIgnitionRiskyFileRetrieval[];
    required_test_retrieval: MemoryIgnitionRequiredTestRetrieval[];
    approval_rule_retrieval: MemoryIgnitionApprovalRuleRetrieval[];
    skill_inheritance_proofs: MemoryIgnitionSkillInheritanceProof[];
    three_things: MemoryIgnitionThreeThings;
    ready_to_send_prompt: string;
    inheritance_ranking: MemoryIgnitionRankedInheritanceItem[];
    brief_quality_engine: MemoryIgnitionBriefQualityEngine;
    copy_to_agent: MemoryIgnitionCopyToAgent;
    related_experiences: MemoryIgnitionRelatedExperience[];
    experience_promotion_proofs: MemoryIgnitionExperiencePromotionProof[];
    experience_quality_gate: MemoryIgnitionExperienceQualityGate;
    memory_inheritance_readiness: MemoryInheritanceReadinessSummary;
    inheritance_gate: MemoryIgnitionInheritanceGate;
    inherited_memories: MemoryIgnitionGatedMemory[];
    review_memories: MemoryIgnitionGatedMemory[];
    blocked_memories: MemoryIgnitionGatedMemory[];
    skill_gate: MemoryIgnitionSkillSelectionGate;
    executable_skill_records: MemoryIgnitionGatedSkill[];
    review_skills: MemoryIgnitionGatedSkill[];
    blocked_skills: MemoryIgnitionGatedSkill[];
    standard_inheritance_package: MemoryIgnitionStandardInheritancePackage;
}
export type InheritanceReadinessStatus = "ready" | "review" | "blocked";
export interface MemoryInheritanceReadinessStep {
    id: "source" | "memory" | "evidence" | "contract" | "freshness" | "conflict" | "graph" | "brief";
    label: string;
    ok: boolean;
    detail: string;
}
export interface MemoryInheritanceReadiness {
    memoryId: string;
    sourceRef: string | null;
    status: InheritanceReadinessStatus;
    readyCount: number;
    totalCount: number;
    readyRatio: number;
    nextAction: string;
    steps: MemoryInheritanceReadinessStep[];
}
export interface MemoryInheritanceReadinessSummary {
    version: "inheritance_readiness.v1";
    total: number;
    ready: number;
    review: number;
    blocked: number;
    readyRatio: number;
    status: InheritanceReadinessStatus;
    nextActions: string[];
    memories: MemoryInheritanceReadiness[];
}
export interface MemoryIgnitionGatedMemory {
    memory: MemoryIgnitionMemory;
    readiness: MemoryInheritanceReadiness;
    reason: string;
}
export interface MemoryIgnitionInheritanceGate {
    version: "phase5.inheritance_gate.v1";
    status: "open" | "review_required" | "blocked";
    can_inherit: boolean;
    inherited_count: number;
    review_count: number;
    blocked_count: number;
    withheld_count: number;
    policy: "ready_and_review_only";
    next_actions: string[];
}
export type MemoryIgnitionSkillGateStatus = "executable" | "review" | "blocked";
export interface MemoryIgnitionSkillGateCheck {
    id: "approval" | "agent_compatibility" | "evidence" | "confidence" | "steps" | "freshness";
    label: string;
    ok: boolean;
    detail: string;
}
export interface MemoryIgnitionGatedSkill {
    skill: MemoryIgnitionExecutableSkill;
    status: MemoryIgnitionSkillGateStatus;
    reason: string;
    checks: MemoryIgnitionSkillGateCheck[];
}
export interface MemoryIgnitionSkillSelectionGate {
    version: "phase5.skill_gate.v1";
    status: "open" | "review_required" | "blocked";
    can_execute_skills: boolean;
    executable_count: number;
    review_count: number;
    blocked_count: number;
    withheld_count: number;
    policy: "approved_compatible_source_backed_only";
    next_actions: string[];
}
export interface MemoryIgnitionStandardInheritancePackage {
    version: "standard_inheritance_package.v1";
    generated_at: string;
    workspace_id: string | null;
    agent_id: string | null;
    delivery: "api" | "sdk" | "mcp" | "copy_prompt";
    task: {
        task: string;
        intent: string;
        risk_level: string;
        target_agent: string;
        source_mode: "retrieve" | "resume";
    };
    context: {
        recommended_first_action: string | null;
        relevant_memory_count: number;
        related_experience_count: number;
        executable_skill_count: number;
    };
    memories: Array<{
        id: string;
        summary: string;
        source_ref: string | null;
        contract_category?: string;
        confidence: number;
        files: string[];
    }>;
    review_memories: Array<{
        id: string;
        summary: string;
        source_ref: string | null;
        reason: string;
    }>;
    withheld_memories: Array<{
        id: string;
        source_ref: string | null;
        status: "ready" | "review" | "blocked";
        reason: string;
        failed_steps: Array<{
            id: string;
            label: string;
            detail: string;
        }>;
    }>;
    experiences: MemoryIgnitionRelatedExperience[];
    executable_skills: MemoryIgnitionExecutableSkill[];
    review_skills: Array<{
        id: string;
        name: string;
        reason: string;
    }>;
    withheld_skills: Array<{
        id: string;
        reason: string;
    }>;
    risk_rules: {
        risky_files: string[];
        forbidden_actions: string[];
        risk_signals: string[];
    };
    approval_rules: MemoryIgnitionApprovalRules;
    required_tests: string[];
    trace_proof: MemoryIgnitionTraceProof[];
    gates: {
        memory: MemoryIgnitionInheritanceGate;
        skill: MemoryIgnitionSkillSelectionGate;
        proof: MemoryIgnitionEvaluationGate;
    };
    outcome_contract: MemoryIgnitionOutcomeContract;
    outcome: {
        hooks: string[];
        save_required: boolean;
        contract: MemoryIgnitionOutcomeContract;
    };
}
export interface MemoryIgnitionOutcomeContract {
    version: "outcome_contract.v1";
    required: boolean;
    required_after: "agent_action";
    endpoint: "/api/memory/memoryignition/outcome";
    sdk_method: "memoryos.saveOutcome";
    mcp_tool: "memoryignition_save_outcome";
    required_fields: Array<"outcome_status" | "files_touched" | "tests_passed" | "tests_failed" | "what_worked" | "what_failed" | "future_agent_lesson">;
    optional_fields: Array<"used_skill_ids" | "risky_files_touched" | "approvals_used" | "trace_proof_ids">;
    hooks: string[];
    trace_lineage: "Inheritance Event -> Outcome -> Experience -> Future MemoryIgnition Brief";
    enforcement: "required_for_outcome_learning";
}
export interface MemoryIgnitionMemory {
    id: string;
    content: string;
    summary?: string;
    memory_type?: string;
    contract_category?: string;
    final_score: number;
    updated_at?: string;
    source_ref: string | null;
    files: string[];
    reason_tags: string[];
    freshness?: {
        status?: string | null;
    };
    conflict?: {
        status?: string | null;
    };
}
export interface MemoryIgnitionExecutableSkill {
    id: string;
    name: string;
    trigger: string;
    steps: string[];
    required_tests: string[];
    past_mistakes: string[];
    tools_allowed: string[];
    forbidden_actions: string[];
    approval_required: boolean;
    risk_level: string;
    evidence: string[];
    confidence: number;
    success_rate: number | null;
    supported_agent_types: string[];
    inheritance_rules: string[];
    status: "approved";
    version: string;
    source_experience_id: string;
    source_ref: string | null;
}
export interface MemoryIgnitionApprovalRules {
    risk_level: string;
    derived_risk_level: string;
    approval_required: boolean;
    reason: string;
    allowed_tools: string[];
    risk_signals: string[];
}
export interface MemoryIgnitionTraceProof {
    memory_id: string;
    source_type: string;
    source_ref: string | null;
    memory_type?: string;
    contract_category?: string;
    confidence: number;
    retrieved_at: string;
    reason_tags: string[];
    files: string[];
}
export interface MemoryIgnitionBriefProofQuality {
    score: number;
    grade: "A" | "B" | "C" | "D";
    status: "trusted" | "caution" | "weak" | "blocked";
    trusted: boolean;
    checks: Array<{
        id: string;
        label: string;
        ok: boolean;
        weight: number;
        detail: string;
    }>;
    missing_requirements: string[];
    recommendations: string[];
}
export interface MemoryIgnitionEvaluationGate {
    status: "trusted" | "caution" | "weak" | "blocked";
    can_inherit: boolean;
    can_execute: boolean;
    requires_human_review: boolean;
    reason: string;
    blockers: string[];
    warnings: string[];
    next_required_actions: string[];
}
export interface MemoryIgnitionTaskUnderstanding {
    task: string;
    task_intent: string;
    target_agent: string;
    source_mode: "retrieve" | "resume";
    risk_level: string;
    available_tools: string[];
}
export interface MemoryIgnitionTargetAgent {
    id: string;
    supported: boolean;
    delivery: "api" | "sdk" | "mcp" | "copy_prompt";
}
export interface MemoryIgnitionInheritanceSections {
    relevant_memory_count: number;
    past_failure_count: number;
    risky_file_count: number;
    required_test_count: number;
    approval_rule_count: number;
    trace_proof_count: number;
    approved_skill_count: number;
    outcome_hook_count: number;
}
export interface MemoryIgnitionPastFailureRetrieval {
    memory_id: string;
    summary: string;
    source_ref: string | null;
    confidence: number;
    files: string[];
    reason: string;
}
export interface MemoryIgnitionRiskyFileRetrieval {
    file: string;
    source_memory_ids: string[];
    approval_required: boolean;
    reason: string;
}
export interface MemoryIgnitionRequiredTestRetrieval {
    command: string;
    source: "memory" | "approved_skill";
    source_ids: string[];
    reason: string;
}
export interface MemoryIgnitionApprovalRuleRetrieval {
    risk_level: string;
    approval_required: boolean;
    reason: string;
    risk_signals: string[];
    allowed_tools: string[];
}
export interface MemoryIgnitionSkillInheritanceProof {
    skill_id: string;
    skill_name: string;
    version: string;
    approval_status: "approved";
    source_experience_id: string;
    source_ref: string | null;
    evidence: string[];
    required_tests: string[];
    inheritance_rules: string[];
    supported_agent_types: string[];
    confidence: number;
    success_rate: number | null;
    lineage: "Experience -> Skill -> Approval -> MemoryIgnition Brief";
}
export type MemoryIgnitionRankedInheritanceKind = "memory" | "past_failure" | "risky_file" | "required_test" | "approval_rule" | "approved_skill";
export interface MemoryIgnitionRankedInheritanceItem {
    id: string;
    kind: MemoryIgnitionRankedInheritanceKind;
    title: string;
    source_ref: string | null;
    score: number;
    confidence: number;
    proof_complete: boolean;
    freshness: "fresh" | "aging" | "stale" | "unknown";
    why_selected: string[];
    agent_instruction: string;
    source_ids: string[];
    files: string[];
}
export interface MemoryIgnitionBriefQualityEngine {
    version: "phase3.v1";
    generated_at: string;
    readiness: "trusted" | "review_required" | "blocked";
    task_relevance_score: number;
    proof_coverage: number;
    top_reasons: string[];
    missing_core_sections: string[];
    ranking_policy: string;
}
export interface MemoryIgnitionCopyToAgent {
    target_agent: string;
    delivery: "api" | "sdk" | "mcp" | "copy_prompt";
    prompt: string;
    outcome_required: boolean;
    setup_hint: string;
}
export interface MemoryIgnitionThreeThings {
    version: "memoryignition_three_things.v1";
    what_agent_needs_to_know: string[];
    what_agent_must_be_careful_about: string[];
    what_agent_should_do_next: string[];
    readiness_summary: string;
}
export interface MemoryIgnitionRelatedExperience {
    experience_id: string;
    task: string;
    problem: string | null;
    context: string | null;
    action: string | null;
    mistake: string | null;
    outcome: string | null;
    lesson: string | null;
    future_agent_instruction: string | null;
    evidence: string[];
    files: string[];
    tests: string[];
    risk_level: string | null;
    source_ref: string | null;
    confidence: number;
    quality_status: "ready_for_inheritance" | "needs_evidence" | "stale" | "conflicting";
    why_selected: string[];
    trace_lineage: "Source -> Outcome -> Experience -> Next MemoryIgnition Brief";
}
export interface MemoryIgnitionExperiencePromotionProof {
    version: "memoryignition_experience_promotion.v1";
    promoted: boolean;
    experience_record_id: string | null;
    source_outcome_event_id: string | null;
    source_send_event_id: string | null;
    source_ref: string | null;
    lineage: "Outcome Proof -> Experience Record -> MemoryIgnition Brief";
    evidence: string[];
    missing_evidence: string[];
    future_agent_instruction: string | null;
    next_brief_query: string;
}
export interface MemoryIgnitionExperienceQualityGate {
    version: "phase5.v1";
    total_related_experiences: number;
    ready_for_inheritance: number;
    needs_evidence: number;
    stale: number;
    conflicting: number;
    selected_experience_ids: string[];
    next_actions: string[];
}
export interface AfterModelInput {
    userId: string;
    message?: string;
    threadId?: string;
    modelResponse?: string;
    workspace_id?: string;
    agent_id?: string;
    repo_or_task?: string;
    task_intent?: string;
    outcome?: string;
    outcome_status?: string;
    files_touched?: string[];
    tests_passed?: string[];
    tests_failed?: string[];
    what_worked?: string;
    what_failed?: string;
    future_agent_lesson?: string;
    tool_calls?: string[];
    used_skill_ids?: string[];
    skill_ids?: string[];
    approvals_used?: string[];
    risky_files_touched?: string[];
    trace_proof_ids?: string[];
    relatedReasoningIds?: string[];
    send_event_id?: string;
    target_agent?: string;
    target_format?: string;
    risk_level?: string;
    contract?: MemoryContractInput;
    enforceContract?: boolean;
}
export interface AfterModelResult {
    acceptedCount: number;
    rejectedCount: number;
    contractFieldCount?: number;
    traceId?: string;
    governanceApplied?: GovernancePolicyApplied;
    outcome_recorded?: boolean;
    experience_draft?: {
        problem: string | null;
        context: string | null;
        action: string | null;
        mistake: string | null;
        outcome: string | null;
        lesson: string | null;
        status: "draft";
    };
    experience_timeline?: Array<{
        step: "outcome_captured" | "action_memory" | "execution_outcome" | "experience_record" | "skill_outcome";
        status: "recorded" | "skipped";
        detail: string;
        ref?: string;
        recorded_at: string;
    }>;
    trace_proof?: Array<{
        accepted_memory_id?: string;
        action_memory_id?: string;
        execution_outcome_id?: string;
        experience_record_id?: string;
        skill_id?: string;
        source_type: "after_model" | "action_memory" | "execution_outcome" | "experience_record" | "skill_outcome";
        source_ref: string;
        recorded_at: string;
    }>;
    action_memory_id?: string;
    execution_outcome_id?: string;
    experience_record_id?: string;
    skill_outcomes?: Array<{
        skill_id: string;
        status: string;
        confidence: number;
        success_rate: number | null;
    }>;
    outcome_proof: {
        version: "memoryignition_outcome_proof.v1";
        outcome_event_id: string;
        send_event_id: string | null;
        target_agent: string | null;
        target_format: string | null;
        source_ref: string;
        lineage: "Send Now -> Agent Work -> Outcome -> Experience -> Future-Agent Inheritance";
        outcome_recorded: boolean;
        future_inheritance_ready: boolean;
        memory_updated: boolean;
        experience_updated: boolean;
        skill_confidence_updated: boolean;
        approvals_used: string[];
        evidence: string[];
        missing_evidence: string[];
        next_brief_query: string;
    };
    approval_outcome_links?: Array<{
        approval_id: string;
        status: "pending" | "approved" | "rejected";
        outcome_links: MemoryIgnitionApprovalOutcomeLink[];
    }>;
    experience_promotion: MemoryIgnitionExperiencePromotionProof;
    outcome_learning: {
        version: "phase4.v1";
        status: "recorded" | "partial" | "skipped";
        future_inheritance_ready: boolean;
        experience_record_id: string | null;
        lesson_stored: string | null;
        future_agent_instruction: string | null;
        next_brief_query: string;
        trace_complete: boolean;
        learning_signals: string[];
        missing_signals: string[];
    };
    outcome_learning_gate: MemoryIgnitionOutcomeLearningGate;
}
export interface MemoryIgnitionOutcomeLearningGateCheck {
    id: "outcome" | "action_memory" | "execution_outcome" | "experience" | "lesson" | "files" | "tests" | "skill_outcome" | "approval";
    label: string;
    ok: boolean;
    required: boolean;
    detail: string;
}
export interface MemoryIgnitionOutcomeLearningGate {
    version: "phase4.outcome_gate.v1";
    status: "ready" | "partial" | "blocked";
    future_inheritance_ready: boolean;
    can_update_memory: boolean;
    can_update_experience: boolean;
    can_update_skill_confidence: boolean;
    score: number;
    checks: MemoryIgnitionOutcomeLearningGateCheck[];
    promoted_signals: string[];
    blocked_updates: string[];
    next_actions: string[];
}
export interface RetrieveResult {
    memories: MemoryItem[];
}
export interface ProcessMemoryResult {
    traceId?: string;
    acceptedMemories: MemoryItem[];
    rejectedMemories: MemoryItem[];
    contract?: MemoryContractInput | null;
    contractFieldCount?: number;
    governance?: GovernancePolicyApplied;
}
export interface GovernancePolicyApplied {
    ttlHours: number;
    pinCriticalDecisions: boolean;
    redactSecrets: boolean;
    mode: "balanced" | "strict" | "enterprise";
}
export interface ResumeInput {
    userId: string;
    project: string;
    question: string;
    workspace?: string;
    threadId?: string;
    topK?: number;
    includeArchived?: boolean;
}
export interface ResumeResult {
    summary: string;
    lastKnownState: string;
    openLoops: string[];
    recommendedNextStep: string;
    usedMemories: MemoryItem[];
}
export interface HandoffInput {
    userId: string;
    project: string;
    question: string;
    workspace?: string;
    threadId?: string;
    topK?: number;
    includeArchived?: boolean;
}
export interface HandoffResult {
    handoffTitle: string;
    summary: string;
    lastKnownState: string;
    nextRecommendedAction: string;
    openLoops: string[];
    keyDecisions: string[];
    risks: string[];
    usedMemories: MemoryItem[];
}
export type MemoryIgnitionBriefInput = Omit<BeforeModelInput, "userId" | "question"> & {
    userId?: string;
    question?: string;
};
export type MemoryIgnitionSendNowTargetFormat = "human_prompt" | "agent_prompt" | "codex_prompt" | "cursor_prompt" | "claude_prompt" | "devin_task" | "mcp_response" | "api_json" | "cli_output" | "custom_json";
export type MemoryIgnitionSendNowInput = MemoryIgnitionBriefInput & {
    target_agent?: string;
    target_format?: MemoryIgnitionSendNowTargetFormat;
    safety_mode?: "fast" | "balanced" | "strict";
};
export interface MemoryIgnitionSendNowResult {
    version: "memoryignition_send_now.v1";
    send_event_id: string;
    sent_at: string;
    target_agent: string;
    target_format: MemoryIgnitionSendNowTargetFormat;
    target_format_label: string;
    safety_mode: "fast" | "balanced" | "strict";
    delivery: "api" | "sdk" | "mcp" | "copy_prompt";
    outcome_required: boolean;
    preview: string;
    payload: string;
    json_package: {
        target_agent: string;
        target_format: MemoryIgnitionSendNowTargetFormat;
        safety_mode: "fast" | "balanced" | "strict";
        three_things: MemoryIgnitionThreeThings;
        standard_inheritance_package: MemoryIgnitionStandardInheritancePackage;
        outcome_contract: MemoryIgnitionOutcomeContract;
        reasoning_context?: {
            reasoning_id: string;
            task: string;
            source_type: string;
            source_ref: string;
            reasoning_quality?: {
                status: string;
                score: number;
            };
            linked_experiences?: Array<{
                task: string;
                source_ref: string;
            }>;
            recommended_first_action?: string;
        } | null;
    };
    standard_inheritance_package: MemoryIgnitionStandardInheritancePackage;
    three_things: MemoryIgnitionThreeThings;
    readiness: {
        score: number;
        status: MemoryIgnitionEvaluationGate["status"];
        can_execute: boolean;
        approval_required: boolean;
        risk_level: string;
    };
    next: string;
    brief: BeforeModelResult;
}
export type MemoryIgnitionActionInput = MemoryIgnitionBriefInput & {
    current_files?: string[];
    proposed_action?: string;
    action?: string;
    tool_name?: string;
    command?: string;
};
export type MemoryIgnitionRiskCheckInput = MemoryIgnitionActionInput;
export interface MemoryIgnitionApprovalOutcomeLink {
    outcomeEventId: string;
    sourceRef: string;
    sendEventId: string | null;
    targetAgent: string | null;
    targetFormat: string | null;
    futureInheritanceReady: boolean;
    evidence: string[];
    linkedAt: string;
}
export interface MemoryIgnitionApprovalRequest {
    id: string;
    userId: string;
    orgId?: string | null;
    source: "memoryignition_guard";
    runtimeEventId: string;
    guardMoment: "before_agent" | "before_action" | "during_action" | "risk_check";
    action: string;
    status: "pending" | "approved" | "rejected";
    riskLevel: string;
    reason: string;
    approvalRequired: boolean;
    blocked: boolean;
    matchedRiskyFiles: string[];
    matchedForbiddenActions: string[];
    missingRequiredTests: string[];
    nextRequiredActions: string[];
    traceProofIds: string[];
    guardProof: Record<string, unknown>;
    outcomeLinks: MemoryIgnitionApprovalOutcomeLink[];
    createdAt: string;
    updatedAt: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
    reviewNote: string | null;
}
export interface MemoryIgnitionActionGuard {
    action: string;
    allowed: boolean;
    blocked: boolean;
    approval_required: boolean;
    approval_satisfied?: boolean;
    risk_level: string;
    gate_status: string;
    reason: string;
    risky_files: string[];
    required_tests: string[];
    forbidden_actions: string[];
    recommended_first_action: string | null;
    next_required_actions: string[];
    matched_risky_files: string[];
    matched_forbidden_actions: string[];
    missing_required_tests: string[];
    approval_request?: MemoryIgnitionApprovalRequest | null;
    runtime_policy?: MemoryIgnitionRuntimePolicy;
    guard_proof: {
        version: "memoryignition_guard_proof.v1";
        status: "allowed" | "approval_required" | "blocked";
        moment: "before_agent" | "before_action" | "during_action" | "risk_check";
        action: string;
        allowed: boolean;
        blocked: boolean;
        approval_required: boolean;
        reason: string;
        checks: Array<{
            id: "brief_gate" | "tool_permission" | "risky_files" | "forbidden_actions" | "approval" | "required_tests" | "trace_proof";
            label: string;
            ok: boolean;
            detail: string;
        }>;
        matched_risky_files: string[];
        matched_forbidden_actions: string[];
        missing_required_tests: string[];
        runtime_policy?: MemoryIgnitionRuntimePolicy;
        governance_decision?: MemoryIgnitionGuardianGovernanceDecision;
        trace_proof_ids: string[];
        next_required_actions: string[];
    };
}
export interface MemoryIgnitionGuardianGovernanceDecision {
    version: "memoryignition_guardian_governance_decision.v1";
    status: "allowed" | "approval_required" | "blocked";
    allowed: boolean;
    blocked: boolean;
    approval_required: boolean;
    approval_sources: string[];
    blocking_sources: string[];
    runtime_policy_id: string;
    runtime_policy_source?: "request" | "agent_policy" | "risk_policy" | "workspace_default";
    approval_policy_id?: string | null;
    denied_tools: string[];
    matched_risky_files: string[];
    matched_forbidden_actions: string[];
    missing_required_tests: string[];
    reason: string;
    next_required_actions: string[];
}
export interface MemoryIgnitionRuntimePolicy {
    version: "memoryignition_runtime_policy.v1";
    moment: "before_agent" | "before_action" | "during_action" | "risk_check";
    policy_settings_version?: "memoryignition_runtime_policy_settings.v1";
    policy_settings_id?: string;
    policy_source?: "request" | "agent_policy" | "risk_policy" | "workspace_default";
    policy_id?: string;
    policy_updated_at?: string;
    approval_required_by_policy?: boolean;
    approval_policy_id?: string | null;
    approval_reason?: string | null;
    agent_id: string | null;
    agent_type: string | null;
    allowed_tools: string[];
    requested_tool: string | null;
    requested_command: string | null;
    tool_permissions_declared: boolean;
    tool_allowed: boolean;
    denied_tools: string[];
    status: "satisfied" | "blocked";
    checks: Array<{
        id: "agent_identity" | "tool_permission";
        label: string;
        ok: boolean;
        detail: string;
    }>;
    next_required_actions: string[];
}
export interface MemoryIgnitionInternalAgents {
    intent_agent: {
        status: string;
        task_intent: string;
        target_agent: string;
        risk_level: string;
    };
    retrieval_agent: {
        status: string;
        relevant_memories: number;
        past_failures: number;
        trace_proofs: number;
    };
    skill_selector_agent: {
        status: string;
        approved_skills: number;
        skill_proofs: number;
    };
    guardian_agent: {
        status: string;
        approval_required: boolean;
        risky_files: number;
        required_tests: number;
        forbidden_actions: number;
        denied_tools?: number;
    };
    outcome_agent: {
        status: string;
        hooks: string[];
    };
}
export type MemoryIgnitionActionResult = BeforeModelResult & {
    runtime_event_id: string;
    runtime_moment: "before_agent" | "before_action" | "during_action" | "risk_check";
    runtime_policy: MemoryIgnitionRuntimePolicy;
    action_guard: MemoryIgnitionActionGuard;
    internal_agents: MemoryIgnitionInternalAgents;
};
export interface MemoryIgnitionRiskCheckResult {
    allowed: boolean;
    risk_level: string;
    approval_required: boolean;
    approval_rules: MemoryIgnitionApprovalRules;
    risky_files: string[];
    required_tests: string[];
    forbidden_actions: string[];
    trace_proof: MemoryIgnitionTraceProof[];
    recommended_first_action: string | null;
    brief_proof_quality?: MemoryIgnitionBriefProofQuality;
    evaluation_gate?: MemoryIgnitionEvaluationGate;
    skill_inheritance_proofs?: MemoryIgnitionSkillInheritanceProof[];
    standard_inheritance_package?: MemoryIgnitionStandardInheritancePackage;
    action_guard?: MemoryIgnitionActionGuard;
    internal_agents?: MemoryIgnitionInternalAgents;
}
export type MemoryIgnitionOutcomeInput = Omit<AfterModelInput, "userId"> & {
    userId?: string;
};
export type MemoryIgnitionHandoffInput = Omit<HandoffInput, "userId"> & {
    userId?: string;
};
export interface MemoryTraceProofResult {
    memoryId: string;
    summary: string;
    contractCategory: string | null;
    companyBrainType: string | null;
    sourceRef: string | null;
    traceProof: unknown;
    freshness: unknown;
    conflict: unknown;
    graph: unknown;
    entities: unknown[];
    relations: unknown[];
    proofQuality: unknown;
    proofComplete: boolean;
    lineage: string;
}
export interface MemoryExperienceQueryInput {
    query?: string;
    limit?: number;
    verdict?: "PASS" | "FAIL" | "UNKNOWN";
}
export interface MemoryExperienceSearchItem {
    id: string;
    title: string;
    summary: string;
    lesson: string;
    rootCause: string;
    bestPractice: string;
    antiPattern: string;
    correctSolution: string;
    repository: string;
    pullRequestNumber: number;
    pullRequestTitle: string;
    verdict: "PASS" | "FAIL" | "UNKNOWN";
    confidence: number;
    language: string;
    framework: string;
    files: string[];
    wrongAttempts: string[];
    tests: string[];
    createdAt: string;
    updatedAt: string;
    score: number;
    matchReasons: string[];
}
export interface MemoryExperienceSearchResult {
    query: string;
    total: number;
    results: MemoryExperienceSearchItem[];
}
export interface MemoryExperienceGroupItem {
    id: string;
    title: string;
    count: number;
    confidence: number;
    repositories: string[];
    verdicts: Array<"PASS" | "FAIL" | "UNKNOWN">;
    rootCause: string;
    lesson: string;
    antiPattern: string;
    language: string;
    framework: string;
    files: string[];
    pullRequestNumbers: number[];
    latestAt: string;
    example: {
        id: string;
        repository: string;
        pullRequestTitle: string;
        pullRequestNumber: number;
    } | null;
}
export interface MemoryExperienceLessonsResult {
    query: string;
    total: number;
    lessons: MemoryExperienceGroupItem[];
}
export interface MemoryExperienceFailurePatternsResult {
    query: string;
    total: number;
    patterns: MemoryExperienceGroupItem[];
}
export interface MemoryExperienceRootCausesResult {
    query: string;
    total: number;
    rootCauses: MemoryExperienceGroupItem[];
}
export interface MemoryExperienceSimilarityItem {
    id: string;
    title: string;
    repository: string;
    pullRequestNumber: number;
    pullRequestTitle: string;
    verdict: "PASS" | "FAIL" | "UNKNOWN";
    confidence: number;
    score: number;
    similarity: number;
    reasoning: string[];
    rootCause: string;
    lesson: string;
    bestPractice: string;
    antiPattern: string;
    language: string;
    framework: string;
    files: string[];
    createdAt: string;
}
export interface MemoryExperienceSimilarityResult {
    query: string;
    experienceId: string | null;
    total: number;
    results: MemoryExperienceSimilarityItem[];
}
export interface MemoryExperienceRecommendationItem {
    id: string;
    type: "lesson" | "failure_pattern" | "root_cause" | "next_action";
    title: string;
    reason: string;
    recommendedAction: string;
    confidence: number;
    count: number;
    repositories: string[];
    verdicts: Array<"PASS" | "FAIL" | "UNKNOWN">;
    exampleExperienceIds: string[];
    latestAt: string;
}
export interface MemoryExperienceRecommendationResult {
    query: string;
    total: number;
    recommendations: MemoryExperienceRecommendationItem[];
}
