import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAlert } from "@/context/AlertContext";
import { useCampaign } from "../../context/CampaignContext";
import { useTheme } from "../../context/ThemeContext";
import { Attributes, NpcSkill, NpcStance, NpcTemplate } from "../../types/rpg";

const MOCK_NPC_TEMPLATE = {
  name: "Lutador Bandido",
  subline: "Humano – Guerreiro Nível 1",
  maxHp: 10,
  hpFormula: "1d10 + 2",
  armorClass: 15,
  acDetail: "Gibão de Peles + Escudo",
  speed: "9m",
  initiativeBonus: 0,
  maxFocus: 8,
  attributes: {
    str: 14,
    dex: 10,
    con: 14,
    int: 8,
    wis: 10,
    cha: 10,
  },
  equipment: "Maça, Espada Curta, Escudo, Gibão de Peles.",
  actions:
    "- Maça/Espada: Corpo-a-corpo, +4 para acertar. Dano: 1d6 + 2 (Impacto).",
  stances: [
    {
      id: "mock-st-1",
      name: "Defensor",
      acBonus: 2,
      description:
        "Reação para impor Desvantagem em ataque contra aliado adjacente. Movimento cai pela metade.",
    },
    {
      id: "mock-st-2",
      name: "Ofensiva",
      acBonus: -2,
      description: "Dobra proficiência no dano (+2 extra).",
    },
  ],
  skills: [
    {
      id: "mock-sk-1",
      name: "Ataque Brutal",
      cost: 2,
      description: "Adiciona o dado da arma novamente ao dano (Total 2d6+2).",
    },
    {
      id: "mock-sk-2",
      name: "Segundo Fôlego",
      cost: 3,
      description: "Cura a si mesmo em 1d10+2 (Ação Bônus).",
    },
  ],
};

// Função auxiliar
const getMod = (val: number) => Math.floor((val - 10) / 2);
const formatMod = (val: number) => {
  const mod = getMod(val);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

export default function NpcScreen() {
  const {
    npcLibrary,
    saveNpcToLibrary,
    deleteNpcFromLibrary,
    updateNpcInLibrary,
    addCombatant,
  } = useCampaign();

  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [modalVisible, setModalVisible] = useState(false);
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [selectedNpc, setSelectedNpc] = useState<NpcTemplate | null>(null);
  const [quantity, setQuantity] = useState("1");

  // --- ESTADO DE EDIÇÃO ---
  const [editingId, setEditingId] = useState<string | null>(null); // Null = Criando, String = Editando

  // --- ESTADOS DO FORMULÁRIO ---
  const [formTab, setFormTab] = useState<"general" | "attrs" | "details">(
    "general"
  );

  const [name, setName] = useState("");
  const [subline, setSubline] = useState("");
  const [hp, setHp] = useState("");
  const [hpFormula, setHpFormula] = useState("");
  const [ac, setAc] = useState("");
  const [acDetail, setAcDetail] = useState("");
  const [speed, setSpeed] = useState("");
  const [init, setInit] = useState("");
  const [focus, setFocus] = useState("");
  const [attrs, setAttrs] = useState<Attributes>({
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  });

  // Detalhes Texto
  const [equip, setEquip] = useState("");
  const [actions, setActions] = useState("");

  // --- LOGICA DE LISTAS DINÂMICAS (STANCES & SKILLS) ---
  const [npcStances, setNpcStances] = useState<NpcStance[]>([]);
  const [npcSkills, setNpcSkills] = useState<NpcSkill[]>([]);

  // Temp inputs para Stance
  const [tempStanceName, setTempStanceName] = useState("");
  const [tempStanceBonus, setTempStanceBonus] = useState("");
  const [tempStanceDesc, setTempStanceDesc] = useState("");

  // Temp inputs para Skill
  const [tempSkillName, setTempSkillName] = useState("");
  const [tempSkillCost, setTempSkillCost] = useState("");
  const [tempSkillDesc, setTempSkillDesc] = useState("");

  const addStanceToNpc = () => {
    if (!tempStanceName) return;
    const newStance: NpcStance = {
      id: Date.now().toString(),
      name: tempStanceName,
      acBonus: parseInt(tempStanceBonus) || 0,
      description: tempStanceDesc,
    };
    setNpcStances([...npcStances, newStance]);
    setTempStanceName("");
    setTempStanceBonus("");
    setTempStanceDesc("");
  };

  const removeStance = (id: string) => {
    setNpcStances((prev) => prev.filter((s) => s.id !== id));
  };

  const addSkillToNpc = () => {
    if (!tempSkillName) return;
    const newSkill: NpcSkill = {
      id: Date.now().toString(),
      name: tempSkillName,
      cost: parseInt(tempSkillCost) || 0,
      description: tempSkillDesc,
    };
    setNpcSkills([...npcSkills, newSkill]);
    setTempSkillName("");
    setTempSkillCost("");
    setTempSkillDesc("");
  };

  const removeSkill = (id: string) => {
    setNpcSkills((prev) => prev.filter((s) => s.id !== id));
  };

  // Limpa o formulário e o estado de edição
  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSubline("");
    setHp("");
    setHpFormula("");
    setAc("");
    setAcDetail("");
    setSpeed("");
    setInit("");
    setFocus("");
    setAttrs({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    setEquip("");
    setActions("");
    setNpcStances([]);
    setNpcSkills([]); // Limpa as listas
    setFormTab("general");
  };

  // Preenche o formulário com dados existentes
  const handleEdit = (npc: NpcTemplate) => {
    console.log("Editando NPC:", npc); // <--- VEJA ISSO NO TERMINAL
    console.log("Posturas:", npc.stances);

    setEditingId(npc.id);
    setName(npc.name);
    setSubline(npc.subline || "");
    setHp(String(npc.maxHp));
    // setHpFormula(npc.hpFormula); // Se tiver no type, descomente
    setAc(String(npc.armorClass));
    // setAcDetail(npc.acDetail);   // Se tiver no type, descomente
    setSpeed(npc.speed || "");
    setInit(String(npc.initiativeBonus));
    setFocus(String(npc.maxFocus));
    setAttrs(
      npc.attributes || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    );

    // Texto Livre
    setEquip(npc.equipment || "");
    setActions(npc.actions || "");

    // --- CORREÇÃO AQUI ---
    // Verifica se é um array antes de setar. Se for string antiga, ignora ou converte (aqui ignoramos)
    if (Array.isArray(npc.stances)) {
      setNpcStances(npc.stances);
    } else {
      setNpcStances([]);
    }

    if (Array.isArray(npc.skills)) {
      setNpcSkills(npc.skills);
    } else {
      setNpcSkills([]);
    }

    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name) return;

    const npcData = {
      name,
      subline,
      maxHp: parseInt(hp) || 10,
      //   hpFormula,
      armorClass: parseInt(ac) || 10,
      //   acDetail,
      speed: speed || "9m",
      initiativeBonus: parseInt(init) || 0,
      maxFocus: parseInt(focus) || 0,
      attributes: attrs,
      equipment: equip,
      actions,
      stances: npcStances,
      skills: npcSkills,
    };

    if (editingId) {
      // MODO EDIÇÃO
      updateNpcInLibrary(editingId, npcData);
    } else {
      // MODO CRIAÇÃO
      saveNpcToLibrary(npcData);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleGenerateMock = () => {
    saveNpcToLibrary(MOCK_NPC_TEMPLATE);
    // Opcional: Feedback visual
    showAlert("Debug", "NPC de teste criado!");
  };

  // --- FUNÇÕES DE COMBATE ---
  const openAddModal = (npc: NpcTemplate) => {
    setSelectedNpc(npc);
    setQuantity("1");
    setQtyModalVisible(true);
  };

  const confirmAddToCombat = () => {
    if (!selectedNpc) return;
    const qty = parseInt(quantity) || 1;

    for (let i = 0; i < qty; i++) {
      const init =
        Math.floor(Math.random() * 20) + 1 + selectedNpc.initiativeBonus;

      // Passamos TUDO do NPC template como detalhes
      addCombatant(selectedNpc.name, selectedNpc.maxHp, init, "npc", {
        armorClass: selectedNpc.armorClass,
        maxFocus: selectedNpc.maxFocus,
        attributes: selectedNpc.attributes,
        equipment: selectedNpc.equipment,
        actions: selectedNpc.actions,
        stances: selectedNpc.stances,
        skills: selectedNpc.skills,
      });
    }
    setQtyModalVisible(false);
    showAlert("Sucesso", `${qty}x ${selectedNpc.name} enviados.`);
  };

  // --- CARD DO NPC ---
  const NpcCard = ({ item }: { item: NpcTemplate }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSub}>
                {item.subline || "NPC Genérico"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.error + "20" },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.error }]}>
                    HP {item.maxHp}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    CA {item.armorClass}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.cardBody}>
            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                <Text style={styles.bold}>Desl:</Text> {item.speed}
              </Text>
              <Text style={styles.statText}>
                <Text style={styles.bold}>Init:</Text>{" "}
                {item.initiativeBonus >= 0
                  ? `+${item.initiativeBonus}`
                  : item.initiativeBonus}
              </Text>
              <Text style={styles.statText}>
                <Text style={styles.bold}>Foco:</Text> {item.maxFocus}
              </Text>
            </View>

            {/* Atributos */}
            <View style={styles.attrGrid}>
              {item.attributes &&
                Object.entries(item.attributes).map(([key, val]) => (
                  <View key={key} style={styles.attrBox}>
                    <Text style={styles.attrLabel}>{key.toUpperCase()}</Text>
                    <Text style={styles.attrVal}>{val}</Text>
                    <Text style={styles.attrMod}>
                      {formatMod(val as number)}
                    </Text>
                  </View>
                ))}
            </View>

            <View style={styles.divider} />

            {/* Texto Simples */}
            {!!item.equipment && (
              <Text style={styles.sectionText}>
                <Text style={styles.bold}>Equipamento: </Text>
                {item.equipment}
              </Text>
            )}

            {!!item.actions && (
              <View style={styles.textSection}>
                <Text style={styles.sectionHeader}>Ações</Text>
                <Text style={styles.bodyText}>{item.actions}</Text>
              </View>
            )}

            {/* --- CORREÇÃO AQUI: Renderizar ARRAY de Posturas --- */}
            {item.stances &&
              Array.isArray(item.stances) &&
              item.stances.length > 0 && (
                <View style={styles.textSection}>
                  <Text style={styles.sectionHeader}>Posturas</Text>
                  {item.stances.map((s, index) => (
                    <Text key={s.id || index} style={styles.bodyText}>
                      • <Text style={{ fontWeight: "bold" }}>{s.name}</Text> (
                      {s.acBonus > 0 ? `+${s.acBonus}` : s.acBonus} CA):{" "}
                      {s.description}
                    </Text>
                  ))}
                </View>
              )}

            {/* --- CORREÇÃO AQUI: Renderizar ARRAY de Habilidades --- */}
            {item.skills &&
              Array.isArray(item.skills) &&
              item.skills.length > 0 && (
                <View style={styles.textSection}>
                  <Text style={styles.sectionHeader}>Habilidades</Text>
                  {item.skills.map((s, index) => (
                    <Text key={s.id || index} style={styles.bodyText}>
                      • <Text style={{ fontWeight: "bold" }}>{s.name}</Text> (
                      {s.cost} Foco): {s.description}
                    </Text>
                  ))}
                </View>
              )}

            {/* Ações do Card */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => openAddModal(item)}
                style={styles.combatBtn}
              >
                <MaterialCommunityIcons
                  name="sword-cross"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.btnText}>Combate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleEdit(item)}
                style={[styles.iconBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteNpcFromLibrary(item.id)}
                style={[styles.iconBtn, { backgroundColor: colors.inputBg }]}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* --- BOTÃO DE DEBUG (Pode remover depois) --- */}
      {npcLibrary.length === 0 && (
        <TouchableOpacity
          onPress={handleGenerateMock}
          style={{
            alignSelf: "center",
            marginTop: 20,
            backgroundColor: colors.primary + "20",
            padding: 10,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="bug" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "bold" }}>
            Gerar NPC de Teste
          </Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={npcLibrary}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => <NpcCard item={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum NPC no Bestiário.</Text>
        }
      />

      {/* Botão Flutuante (Resetar form para criar novo) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm(); // Garante que não estamos editando
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* --- MODAL DE CRIAÇÃO/EDIÇÃO --- */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingId ? "Editar NPC" : "Criar NPC"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          {/* Abas */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setFormTab("general")}
              style={[
                styles.tabItem,
                formTab === "general" && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  formTab === "general" && styles.tabTextActive,
                ]}
              >
                Geral
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFormTab("attrs")}
              style={[styles.tabItem, formTab === "attrs" && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  formTab === "attrs" && styles.tabTextActive,
                ]}
              >
                Atributos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFormTab("details")}
              style={[
                styles.tabItem,
                formTab === "details" && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  formTab === "details" && styles.tabTextActive,
                ]}
              >
                Detalhes
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            {/* ABA GERAL */}
            {formTab === "general" && (
              <>
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Bandido"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.label}>Subtítulo</Text>
                <TextInput
                  style={styles.input}
                  value={subline}
                  onChangeText={setSubline}
                  placeholder="Ex: Humano Nível 1"
                  placeholderTextColor={colors.textSecondary}
                />

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>PV Máx</Text>
                    <TextInput
                      style={styles.input}
                      value={hp}
                      onChangeText={setHp}
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Fórmula PV</Text>
                    <TextInput
                      style={styles.input}
                      value={hpFormula}
                      onChangeText={setHpFormula}
                      placeholder="1d10+2"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>CA</Text>
                    <TextInput
                      style={styles.input}
                      value={ac}
                      onChangeText={setAc}
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Detalhe CA</Text>
                    <TextInput
                      style={styles.input}
                      value={acDetail}
                      onChangeText={setAcDetail}
                      placeholder="Couro"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Init (Mod)</Text>
                    <TextInput
                      style={styles.input}
                      value={init}
                      onChangeText={setInit}
                      keyboardType="numeric"
                      placeholder="+0"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Desloc.</Text>
                    <TextInput
                      style={styles.input}
                      value={speed}
                      onChangeText={setSpeed}
                      placeholder="9m"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Foco</Text>
                    <TextInput
                      style={styles.input}
                      value={focus}
                      onChangeText={setFocus}
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ABA ATRIBUTOS */}
            {formTab === "attrs" && (
              <View style={styles.attrFormGrid}>
                {Object.keys(attrs).map((key) => (
                  <View key={key} style={styles.attrInputBox}>
                    <Text style={styles.labelCenter}>{key.toUpperCase()}</Text>
                    <TextInput
                      style={[styles.input, { textAlign: "center" }]}
                      keyboardType="numeric"
                      value={String(attrs[key as keyof Attributes])}
                      onChangeText={(t) =>
                        setAttrs({ ...attrs, [key]: parseInt(t) || 10 })
                      }
                    />
                    <Text
                      style={{
                        textAlign: "center",
                        color: colors.textSecondary,
                      }}
                    >
                      {formatMod(attrs[key as keyof Attributes])}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* ABA DETALHES */}
            {formTab === "details" && (
              <>
                <Text style={styles.label}>Equipamento</Text>
                <TextInput
                  style={styles.input}
                  value={equip}
                  onChangeText={setEquip}
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.label}>Ações</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  value={actions}
                  onChangeText={setActions}
                  placeholderTextColor={colors.textSecondary}
                />

                {/* SEÇÃO POSTURAS */}
                <Text style={styles.sectionHeader}>
                  Posturas ({npcStances.length})
                </Text>
                {npcStances.map((s) => (
                  <View key={s.id} style={styles.miniItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.miniItemTitle}>
                        {s.name} ({s.acBonus > 0 ? `+${s.acBonus}` : s.acBonus}{" "}
                        CA)
                      </Text>
                      <Text style={styles.miniItemDesc}>{s.description}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeStance(s.id)}>
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.addBox}>
                  <View
                    style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}
                  >
                    <TextInput
                      style={[styles.input, { flex: 2, marginBottom: 0 }]}
                      placeholder="Nome da Postura"
                      value={tempStanceName}
                      onChangeText={setTempStanceName}
                      placeholderTextColor={colors.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="CA (+/-)"
                      keyboardType="numeric"
                      value={tempStanceBonus}
                      onChangeText={setTempStanceBonus}
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <TextInput
                    style={[styles.input, { height: 50, marginBottom: 8 }]}
                    placeholder="Descrição / Efeito"
                    multiline
                    value={tempStanceDesc}
                    onChangeText={setTempStanceDesc}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity
                    onPress={addStanceToNpc}
                    style={styles.addBtnSmall}
                  >
                    <Text style={styles.addBtnText}>+ Adicionar Postura</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* SEÇÃO HABILIDADES */}
                <Text style={styles.sectionHeader}>
                  Habilidades ({npcSkills.length})
                </Text>
                {npcSkills.map((s) => (
                  <View key={s.id} style={styles.miniItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.miniItemTitle}>
                        {s.name} ({s.cost} Foco)
                      </Text>
                      <Text style={styles.miniItemDesc}>{s.description}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeSkill(s.id)}>
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.addBox}>
                  <View
                    style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}
                  >
                    <TextInput
                      style={[styles.input, { flex: 2, marginBottom: 0 }]}
                      placeholder="Nome da Habilidade"
                      value={tempSkillName}
                      onChangeText={setTempSkillName}
                      placeholderTextColor={colors.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="Custo Foco"
                      keyboardType="numeric"
                      value={tempSkillCost}
                      onChangeText={setTempSkillCost}
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <TextInput
                    style={[styles.input, { height: 50, marginBottom: 8 }]}
                    placeholder="Descrição / Efeito"
                    multiline
                    value={tempSkillDesc}
                    onChangeText={setTempSkillDesc}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity
                    onPress={addSkillToNpc}
                    style={styles.addBtnSmall}
                  >
                    <Text style={styles.addBtnText}>
                      + Adicionar Habilidade
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.footerBtn}>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtnFull}>
              <Text style={styles.saveText}>
                {editingId ? "Atualizar NPC" : "Salvar NPC"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL QUANTIDADE (Mantido igual) */}
      <Modal visible={qtyModalVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.qtyBox}>
            <Text style={styles.qtyTitle}>Adicionar ao Combate</Text>
            <Text
              style={{
                color: colors.textSecondary,
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              Quantos {selectedNpc?.name}?
            </Text>
            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setQtyModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmAddToCombat}
                style={styles.confirmBtn}
              >
                <Text style={styles.saveText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    empty: { textAlign: "center", marginTop: 50, color: colors.textSecondary },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      elevation: 2,
    },
    cardHeader: {
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface,
    },
    cardTitle: { fontSize: 18, fontWeight: "bold", color: colors.text },
    cardSub: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
      marginTop: 2,
    },
    badgeRow: { flexDirection: "row", gap: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontWeight: "bold", fontSize: 12 },

    cardBody: {
      padding: 16,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: colors.border + "50",
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    statText: { color: colors.text, fontSize: 14 },
    bold: { fontWeight: "bold" },

    attrGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      padding: 8,
    },
    attrBox: { alignItems: "center", width: 45 },
    attrLabel: {
      fontSize: 10,
      fontWeight: "bold",
      color: colors.textSecondary,
    },
    attrVal: { fontSize: 16, fontWeight: "bold", color: colors.text },
    attrMod: { fontSize: 12, color: colors.textSecondary },

    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },

    sectionText: { color: colors.text, fontSize: 14, marginBottom: 8 },
    textSection: { marginBottom: 12 },
    sectionHeader: {
      color: "#c62828",
      fontWeight: "bold",
      fontSize: 14,
      marginBottom: 4,
      marginTop: 8,
      textTransform: "uppercase",
    },
    bodyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

    cardActions: { flexDirection: "row", marginTop: 8, gap: 10 },
    combatBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#c62828",
      padding: 10,
      borderRadius: 8,
      gap: 8,
    },

    // Estilo do botão de ícone pequeno (Editar/Deletar)
    iconBtn: {
      width: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    btnText: { color: "#fff", fontWeight: "bold" },

    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#c62828",
      alignItems: "center",
      justifyContent: "center",
      elevation: 5,
    },

    // MODAL CRIAR
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: { fontSize: 18, fontWeight: "bold", color: colors.text },
    closeText: { color: colors.primary, fontSize: 16 },

    tabBar: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    tabItem: { flex: 1, paddingVertical: 14, alignItems: "center" },
    tabActive: { borderBottomWidth: 2, borderColor: "#c62828" },
    tabText: { color: colors.textSecondary, fontWeight: "600" },
    tabTextActive: { color: "#c62828" },

    formContent: { padding: 20 },
    label: {
      color: colors.textSecondary,
      fontSize: 12,
      marginBottom: 4,
      marginTop: 12,
      textTransform: "uppercase",
      fontWeight: "bold",
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      color: colors.text,
      fontSize: 16,
    },
    textArea: { minHeight: 80, textAlignVertical: "top" },
    row: { flexDirection: "row", gap: 0 },

    attrFormGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    attrInputBox: { width: "30%", marginBottom: 20 },
    labelCenter: {
      textAlign: "center",
      color: colors.textSecondary,
      fontWeight: "bold",
      marginBottom: 4,
    },

    footerBtn: {
      padding: 20,
      borderTopWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    saveBtnFull: {
      backgroundColor: "#c62828",
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    saveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

    // MODAL QTY
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      padding: 20,
      alignItems: "center",
    },
    qtyBox: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 12,
      width: "80%",
    },
    qtyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 12,
    },
    qtyInput: {
      backgroundColor: colors.inputBg,
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      padding: 12,
      borderRadius: 8,
      color: colors.text,
      marginBottom: 16,
    },
    modalBtns: { flexDirection: "row", gap: 10 },
    cancelBtn: {
      flex: 1,
      padding: 12,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      borderRadius: 8,
    },
    confirmBtn: {
      flex: 1,
      padding: 12,
      backgroundColor: "#c62828",
      alignItems: "center",
      borderRadius: 8,
    },
    cancelText: { color: colors.textSecondary, fontWeight: "bold" },
    miniItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      padding: 10,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    miniItemTitle: { fontWeight: "bold", color: colors.text, fontSize: 14 },
    miniItemDesc: { color: colors.textSecondary, fontSize: 12 },

    addBox: {
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      marginBottom: 20,
    },
    addBtnSmall: {
      backgroundColor: colors.inputBg,
      padding: 10,
      borderRadius: 6,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    addBtnText: {
      color: colors.text,
      fontWeight: "bold",
      fontSize: 12,
    },
  });
