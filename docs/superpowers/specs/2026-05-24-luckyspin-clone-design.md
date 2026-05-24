# LuckySpin Clone Design

## Summary

LuckySpin will be a Korean-only, GitHub Pages-friendly web app that recreates the visual and functional feel of `https://lazygyu.github.io/roulette/` using new source code. The app will use `Vite + React + TypeScript` for the application shell and `matter-js` for the marble physics experience.

The goal is not to copy the original bundled JavaScript, WASM, CSS, or image assets. The goal is to build a maintainable implementation that feels close to the original: full-screen roulette canvas, dark mode by default, fruit-like marbles, neon track styling, fixed bottom controls, ranking list, and a start sequence where marbles move through the course and produce a winner order.

## Confirmed Decisions

- Use `Vite + React + TypeScript`.
- Use `matter-js` for 2D physics.
- Use Korean-only UI copy.
- Create fruit/marble visuals ourselves with canvas or CSS drawing.
- Use open icons such as `lucide-react` instead of original icon files.
- Include most original UI controls.
- Treat recording and shop actions as disabled first-version affordances that show Korean toast messages.
- Initialize the current folder as the Git repository and connect `https://github.com/asher8554/LuckySpin.git` as `origin`.
- Build for GitHub Pages with Vite `base: "/LuckySpin/"`.

## Product Scope

### In Scope

- Full-screen responsive roulette experience.
- Canvas-based game area with dark and light themes.
- One playable marble course inspired by the original vertical/diagonal track layout.
- Name input with comma and newline separators.
- Entry parsing for repeat counts such as `수박*2`.
- Optional weight parsing support such as `키위/3` if it does not complicate the first implementation.
- Shuffle action that randomizes marble order.
- Start action that drops or launches marbles into a `matter-js` world.
- Ranking display with `current / total` count and ordered results.
- Winner rank selection with first, last, and custom rank modes.
- Map selector UI with multiple labels, even if the first version only enables the main map.
- Dark mode toggle.
- Recording toggle UI with disabled toast behavior.
- Skill toggle UI with disabled or lightweight first-version behavior.
- Notice modal.
- Shop button disabled affordance with toast behavior.
- Mobile layout with collapsible settings.
- Local persistence for names and theme preference.

### Out Of Scope For First Version

- Copying original minified source files, WASM files, or image assets.
- Real video recording.
- External shop integration.
- External keyword or sprite API integration.
- Full multi-map implementation.
- Internationalization UI.
- Backend services.
- Audio controls, sharing, fullscreen mode, and real recording alternatives.

## User Experience

The app opens directly into the roulette workspace. The first viewport is the product experience itself, not a landing page. The canvas fills the viewport. A fixed bottom settings panel sits above the copyright line. The right side of the canvas shows the current result count and ranking list.

The default input is similar to the original, for example `수박*2,키위*2,귤*2`. Users can edit the list, shuffle it, then start the roulette. While the simulation is active, the settings panel fades or hides to keep focus on the marble motion. When the selected winner rank is resolved or the run completes, the panel returns and the result remains visible.

For unsupported controls, the UI should not silently do nothing. Recording, shop, and any first-version disabled map should show a concise toast explaining that the feature is not supported in this version. Disabled controls should not navigate away or imply that external recording or shop integrations are active.

All UI labels should be Korean. Original labels map to `설정`, `맵`, `녹화`, `스킬 활성화`, `당첨 순위`, `첫번째`, `마지막`, `섞기`, `시작`, and `공지`.

## Visual Direction

The visual thesis is a dark arcade-style marble roulette: black canvas, neon cyan rails, colored fruit marbles, compact gray control panel, and bright ranking text. The design should feel like a functional clone of the original interaction, not a generic SaaS interface.

The app should avoid decorative gradients and unrelated marketing sections. Visual energy should come from the canvas scene, moving marbles, neon rails, and ranking updates.

## Architecture

React owns UI state, user input, settings, and result state. The canvas layer owns physics setup, animation, and drawing. Pure parsing and ranking logic live outside React so they can be tested with `vitest`.

Planned file boundaries:

- `src/main.tsx` mounts React only.
- `src/App.tsx` coordinates app state, layout, and top-level event handlers.
- `src/components/ControlPanel.tsx` renders name input, settings, actions, toggles, and mobile collapse behavior.
- `src/components/RouletteCanvas.tsx` mounts the canvas and connects physics events back to React callbacks.
- `src/components/RankingBoard.tsx` renders `current / total` and ordered results.
- `src/components/NoticeModal.tsx` renders the first-version notice.
- `src/components/ToastHost.tsx` renders short-lived status messages.
- `src/hooks/useRoulettePhysics.ts` owns `matter-js` engine creation, runner lifecycle, resize listeners, collision events, and cleanup.
- `src/lib/roulette.ts` parses names, expands entries, shuffles entries, and computes selected winner state.
- `src/lib/physics.ts` creates and controls the `matter-js` world, marble bodies, track bodies, sensors, and reset behavior.
- `src/lib/fruits.ts` maps entry names to colors and draws fruit-style marbles.
- `src/lib/storage.ts` handles local storage for names and theme preference.

## Data Flow

1. User edits `textarea`.
2. `parseEntries()` turns text into normalized entries. It accepts comma and newline separators, trims whitespace, ignores empty tokens, supports `이름*숫자`, and treats invalid counts as `1`.
3. `expandEntries()` creates marble instances based on count syntax while preserving display names.
4. `shuffleEntries()` randomizes marble order and can reseed spawn variance for the next run.
5. `App` passes marble instances and settings to `RouletteCanvas`.
6. `RouletteCanvas` creates a `matter-js` world and starts the animation.
7. When a marble reaches the finish sensor, the physics layer emits a result event. The actual finish order determines the ranking.
8. `App` appends the result to ranking state.
9. `RankingBoard` updates the visible list and selected winner state. `첫번째`, `마지막`, and custom rank modes decide which rank is highlighted, not which marble wins.
10. When the run finishes or the selected rank is reached, `App` restores the control panel.

## Physics And Rendering

The first version should prefer a constrained, reliable physics scene over a highly complex replica. The track can be implemented with static rectangular and polygonal bodies, a finish sensor, and controlled marble spawn positions. Rendering can use the canvas 2D API with explicit drawing of rails, marbles, labels, and glow effects.

The simulation must be deterministic enough for testing manually but still feel random enough for roulette use. Shuffling and minor spawn variance can provide randomness. If `matter-js` produces unstable outcomes on resize, the implementation should reset the world cleanly and preserve entries/settings.

The physics hook must clean up `Engine`, `Runner`, animation frames, collision listeners, and resize listeners on unmount and when rebuilding the scene. Start and shuffle actions must not create duplicate runners.

The initial map selector should show `운명의 수레바퀴`, `버블팝`, `욕망의 항아리`, and `밤을 달리다`. Only `운명의 수레바퀴` needs to be playable in the first version. Other map options show an unsupported toast and keep the active map unchanged.

Fruit drawing should include at least watermelon, kiwi, and tangerine/orange visual rules because those appear in the default sample. Unknown names receive a stable generated color and simple labeled marble.

## Error Handling

- Empty input disables start or shows a toast asking for names.
- Invalid count or rank values are clamped to safe values.
- Unsupported controls show a toast.
- Canvas resize rebuilds static track geometry without corrupting current React state.
- Repeated start clicks during a run are ignored or show a running-state toast.
- Input changes reset current results before the next run.

## Testing

Use `vitest` for pure logic:

- Parse comma-separated names.
- Parse newline-separated names.
- Parse repeat counts such as `수박*2`.
- Deduplicate or normalize blur behavior only if implemented.
- Shuffle returns the same set of marble instances in a different order where possible.
- Winner rank selection clamps to valid bounds.
- Repeated invalid count values fall back to one marble.

Use build verification:

- `npm run build` must pass.
- TypeScript must compile without errors.

Use browser verification after implementation:

- Desktop viewport renders nonblank full-screen canvas.
- Mobile viewport renders collapsible controls without text overlap.
- Start moves marbles and updates ranking.
- Disabled recording/shop actions show toasts.
- Theme toggle changes the canvas/control contrast.
- Repeated start, quick shuffle then start, and input change then restart do not create duplicate physics runners.

## Deployment

Vite should set `base: "/LuckySpin/"` so the built app works under GitHub Pages for `asher8554/LuckySpin`. Automated GitHub Pages deployment can be added after the first app implementation if requested, but the first implementation must at least produce a valid static build.

## Agent Usage Plan

The user requested agent usage. Planning and implementation should use agents where they add value without overlapping edits:

- Use a read-only planner or reviewer to check the design and implementation plan for missed risks.
- During implementation, split work by file ownership if using code-writing agents.
- Keep core integration local in the main thread.
- Tell every code-writing agent not to revert unrelated changes and to list changed files.
- Review and test all agent output before marking work complete.
