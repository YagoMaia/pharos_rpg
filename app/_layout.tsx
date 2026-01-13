// app/_layout.tsx
import { Stack } from "expo-router";
import { CampaignProvider } from "../context/CampaignContext"; // <--- Novo
import { CharacterProvider } from "../context/CharacterContext";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <CharacterProvider>
        <CampaignProvider>
          {" "}
          {/* <--- Adicione aqui */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(player)" />
            <Stack.Screen name="(gm)" />
          </Stack>
        </CampaignProvider>
      </CharacterProvider>
    </ThemeProvider>
  );
}
