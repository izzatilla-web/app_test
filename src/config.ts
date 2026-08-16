/**
 * Application feature flags.
 *
 * One constant per feature. Keep this file free of imports so any module can
 * read a flag without pulling in dependencies.
 */

/**
 * Games feature — temporarily disabled for this release.
 * Planned for a future version; the implementation is kept intact.
 *
 * While this is false the whole Games system is inactive: the O'yin tab is
 * removed from the bottom navigation, the games route is guarded and falls
 * back to Today, and no game module is imported, initialised or executed.
 *
 * Set it to true to bring everything back — the tab, the route, the arena,
 * the topic journey, battle/matchmaking, sprint, daily challenge, shop,
 * collection, league and every game animation. No other change is required.
 *
 * Game implementation lives in (all intentionally left untouched):
 *   src/gameData.ts
 *   src/screens/StudentArena.tsx      — game home / hub
 *   src/screens/GamePlay.tsx          — question runner
 *   src/screens/SprintPlay.tsx        — 60-second sprint
 *   src/screens/BattleEntry.tsx       — battle entry
 *   src/screens/BattleLobby.tsx       — matchmaking, lobby, battle, results
 *   src/screens/GameShop.tsx          — shop, coins, collection
 *   src/screens/GameLeague.tsx        — leaderboard
 *   src/screens/CurriculumUnits.tsx   — topic/level browser
 *   src/components/TopicJourney.tsx   — journey path + nodes
 *   src/components/LevelRing.tsx      — player level ring
 *   src/motion/*                      — node motion geometry + ring animation
 *   src/celebration/*                 — confetti / party-popper overlay
 *   src/sound.ts                      — shared with Avatar Studio, keep enabled
 */
// The `boolean` annotation is deliberate: it stops TypeScript from narrowing
// the flag to the literal `false`, so flipping it needs no other edit.
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const GAMES_ENABLED: boolean = false;
