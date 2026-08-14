import React from 'react';

export interface RealityPerspective {
 id: string;
 title: string;
 component: React.ComponentType<any>;
 icon?: React.ReactNode;
}

class RealityPerspectiveRegistry {
 private perspectives: Map<string, RealityPerspective> = new Map();

 register(perspective: RealityPerspective) {
 this.perspectives.set(perspective.id, perspective);
 }

 get(id: string): RealityPerspective | undefined {
 return this.perspectives.get(id);
 }

 getAll(): RealityPerspective[] {
 return Array.from(this.perspectives.values());
 }
}

export const GlobalRealityRegistry = new RealityPerspectiveRegistry();
