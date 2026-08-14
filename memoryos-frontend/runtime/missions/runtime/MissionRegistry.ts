export interface MissionPerspective {
 id: string;
 title: string;
 component: React.ComponentType;
 icon?: React.ReactNode;
}

class MissionPerspectiveRegistry {
 private perspectives = new Map<string, MissionPerspective>();

 register(perspective: MissionPerspective): void {
 if (this.perspectives.has(perspective.id)) {
 console.warn(`[MissionRegistry] Perspective ${perspective.id} is already registered.`);
 return;
 }
 this.perspectives.set(perspective.id, perspective);
 console.log(`[MissionRegistry] Registered perspective: ${perspective.id}`);
 }

 get(id: string): MissionPerspective | undefined {
 return this.perspectives.get(id);
 }

 getAll(): MissionPerspective[] {
 return Array.from(this.perspectives.values());
 }

 unregister(id: string): void {
 this.perspectives.delete(id);
 }
}

export const GlobalMissionRegistry = new MissionPerspectiveRegistry();
