"use client";

import { createContext, useContext } from "react";

export type ProdySectionContextValue = {
  /** Section sits inside IntelligenceSectionFrame — skip duplicate page chrome */
  embedded: boolean;
};

export const ProdySectionContext = createContext<ProdySectionContextValue>({
  embedded: false,
});

export function useProdySection(): ProdySectionContextValue {
  return useContext(ProdySectionContext);
}
