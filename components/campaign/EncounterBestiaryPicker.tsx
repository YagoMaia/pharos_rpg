import { ThemeColors } from "@/constants/theme";
import { useCampaignMeta } from "@/context/CampaignContext";
import { CampaignEncounterMonster } from "@/services/campaignApi";
import { bestiaryCount, bestiaryEncounterMonster } from "@/services/encounterBestiary";
import { npcToCombatant } from "@/utils/combatantFactory";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface Props {
  colors: ThemeColors;
  onAdd: (monster: CampaignEncounterMonster) => void;
}

/** Seleciona uma cópia da ficha sem alterar a biblioteca nem iniciar combate. */
export function EncounterBestiaryPicker({ colors, onAdd }: Props) {
  const { npcLibrary } = useCampaignMeta();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const selected = npcLibrary.find((npc) => npc.id === selectedId);
  const count = bestiaryCount(quantity);

  return <View style={{ gap: 8, marginVertical: 12 }}>
    <Text style={{ color: colors.text, fontWeight: "700" }}>Adicionar do bestiário</Text>
    <Text style={{ color: colors.textSecondary }}>Uma cópia da ficha é salva no encontro; mudanças posteriores no bestiário não a atualizam.</Text>
    <Text style={{ color: colors.textSecondary }}>Para carregar foco, fases, magias e façanhas no combate, o servidor precisa estar atualizado. Em versões antigas, esses dados não são carregados e iniciativa zero pode usar Destreza.</Text>
    {npcLibrary.length === 0 && <Text style={{ color: colors.textSecondary }}>Bestiário vazio. Cadastre inimigos no bestiário ou adicione manualmente abaixo.</Text>}
    {npcLibrary.map((npc) => <TouchableOpacity key={npc.id} accessibilityRole="button"
      accessibilityState={{ selected: selectedId === npc.id }} onPress={() => setSelectedId(npc.id)}
      style={{ borderWidth: 1, borderColor: selectedId === npc.id ? colors.primary : colors.border, borderRadius: 6, padding: 8 }}>
      <Text style={{ color: colors.text }}>{npc.name} · PV {npc.maxHp} · CA base {npc.armorClass}</Text>
    </TouchableOpacity>)}
    {!!selected && <View style={{ gap: 8 }}>
      <Text style={{ color: colors.text }}>Quantidade de {selected.name} (1 a 100)</Text>
      <TextInput accessibilityLabel="Quantidade do bestiário" keyboardType="numeric" value={quantity} onChangeText={setQuantity}
        style={{ color: colors.text, borderColor: colors.border, borderWidth: 1, borderRadius: 6, padding: 8 }} />
      {!count && <Text accessibilityRole="alert" style={{ color: colors.error }}>Informe um número inteiro de 1 a 100.</Text>}
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !count }} disabled={!count}
        onPress={() => { if (!count) return; onAdd(bestiaryEncounterMonster(selected, count, npcToCombatant(selected, 0))); setSelectedId(null); setQuantity("1"); }}
        style={{ alignSelf: "flex-start", backgroundColor: colors.primary, opacity: count ? 1 : 0.5, padding: 9, borderRadius: 6 }}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Adicionar ao encontro</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => { setSelectedId(null); setQuantity("1"); }}>
        <Text style={{ color: colors.textSecondary }}>Cancelar seleção</Text>
      </TouchableOpacity>
    </View>}
  </View>;
}
