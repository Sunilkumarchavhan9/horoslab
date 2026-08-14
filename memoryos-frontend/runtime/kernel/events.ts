export interface RuntimeEvent {
 id: string;
 runtime: string; // The ID of the runtime that emitted this
 type: string;
 payload: unknown;
 timestamp: Date;
}
