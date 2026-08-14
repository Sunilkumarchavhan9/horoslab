export interface Runtime {
 id: string;

 initialize(): Promise<void>;
 destroy(): Promise<void>;

 activate(): void;
 deactivate(): void;

 registerCommands(): void;
 registerEvents(): void;
}
