# S5 Implementation Plan — Studio Depth & TREND

Spec roadmap S5. Goal: deeper identity customization — new slots, body/skin
controls, new archetypes, persistent loadouts — and the TREND currency
rebrand.

## Scope decisions (honest cuts)
- New slots: **EYEWEAR** added as a real equippable slot. VOICE + ANIMATION
  land as Companion *config* selections (personality/audio), not inventory
  items — animating rigs per-animation is beyond this phase.
- Body sliders: v1 = preset bodies (slim/athletic/heavy) + stance, rendered as
  rig proportion changes. Continuous sliders deferred.
- Skin: color tint on rig materials + 3 patterns (solid/metallic/glow).
- Archetypes: `animal` (quadruped-ish compact rig) + `abstract` (floating
  crystal core) added to renderer; studio gets base-model picker.
- Persistence: loadout + body/skin/archetype/voice saved to
  `Companion.config` via existing PATCH /api/companion; The World + dashboard
  read from it. localStorage stays as cache.
- TREND: display-only rebrand of `favorCredits` in UI strings; column name
  unchanged (zero migration risk).

## Tasks

### T1 — Slot + catalog expansion
`CombatSlot += 'EYEWEAR'`; catalog category += 'EYEWEAR'; add ~6 eyewear
items (visor/mono/goggle variants, procedural-GLB friendly); SLOT_CONFIG tab.
Swarm designer archetype map += EYEWEAR so the factory can fill them.

### T2 — Persistent loadout via Companion.config
Studio: on mount GET /api/companion → hydrate loadout + config; on equip/save
PATCH config.loadout. World/dashboard read companion.config.loadout first,
falling back to equipped UserCosmetics then defaults.
Test: PATCH merge keeps unrelated keys (already covered pattern — add case).

### T3 — Body/skin/archetype rendering
CompanionAvatar + Stage3D mannequin accept `config` (baseModel, body, skin):
proportions scale limbs/torso; skin tints materials w/ pattern emissive;
animal rig variant (low quad body + ears); abstract variant (crystal core +
orbitals). Base-model picker in studio.

### T4 — Voice selection
Voice list (deep/cheerful/robotic/mysterious/professional) stored in config;
rendered as chips in studio + shown on dashboard card. Audio synthesis is a
later phase — selection is real and persisted now.

### T5 — TREND rebrand
Dashboard/profile UI strings "Favor Credits" → "TREND"; points math
untouched. Grep-driven sweep of display copy only.

## Ship checklist
tsc + Vitest green per commit → push → Vercel probes: `/avatar-studio` 200,
companion PATCH roundtrip signed-in.
