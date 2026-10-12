import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface CampaignSession {
  baseUrl: string;
  token: string;
  role: "gm" | "player";
}

const STORAGE_KEY = "@pharos_session_v1";

type CampaignAuthState = readonly [
  CampaignSession | null,
  (session: CampaignSession | null | ((prev: CampaignSession | null) => CampaignSession | null)) => void,
];

const CampaignAuthContext = createContext<CampaignAuthState | null>(null);

/** Persiste a sessão no AsyncStorage com restauração automática no startup. */
export function CampaignAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<CampaignSession | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (
              parsed &&
              typeof parsed.baseUrl === "string" &&
              typeof parsed.token === "string" &&
              ["gm", "player"].includes(parsed.role)
            ) {
              setSessionState(parsed);
            }
          } catch {
            AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

  const setSession = useCallback(
    (update: CampaignSession | null | ((prev: CampaignSession | null) => CampaignSession | null)) => {
      setSessionState((prev) => {
        const next = typeof update === "function" ? update(prev) : update;
        if (next) {
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        } else {
          AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        }
        return next;
      });
    },
    [],
  );

  return <CampaignAuthContext.Provider value={[session, setSession]}>{children}</CampaignAuthContext.Provider>;
}

export function useCampaignAuth(): CampaignAuthState {
  const context = useContext(CampaignAuthContext);
  if (!context) throw new Error("useCampaignAuth requer CampaignAuthProvider.");
  return context;
}
