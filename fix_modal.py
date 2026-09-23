import os
import re

with open('components/modals/AddNpcModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'SPECIALIZATIONS' not in content:
    content = content.replace('import { CLASS_DATA }', 'import { SPECIALIZATIONS } from "@/data/specializationsData";\nimport { CLASS_DATA }')

# 2. Add state
if 'const [specializationId' not in content:
    content = content.replace('const [npcClass, setNpcClass] = useState<CharacterClass | string>(', 'const [specializationId, setSpecializationId] = useState<string>(initialData?.specialization?.id || "");\n  const [npcClass, setNpcClass] = useState<CharacterClass | string>(')

# 3. Add to buildTemplate
if 'specialization: ' not in content:
    content = content.replace('class: npcClass,', 'class: npcClass,\n      specialization: specializationId ? SPECIALIZATIONS[specializationId] : null,')

# 4. Add UI
ui_snippet = """
              <Text style={styles.label}>Especialização</Text>
              <View style={styles.chipContainer}>
                <TouchableOpacity
                  style={[styles.chip, !specializationId && styles.chipActive]}
                  onPress={() => setSpecializationId("")}
                >
                  <Text style={[styles.chipText, !specializationId && styles.chipTextActive]}>Nenhuma</Text>
                </TouchableOpacity>
                {Object.values(SPECIALIZATIONS).filter(s => s.classRequired === npcClass).map((spec) => {
                  const isSelected = specializationId === spec.id;
                  return (
                    <TouchableOpacity
                      key={spec.id}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSpecializationId(spec.id)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{spec.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
"""
if 'Especialização</Text>' not in content:
    content = content.replace('<Text style={styles.label}>Ancestralidade</Text>', ui_snippet.strip() + '\n\n              <Text style={styles.label}>Ancestralidade</Text>')

with open('components/modals/AddNpcModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
