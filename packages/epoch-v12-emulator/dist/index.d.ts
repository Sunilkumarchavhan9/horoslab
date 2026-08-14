#!/usr/bin/env node
export type EmulatorJob = {
    id: string;
    type: "plan" | "execute" | "verify";
    payload: Record<string, unknown>;
};
export type EmulatorResult = {
    workerId: string;
    leased: string[];
    completed: string[];
    fencingTokens: Record<string, number>;
};
export declare function runEpochV12Emulator(input: {
    workerId: string;
    jobs: EmulatorJob[];
}): EmulatorResult;
