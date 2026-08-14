export interface Command {
 id: string;
 title: string;
 shortcut?: string[];
 handler: () => void;
 visibility: 'global' | 'runtime_specific';
 runtimeId?: string;
}

class KernelCommandRegistry {
 private commands: Map<string, Command> = new Map();

 register(command: Command) {
 this.commands.set(command.id, command);
 }

 unregister(id: string) {
 this.commands.delete(id);
 }

 getAll(activeRuntimeId?: string): Command[] {
 return Array.from(this.commands.values()).filter(c => 
 c.visibility === 'global' || c.runtimeId === activeRuntimeId
 );
 }
}

export const GlobalCommandRegistry = new KernelCommandRegistry();
