export interface EpochApiConfig {
    baseUrl: string;
    apiKey?: string;
}
export declare class EpochApiClient {
    private readonly baseUrl;
    private readonly apiKey?;
    constructor(config: EpochApiConfig);
    private request;
    getAgentAccessStatus(): Promise<unknown>;
    getMcpTools(): Promise<unknown>;
    invokeMcpTool(name: string, input?: Record<string, unknown>): Promise<unknown>;
}
export declare function createEpochApiClient(config: EpochApiConfig): EpochApiClient;
