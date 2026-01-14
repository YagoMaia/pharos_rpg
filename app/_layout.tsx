// app/_layout.tsx
import { AlertProvider } from "@/context/AlertContext";
import { CampaignProvider } from "@/context/CampaignContext"; // <--- Novo
import { CharacterProvider } from "@/context/CharacterContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <CharacterProvider>
          <CampaignProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(player)" />
              <Stack.Screen name="(gm)" />
            </Stack>
          </CampaignProvider>
        </CharacterProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
