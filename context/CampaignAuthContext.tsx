import React, { createContext, useContext, useState } from "react";

export interface CampaignSession {
  baseUrl: string;
  token: string;
  role: "gm" | "player";
}

type CampaignAuthState = readonly [CampaignSession | null, React.Dispatch<React.SetStateAction<CampaignSession | null>>];

const CampaignAuthContext = createContext<CampaignAuthState | null>(null);

/** Guarda o token apenas durante a execução do app, sem persistência insegura. */
export function CampaignAuthProvider({ children }: { children: React.ReactNode }) {
  const state = useState<CampaignSession | null>(null);
  return <CampaignAuthContext.Provider value={state}>{children}</CampaignAuthContext.Provider>;
}

export function useCampaignAuth(): CampaignAuthState {
  const context = useContext(CampaignAuthContext);
  if (!context) throw new Error("useCampaignAuth requer CampaignAuthProvider.");
  return context;
}
