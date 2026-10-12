import { CampaignSummary } from "./campaignApi";

/** Restringe a visão de planejamento às campanhas mestradas pela conta atual. */
export function masterCampaigns(campaigns: CampaignSummary[]): CampaignSummary[] {
  return campaigns.filter((campaign) => campaign.role === "gm");
}

/** O jogador não gerencia campanhas em que sua conta é mestre. */
export function playerCampaigns(campaigns: CampaignSummary[]): CampaignSummary[] {
  return campaigns.filter((campaign) => campaign.role === "player");
}
