import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Campaign,
  NpcEntry,
  MonsterEntry,
  ItemEntry,
  LocationEntry,
  EntityType,
} from "@/types/campaign";

interface GMContextType {
  // Campanhas
  campaigns: Campaign[];
  createCampaign: (data: Omit<Campaign, "id" | "createdAt" | "updatedAt" | "accessCode">) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  getCampaignById: (id: string) => Campaign | undefined;

  // NPCs
  npcs: NpcEntry[];
  createNpc: (data: Omit<NpcEntry, "id" | "createdAt" | "updatedAt">) => void;
  updateNpc: (id: string, data: Partial<NpcEntry>) => void;
  deleteNpc: (id: string) => void;

  // Monstros
  monsters: MonsterEntry[];
  createMonster: (data: Omit<MonsterEntry, "id" | "createdAt" | "updatedAt">) => void;
  updateMonster: (id: string, data: Partial<MonsterEntry>) => void;
  deleteMonster: (id: string) => void;

  // Itens
  items: ItemEntry[];
  createItem: (data: Omit<ItemEntry, "id" | "createdAt" | "updatedAt">) => void;
  updateItem: (id: string, data: Partial<ItemEntry>) => void;
  deleteItem: (id: string) => void;

  // Localidades
  locations: LocationEntry[];
  createLocation: (data: Omit<LocationEntry, "id" | "createdAt" | "updatedAt">) => void;
  updateLocation: (id: string, data: Partial<LocationEntry>) => void;
  deleteLocation: (id: string) => void;

  // Vinculação
  linkEntityToCampaign: (campaignId: string, entityType: EntityType, entityId: string) => void;
  unlinkEntityFromCampaign: (campaignId: string, entityType: EntityType, entityId: string) => void;
}

const GMContext = createContext<GMContextType | undefined>(undefined);

export const useGMContext = () => {
  const context = useContext(GMContext);
  if (!context) {
    throw new Error("useGMContext must be used within a GMProvider");
  }
  return context;
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
const generateAccessCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "FARO-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const GMProvider = ({ children }: { children: ReactNode }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [npcs, setNpcs] = useState<NpcEntry[]>([]);
  const [monsters, setMonsters] = useState<MonsterEntry[]>([]);
  const [items, setItems] = useState<ItemEntry[]>([]);
  const [locations, setLocations] = useState<LocationEntry[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [camp, npc, mon, itm, loc] = await Promise.all([
        AsyncStorage.getItem("@gm_campaigns"),
        AsyncStorage.getItem("@gm_npcs"),
        AsyncStorage.getItem("@gm_monsters"),
        AsyncStorage.getItem("@gm_items"),
        AsyncStorage.getItem("@gm_locations"),
      ]);

      if (camp) setCampaigns(JSON.parse(camp));
      if (npc) setNpcs(JSON.parse(npc));
      if (mon) setMonsters(JSON.parse(mon));
      if (itm) setItems(JSON.parse(itm));
      if (loc) setLocations(JSON.parse(loc));
    } catch (e) {
      console.error("Failed to load GM data", e);
    }
  };

  const saveData = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${key}`, e);
    }
  };

  // --- Campanhas ---
  const createCampaign = (data: Omit<Campaign, "id" | "createdAt" | "updatedAt" | "accessCode">) => {
    const newCampaign: Campaign = {
      ...data,
      id: generateId(),
      accessCode: generateAccessCode(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newCampaign, ...campaigns];
    setCampaigns(updated);
    saveData("@gm_campaigns", updated);
  };

  const updateCampaign = (id: string, data: Partial<Campaign>) => {
    const updated = campaigns.map((c) =>
      c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
    );
    setCampaigns(updated);
    saveData("@gm_campaigns", updated);
  };

  const deleteCampaign = (id: string) => {
    const updated = campaigns.filter((c) => c.id !== id);
    setCampaigns(updated);
    saveData("@gm_campaigns", updated);

    // Unlink from all entities (Optional: could keep linked but it's cleaner to remove the campaignId)
    // To implement perfect unlinking we would iterate over all entities and remove this campaignId
    // but for now, we just delete the campaign. When displaying entity badges, we can filter out non-existent campaigns.
  };

  const getCampaignById = (id: string) => campaigns.find((c) => c.id === id);

  // --- NPCs ---
  const createNpc = (data: Omit<NpcEntry, "id" | "createdAt" | "updatedAt">) => {
    const newEntity: NpcEntry = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newEntity, ...npcs];
    setNpcs(updated);
    saveData("@gm_npcs", updated);
  };

  const updateNpc = (id: string, data: Partial<NpcEntry>) => {
    const updated = npcs.map((e) =>
      e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
    );
    setNpcs(updated);
    saveData("@gm_npcs", updated);
  };

  const deleteNpc = (id: string) => {
    const updated = npcs.filter((e) => e.id !== id);
    setNpcs(updated);
    saveData("@gm_npcs", updated);

    // Remove from linked campaigns
    const updatedCampaigns = campaigns.map((c) => ({
      ...c,
      linkedNpcIds: c.linkedNpcIds.filter((entityId) => entityId !== id),
    }));
    setCampaigns(updatedCampaigns);
    saveData("@gm_campaigns", updatedCampaigns);
  };

  // --- Monstros ---
  const createMonster = (data: Omit<MonsterEntry, "id" | "createdAt" | "updatedAt">) => {
    const newEntity: MonsterEntry = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newEntity, ...monsters];
    setMonsters(updated);
    saveData("@gm_monsters", updated);
  };

  const updateMonster = (id: string, data: Partial<MonsterEntry>) => {
    const updated = monsters.map((e) =>
      e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
    );
    setMonsters(updated);
    saveData("@gm_monsters", updated);
  };

  const deleteMonster = (id: string) => {
    const updated = monsters.filter((e) => e.id !== id);
    setMonsters(updated);
    saveData("@gm_monsters", updated);

    // Remove from linked campaigns
    const updatedCampaigns = campaigns.map((c) => ({
      ...c,
      linkedMonsterIds: c.linkedMonsterIds.filter((entityId) => entityId !== id),
    }));
    setCampaigns(updatedCampaigns);
    saveData("@gm_campaigns", updatedCampaigns);
  };

  // --- Itens ---
  const createItem = (data: Omit<ItemEntry, "id" | "createdAt" | "updatedAt">) => {
    const newEntity: ItemEntry = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newEntity, ...items];
    setItems(updated);
    saveData("@gm_items", updated);
  };

  const updateItem = (id: string, data: Partial<ItemEntry>) => {
    const updated = items.map((e) =>
      e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
    );
    setItems(updated);
    saveData("@gm_items", updated);
  };

  const deleteItem = (id: string) => {
    const updated = items.filter((e) => e.id !== id);
    setItems(updated);
    saveData("@gm_items", updated);

    // Remove from linked campaigns
    const updatedCampaigns = campaigns.map((c) => ({
      ...c,
      linkedItemIds: c.linkedItemIds.filter((entityId) => entityId !== id),
    }));
    setCampaigns(updatedCampaigns);
    saveData("@gm_campaigns", updatedCampaigns);
  };

  // --- Localidades ---
  const createLocation = (data: Omit<LocationEntry, "id" | "createdAt" | "updatedAt">) => {
    const newEntity: LocationEntry = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newEntity, ...locations];
    setLocations(updated);
    saveData("@gm_locations", updated);
  };

  const updateLocation = (id: string, data: Partial<LocationEntry>) => {
    const updated = locations.map((e) =>
      e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
    );
    setLocations(updated);
    saveData("@gm_locations", updated);
  };

  const deleteLocation = (id: string) => {
    const updated = locations.filter((e) => e.id !== id);
    setLocations(updated);
    saveData("@gm_locations", updated);

    // Remove from linked campaigns
    const updatedCampaigns = campaigns.map((c) => ({
      ...c,
      linkedLocationIds: c.linkedLocationIds.filter((entityId) => entityId !== id),
    }));
    setCampaigns(updatedCampaigns);
    saveData("@gm_campaigns", updatedCampaigns);
  };

  // --- Vinculação ---
  const linkEntityToCampaign = (campaignId: string, entityType: EntityType, entityId: string) => {
    const campaign = getCampaignById(campaignId);
    if (!campaign) return;

    if (entityType === "npc") {
      if (campaign.linkedNpcIds.includes(entityId)) return;
      updateCampaign(campaignId, { linkedNpcIds: [...campaign.linkedNpcIds, entityId] });
      const npc = npcs.find(n => n.id === entityId);
      if (npc && !npc.linkedCampaignIds.includes(campaignId)) {
        updateNpc(entityId, { linkedCampaignIds: [...npc.linkedCampaignIds, campaignId] });
      }
    } else if (entityType === "monster") {
      if (campaign.linkedMonsterIds.includes(entityId)) return;
      updateCampaign(campaignId, { linkedMonsterIds: [...campaign.linkedMonsterIds, entityId] });
      const monster = monsters.find(m => m.id === entityId);
      if (monster && !monster.linkedCampaignIds.includes(campaignId)) {
        updateMonster(entityId, { linkedCampaignIds: [...monster.linkedCampaignIds, campaignId] });
      }
    } else if (entityType === "item") {
      if (campaign.linkedItemIds.includes(entityId)) return;
      updateCampaign(campaignId, { linkedItemIds: [...campaign.linkedItemIds, entityId] });
      const item = items.find(i => i.id === entityId);
      if (item && !item.linkedCampaignIds.includes(campaignId)) {
        updateItem(entityId, { linkedCampaignIds: [...item.linkedCampaignIds, campaignId] });
      }
    } else if (entityType === "location") {
      if (campaign.linkedLocationIds.includes(entityId)) return;
      updateCampaign(campaignId, { linkedLocationIds: [...campaign.linkedLocationIds, entityId] });
      const location = locations.find(l => l.id === entityId);
      if (location && !location.linkedCampaignIds.includes(campaignId)) {
        updateLocation(entityId, { linkedCampaignIds: [...location.linkedCampaignIds, campaignId] });
      }
    }
  };

  const unlinkEntityFromCampaign = (campaignId: string, entityType: EntityType, entityId: string) => {
    const campaign = getCampaignById(campaignId);
    if (!campaign) return;

    let updatedCampaign = { ...campaign };

    if (entityType === "npc") {
      updatedCampaign.linkedNpcIds = campaign.linkedNpcIds.filter(id => id !== entityId);
      const entity = npcs.find(n => n.id === entityId);
      if (entity) updateNpc(entityId, { linkedCampaignIds: entity.linkedCampaignIds.filter(id => id !== campaignId) });
    } else if (entityType === "monster") {
      updatedCampaign.linkedMonsterIds = campaign.linkedMonsterIds.filter(id => id !== entityId);
      const entity = monsters.find(m => m.id === entityId);
      if (entity) updateMonster(entityId, { linkedCampaignIds: entity.linkedCampaignIds.filter(id => id !== campaignId) });
    } else if (entityType === "item") {
      updatedCampaign.linkedItemIds = campaign.linkedItemIds.filter(id => id !== entityId);
      const entity = items.find(i => i.id === entityId);
      if (entity) updateItem(entityId, { linkedCampaignIds: entity.linkedCampaignIds.filter(id => id !== campaignId) });
    } else if (entityType === "location") {
      updatedCampaign.linkedLocationIds = campaign.linkedLocationIds.filter(id => id !== entityId);
      const entity = locations.find(l => l.id === entityId);
      if (entity) updateLocation(entityId, { linkedCampaignIds: entity.linkedCampaignIds.filter(id => id !== campaignId) });
    }

    updateCampaign(campaignId, updatedCampaign);
  };

  return (
    <GMContext.Provider
      value={{
        campaigns,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        getCampaignById,
        npcs,
        createNpc,
        updateNpc,
        deleteNpc,
        monsters,
        createMonster,
        updateMonster,
        deleteMonster,
        items,
        createItem,
        updateItem,
        deleteItem,
        locations,
        createLocation,
        updateLocation,
        deleteLocation,
        linkEntityToCampaign,
        unlinkEntityFromCampaign,
      }}
    >
      {children}
    </GMContext.Provider>
  );
};
