export interface RealityCommand {
 id: string;
 title: string;
 subtitle?: string;
 shortcut?: string[];
 action: () => void;
}

class CommandRegistryImpl {
 private commands: Map<string, RealityCommand> = new Map();

 register(command: RealityCommand) {
 this.commands.set(command.id, command);
 }

 unregister(id: string) {
 this.commands.delete(id);
 }

 getAll(): RealityCommand[] {
 return Array.from(this.commands.values());
 }
}

export const CommandRegistry = new CommandRegistryImpl();
