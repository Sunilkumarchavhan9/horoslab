import { AfterModelInput, AfterModelResult, BeforeModelInput, BeforeModelResult, HandoffInput, HandoffResult, MemoryIgnitionBriefInput, MemoryIgnitionActionInput, MemoryIgnitionActionResult, MemoryIgnitionHandoffInput, MemoryIgnitionOutcomeInput, MemoryIgnitionRiskCheckInput, MemoryIgnitionRiskCheckResult, MemoryIgnitionSendNowInput, MemoryIgnitionSendNowResult, MemoryIgnitionStandardInheritancePackage, MemoryExperienceFailurePatternsResult, MemoryExperienceLessonsResult, MemoryExperienceQueryInput, MemoryExperienceRootCausesResult, MemoryExperienceRecommendationResult, MemoryExperienceSimilarityResult, MemoryExperienceSearchResult, MemoryTraceProofResult, EpochConfig, ResumeInput, ResumeResult, EpochWorkerRecord, EpochWorkerRegistration, EpochWorkerLeaseResult } from "./types";
export declare class EpochClient {
    private apiKey;
    private baseUrl;
    constructor(config: EpochConfig);
    private request;
    /**
     * Create the standard MemoryIgnition inheritance package before an agent acts.
     */
    createBrief(input: MemoryIgnitionBriefInput): Promise<BeforeModelResult>;
    /**
     * Return only the canonical Standard Inheritance Package that API, SDK, and MCP agents should consume.
     */
    createInheritancePackage(input: MemoryIgnitionBriefInput): Promise<MemoryIgnitionStandardInheritancePackage>;
    /**
     * Format and record a Send Now event for a target agent or runtime.
     */
    sendNow(input: MemoryIgnitionSendNowInput): Promise<MemoryIgnitionSendNowResult>;
    /**
     * Prepare and guard one proposed action before the agent uses a tool or edits files.
     */
    beforeAction(input: MemoryIgnitionActionInput): Promise<MemoryIgnitionActionResult>;
    /**
     * Re-check risk while an agent is acting, using current files/action/tool context.
     */
    duringAction(input: MemoryIgnitionActionInput): Promise<MemoryIgnitionActionResult>;
    /**
     * Check risk, approvals, required tests, and trace proof before tool use.
     */
    riskCheck(input: MemoryIgnitionRiskCheckInput): Promise<MemoryIgnitionRiskCheckResult>;
    /**
     * Save an agent outcome so future agents inherit what worked and failed.
     */
    saveOutcome(input: MemoryIgnitionOutcomeInput): Promise<AfterModelResult>;
    /**
     * Create a MemoryIgnition handoff package for another future agent.
     */
    createHandoff(input: MemoryIgnitionHandoffInput): Promise<HandoffResult>;
    /**
     * Inspect why a memory can be inherited.
     */
    getTraceProof(memoryId: string): Promise<MemoryTraceProofResult>;
    private buildExperienceQueryPath;
    /**
     * Search verified Mission Control experiences.
     */
    searchExperiences(input?: MemoryExperienceQueryInput): Promise<MemoryExperienceSearchResult>;
    /**
     * List reusable lessons extracted from verified PR missions.
     */
    listExperienceLessons(input?: MemoryExperienceQueryInput): Promise<MemoryExperienceLessonsResult>;
    /**
     * List recurring failure patterns extracted from verified PR missions.
     */
    listFailurePatterns(input?: MemoryExperienceQueryInput): Promise<MemoryExperienceFailurePatternsResult>;
    /**
     * List root causes extracted from verified PR missions.
     */
    listRootCauses(input?: MemoryExperienceQueryInput): Promise<MemoryExperienceRootCausesResult>;
    /**
     * Find similar verified experiences to a specific mission or query.
     */
    findSimilarExperiences(input?: MemoryExperienceQueryInput & {
        experienceId?: string;
        repository?: string;
    }): Promise<MemoryExperienceSimilarityResult>;
    /**
     * Build experience-backed recommendations for the next verification or fix.
     */
    getExperienceRecommendations(input?: MemoryExperienceQueryInput & {
        repository?: string;
    }): Promise<MemoryExperienceRecommendationResult>;
    /**
     * Creates the standard MemoryIgnition inheritance package before calling an agent.
     */
    beforeModel(input: BeforeModelInput): Promise<BeforeModelResult>;
    /**
     * Processes messages after the LLM response to extract and save memories.
     */
    afterModel(input: AfterModelInput): Promise<AfterModelResult>;
    /**
     * Specific endpoint for resuming a project thread.
     */
    resume(input: ResumeInput): Promise<ResumeResult>;
    /**
     * Specific endpoint for generating a handoff.
     */
    handoff(input: HandoffInput): Promise<HandoffResult>;
    registerWorker(workspaceId: string, input: EpochWorkerRegistration): Promise<EpochWorkerRecord>;
    heartbeatWorker(workspaceId: string, workerId: string, input?: {
        status?: string;
        activeLeases?: number;
    }): Promise<EpochWorkerRecord>;
    leaseWorkerJobs(workspaceId: string, workerId: string, input?: {
        limit?: number;
        leaseMs?: number;
    }): Promise<EpochWorkerLeaseResult>;
    completeWorkerJob(workspaceId: string, jobId: string, workerId: string, fencingToken: number): Promise<Record<string, unknown>>;
}
export declare function createEpochClient(config: EpochConfig): EpochClient;
