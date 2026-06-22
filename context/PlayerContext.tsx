import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CampaignMembership, JoinStatus, PlayerProfile } from "../types/player";
import { Campaign } from "../types/campaign";

interface JoinResult {
  success: boolean;
  status: JoinStatus;
  campaign?: Partial<Campaign>;
  error?: string;
}

interface PlayerContextType {
  profile: PlayerProfile | null;
  setDisplayName: (name: string) => void;
  memberships: CampaignMembership[];
  joinCampaignByCode: (code: string) => Promise<JoinResult>;
  leaveCampaign: (campaignId: string) => void;
  getMembershipByCampaign: (campaignId: string) => CampaignMembership | undefined;
  setCharacterForCampaign: (campaignId: string, characterId: string) => void;
  isLoading: boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [memberships, setMemberships] = useState<CampaignMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedProfile = await AsyncStorage.getItem("@player_profile");
        const savedMemberships = await AsyncStorage.getItem("@player_memberships");
        
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        } else {
          // Default profile if none exists
          setProfile({
            id: Date.now().toString(),
            displayName: "Jogador",
            characters: [],
            memberships: [],
            createdAt: new Date().toISOString()
          });
        }
        
        if (savedMemberships) {
          setMemberships(JSON.parse(savedMemberships));
        }
      } catch (error) {
        console.error("Erro ao carregar dados do jogador:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading && profile) {
      AsyncStorage.setItem("@player_profile", JSON.stringify(profile)).catch(console.error);
    }
  }, [profile, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem("@player_memberships", JSON.stringify(memberships)).catch(console.error);
    }
  }, [memberships, isLoading]);

  const setDisplayName = useCallback((name: string) => {
    setProfile(prev => prev ? { ...prev, displayName: name } : null);
  }, []);

  const joinCampaignByCode = useCallback(async (code: string): Promise<JoinResult> => {
    // This is a stub for now. Ideally, it would check the GMContext or API.
    // For now, let's just return a fake success if it matches a pattern or just fake it.
    if (!code) {
      return { success: false, status: "rejected", error: "Código inválido" };
    }
    
    // Fake joining logic
    const newCampaignId = "camp_" + Date.now();
    const newMembership: CampaignMembership = {
      campaignId: newCampaignId,
      characterId: "",
      joinedAt: new Date().toISOString(),
      status: "pending",
      campaignName: "Campanha " + code,
      campaignSystem: "Pharos",
      gmName: "Mestre Supremo",
      lastActivity: new Date().toISOString(),
      campaignStatus: "Ativa"
    };
    
    setMemberships(prev => [...prev, newMembership]);
    
    return {
      success: true,
      status: "pending",
      campaign: {
        id: newCampaignId,
        name: newMembership.campaignName,
        system: "Pharos"
      }
    };
  }, []);

  const leaveCampaign = useCallback((campaignId: string) => {
    setMemberships(prev => prev.filter(m => m.campaignId !== campaignId));
  }, []);

  const getMembershipByCampaign = useCallback((campaignId: string) => {
    return memberships.find(m => m.campaignId === campaignId);
  }, [memberships]);

  const setCharacterForCampaign = useCallback((campaignId: string, characterId: string) => {
    setMemberships(prev => 
      prev.map(m => m.campaignId === campaignId ? { ...m, characterId } : m)
    );
  }, []);

  const value = useMemo(() => ({
    profile,
    setDisplayName,
    memberships,
    joinCampaignByCode,
    leaveCampaign,
    getMembershipByCampaign,
    setCharacterForCampaign,
    isLoading
  }), [profile, setDisplayName, memberships, joinCampaignByCode, leaveCampaign, getMembershipByCampaign, setCharacterForCampaign, isLoading]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
