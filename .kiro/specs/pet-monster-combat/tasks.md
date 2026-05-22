# Implementation Plan: Pet Monster Combat

## Overview

This plan implements the pet monster combat feature for Pharos RP, allowing a player to control a pet monster alongside their main character in online WebSocket-based combat sessions. The implementation follows the existing architecture patterns (CharacterContext, CampaignContext, WebSocketContext) and builds incrementally from data models through utilities, context modifications, and finally UI components.

## Tasks

- [ ] 1. Define types and create pet utility module
  - [ ] 1.1 Extend Character interface and add PetMonster type
    - Add `pet?: PetMonster` optional field to the `Character` interface in `types/rpg.ts`
    - Create the `PetMonster` interface with fields: name, image, level, class, ancestry, maxHp, maxFocus, armorClass, attributes, stances, skills, spells, initiativeBonus, speed, weapons
    - _Requirements: 1.1, 1.5_

  - [ ] 1.2 Create `utils/petUtils.ts` utility module
    - Implement `assignPet(character: Character, npc: NpcTemplate): Character` — copies NPC data into character.pet
    - Implement `removePet(character: Character): Character` — returns character with pet cleared
    - Implement `validatePetForCombat(pet: PetMonster): { valid: boolean; missingFields: string[] }` — checks required combat fields (maxHp, armorClass, attributes)
    - Implement `getPetCombatantId(petName: string, ownerName: string): string` — generates composite ID using `generateSafeId(petName + "_" + ownerName)`
    - Implement `isPetOwnedBy(combatantId: string, ownerName: string, petName: string): boolean` — verifies ownership via ID pattern matching
    - _Requirements: 1.2, 1.3, 1.6, 2.2, 2.6, 8.4_

  - [ ] 1.3 Add `petToCombatant` factory function to `utils/combatantFactory.ts`
    - Follow the `npcToCombatant` pattern: map PetMonster fields to Combatant fields
    - Set `type: "player"`, generate ID via `getPetCombatantId`, initialize hp.current = hp.max, focus.current = focus.max, all turnActions true, deathSaves zero
    - Assign default weapons (melee: "1d4"/0 bonus, ranged: "1d4"/0 bonus) when pet has no weapons defined
    - _Requirements: 2.1, 2.3, 2.4, 2.7_

  - [ ]* 1.4 Write property tests for pet utility functions (Properties 1–4, 6–8)
    - Set up test framework (Jest + fast-check) with configuration for the project
    - **Property 1: Pet Assignment Invariant** — after any sequence of assignments, character has at most one pet (the latest)
    - **Property 2: Pet Storage Round-Trip** — assigned NPC data is fully preserved in pet field
    - **Property 3: Pet Removal Clears State** — after removal, pet is undefined
    - **Property 4: Storage Failure Preserves State** — simulated write failure leaves state unchanged
    - **Property 6: Pet ID Generation and Ownership Round-Trip** — generated ID passes isPetOwnedBy check
    - **Property 7: Conversion Rejects Invalid Input** — missing required fields returns valid: false with listed fields
    - **Property 8: Default Weapons on Missing Weapons** — petToCombatant assigns defaults when weapons undefined
    - **Validates: Requirements 1.1–1.7, 2.2, 2.6, 2.7, 8.4**

  - [ ]* 1.5 Write property test for petToCombatant conversion (Property 5)
    - **Property 5: Pet-to-Combatant Conversion Correctness** — validates type="player", hp/focus initialization, turnActions, deathSaves, and field mapping
    - **Validates: Requirements 2.1, 2.3, 2.4**

- [ ] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Modify CharacterContext for pet management
  - [ ] 3.1 Add `setPet` and `clearPet` methods to CharacterContext
    - Add `setPet(npc: NpcTemplate): Promise<void>` — assigns pet from NPC library, persists to AsyncStorage under `@rpg_sheet_data_v2`, handles errors by reverting state and showing alert
    - Add `clearPet(): Promise<void>` — removes pet from character, persists change, handles errors similarly
    - Update `INITIAL_CHARACTER` to include `pet: undefined`
    - Expose both methods via the context interface `CharacterContextType`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7_

- [ ] 4. Modify WebSocketContext for dual-entity join
  - [ ] 4.1 Add `joinSessionWithPet` method to WebSocketContext
    - Implement `joinSessionWithPet(ip: string, sessionId: string, playerInit: number, petInit: number): void`
    - Connect to WebSocket, on open send player JOIN_SESSION first, then pet JOIN_SESSION sequentially
    - Use `petToCombatant` to convert `character.pet` with the pet initiative value
    - Handle partial failure: if player joins but pet send fails, show alert with retry option
    - Expose the new method via the context interface `WebSocketContextType`
    - _Requirements: 3.1, 3.3, 3.4, 3.6_

  - [ ]* 4.2 Write unit tests for joinSessionWithPet message sequencing
    - Test that two JOIN_SESSION messages are sent in correct order (player first, pet second)
    - Test single combatant join when no pet is assigned
    - Test partial failure scenario allows pet retry
    - _Requirements: 3.1, 3.4, 3.6_

- [ ] 5. Create PetInitiativeModal component
  - [ ] 5.1 Create `components/modals/PetInitiativeModal.tsx`
    - Display modal after player initiative is confirmed, showing pet name in title
    - Include roll button that generates d20 (1–20) + pet.initiativeBonus
    - Include manual input field accepting integers 1–30 only
    - Keep modal visible until valid value is confirmed (dismiss without value keeps modal open)
    - Call `onConfirm(initiativeValue: number)` callback when confirmed
    - _Requirements: 6.1, 6.2, 6.3, 6.6_

  - [ ]* 5.2 Write property tests for initiative logic (Properties 14, 15)
    - **Property 14: Initiative Calculation** — d20 (1–20) + initiativeBonus equals final value
    - **Property 15: Initiative Input Validation** — accepts only integers in [1, 30]
    - **Validates: Requirements 6.2, 6.3**

- [ ] 6. Modify SessionCombatScreen for pet combat flow
  - [ ] 6.1 Integrate PetInitiativeModal into session-combat join flow
    - After player initiative is confirmed, check `character.pet` existence
    - If pet exists, show PetInitiativeModal before calling `joinSessionWithPet`
    - If no pet, proceed with standard `joinSession` flow
    - Store pet initiative value in local state for the join call
    - _Requirements: 3.1, 3.6, 6.1, 6.4_

  - [ ] 6.2 Add pet turn detection and ActiveTurnInterface rendering
    - Compute `myPetSafeId` using `getPetCombatantId(character.pet.name, character.name)`
    - Detect `isPetTurn` when `activeTurnId === myPetSafeId`
    - Render `ActiveTurnInterface` with pet combatant data when it's the pet's turn
    - Ensure pet actions send RESOLVE_ACTION with pet combatant ID as attackerId
    - Ensure END_TURN sends pet combatant ID
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6_

  - [ ] 6.3 Add dual ReactionOverlay rendering for pet
    - Render a second `ReactionOverlay` instance for the pet combatant
    - Show pet ReactionOverlay when: active turn is NOT pet's turn AND pet's turnActions.reaction is true
    - Apply layout offset (e.g., bottom positioning) to prevent overlap with player ReactionOverlay
    - _Requirements: 7.1, 7.4_

  - [ ]* 6.4 Write property tests for turn and reaction logic (Properties 9, 10, 11, 16–20)
    - **Property 9: Pet Turn Identification** — correctly identifies pet's turn via activeTurnId match
    - **Property 10: Turn Action Independence** — consuming action on one entity doesn't affect the other
    - **Property 11: End Turn Resets Actions** — ending turn resets all turnActions to true
    - **Property 16: Turn Order Placement** — inserting pet maintains descending initiative sort
    - **Property 17: Reaction Overlay Visibility** — visible when not pet's turn and reaction available
    - **Property 18: Reaction Consumption** — using reaction sets turnActions.reaction to false
    - **Property 19: Reaction Reset on Turn Start** — pet's turn start resets reaction to true
    - **Property 20: Insufficient Focus Blocks Reaction** — skill.cost > focus.current blocks reaction use
    - **Validates: Requirements 4.1, 4.3, 4.5, 4.6, 6.4, 7.1, 7.3, 7.5, 7.6**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Modify SpectatorCard and CombatNotification for pet display
  - [ ] 8.1 Extend SpectatorCard to support pet display
    - Add optional `isPet` and `ownerName` props to `SpectatorCardProps`
    - Append "(Pet)" label to display name when `isPet` is true
    - Show exact HP percentage to owner, descriptive health status label (`getHealthStatus`) to other players
    - Position pet SpectatorCard adjacent to player's card in the combatants list
    - _Requirements: 5.1, 5.6, 5.7_

  - [ ] 8.2 Handle pet CombatNotification in SessionCombatScreen
    - Detect when `lastEvent.target_id` matches pet combatant ID
    - Display CombatNotification for pet damage/heal events to the owner
    - Replace existing notification if one is already visible when pet receives damage/heal
    - _Requirements: 5.2, 5.3_

  - [ ] 8.3 Display DeathSaveMonitor when pet HP reaches zero
    - Render DeathSaveMonitor component for pet combatant when `petCombatant.hp.current <= 0`
    - Show successes and failures counters from pet's deathSaves
    - _Requirements: 5.5_

  - [ ]* 8.4 Write property tests for display logic (Properties 12, 13)
    - **Property 12: Pet Display Label Format** — label is formatted as "{petName} (Pet)"
    - **Property 13: HP Display Logic** — owner sees exact percentage, others see descriptive status based on thresholds
    - **Validates: Requirements 5.1, 5.7**

- [ ] 9. Handle reconnection and error scenarios
  - [ ] 9.1 Implement reconnection logic for both entities
    - On reconnect, send both player and pet JOIN_SESSION messages using stored initiative values from server sync
    - Synchronize current state of both entities (HP, focus, turnActions, deathSaves) from server response
    - Handle 300-second timeout: show "Sessão expirada" alert when server removes entities
    - _Requirements: 3.5, 8.1, 8.2, 8.5_

  - [ ] 9.2 Implement error handling for pet combat actions
    - If pet action fails on server, preserve turnActions state before the failed action and show error alert
    - If pet reaction with insufficient focus, block reaction and show "Foco insuficiente" alert
    - If WebSocket disconnects during pet JOIN_SESSION, preserve connection form inputs and show retry button
    - _Requirements: 3.3, 4.7, 7.6_

  - [ ]* 9.3 Write integration tests for reconnection and error flows
    - Test reconnection sends both entities with server-stored initiative
    - Test partial failure allows pet retry without disconnecting player
    - Test server failure preserves pet turnActions state
    - _Requirements: 3.3, 3.4, 3.5, 4.7, 8.2_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- No test framework currently exists in the project — task 1.4 includes setting up Jest + fast-check
- The project uses TypeScript with Expo/React Native, path aliases via `@/` prefix
- Existing patterns to follow: `npcToCombatant` for factory, `CharacterContext` for persistence, `WebSocketContext.joinSession` for connection flow

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "1.5"] },
    { "id": 3, "tasks": ["3.1", "4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1"] },
    { "id": 5, "tasks": ["5.2", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3"] },
    { "id": 7, "tasks": ["6.4", "8.1", "8.2", "8.3"] },
    { "id": 8, "tasks": ["8.4", "9.1", "9.2"] },
    { "id": 9, "tasks": ["9.3"] }
  ]
}
```
