import { AfterModelInput, AfterModelResult, BeforeModelInput, BeforeModelResult, HandoffInput, HandoffResult, MemoryOSConfig, ResumeInput, ResumeResult } from "./types";
export declare class MemoryOSClient {
    private apiKey;
    private baseUrl;
    constructor(config: MemoryOSConfig);
    private request;
    /**
     * Retrieves context and memories before calling the LLM.
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
}
export declare function createMemoryOSClient(config: MemoryOSConfig): MemoryOSClient;
