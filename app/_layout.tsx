// app/_layout.tsx
import { AlertProvider } from "@/context/AlertContext";
import { CampaignProvider } from "@/context/CampaignContext"; 
import { CharacterProvider } from "@/context/CharacterContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { GMProvider } from "@/context/GMContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <CharacterProvider>
          <PlayerProvider>
            <CampaignProvider>
            <GMProvider>
                <WebSocketProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(player)" />
                    <Stack.Screen name="(gm)" />
                  </Stack>
                </WebSocketProvider>
            </GMProvider>
            </CampaignProvider>
          </PlayerProvider>
        </CharacterProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
