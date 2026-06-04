1. **Fix TypeScript build errors**
   - Fix `src/components/Edge.tsx` ref typing. Change `useRef<THREE.Line>(null!)` to `useRef<THREE.Line>(null!)` and cast in the JSX `<line ref={lineRef as any}>`.
   - Fix `src/utils/forceLayout.ts` type errors. `e.source` is a `SimulationNodeDatum` or `string` in d3, so cast appropriately: `typeof e.source === "string" ? e.source : (e.source as any).id`. Also, fix `groupZ` object assignment on line 36 by changing `groupZ[g] = { z: Math.sin(angle) * 3 };` to `groupZ[g] = Math.sin(angle) * 3;`.
   - Verify changes using `git diff`.

2. **Improve Graph Physics (d3-force)**
   - In `src/utils/forceLayout.ts`, adjust parameters in `runForceSimulation`:
     - Change `forceLink` distance return to `Math.max(25, 45 - avgDeg * 1.5)`.
     - Change `forceManyBody` (charge) strength to `-(30 + deg * 2.5)` to add more repulsion.
     - Add `.alphaDecay(0.015)` and `.velocityDecay(0.2)` instead of original values for smoother node settling.
     - Adjust Z-dimension depth: `n.z = (baseZ + personalNoise) * SCALE * 2.5;`.
   - Verify changes using `git diff src/utils/forceLayout.ts`.

3. **Improve Visuals (Glow, Bloom, Colors)**
   - Integrate `@react-three/postprocessing` into `src/components/Scene.tsx`. Import `EffectComposer, Bloom`.
   - Add `<EffectComposer><Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} /></EffectComposer>` inside the `<Canvas>` when `!isMobile`.
   - Increase `pointLight` intensities in `Scene.tsx` from `2, 1.5, 1.2` to `2.5, 2.0, 1.8` for more dynamic range.
   - Adjust `EntryNode` in `src/components/Scene.tsx`: increase `emissiveIntensity={isSelected ? 1.5 : 0.8}` to better feed the Bloom effect. Update `COLORS` dictionary in `Scene.tsx` with more saturated values, e.g., dance: `"#66ffcc"`, somatic: `"#ff99cc"`, psychology: `"#ffcc66"`, psychedelic: `"#cc66ff"`.
   - Verify changes using `git diff src/components/Scene.tsx`.

4. **Improve Mobile Performance**
   - In `src/components/Scene.tsx` `<Canvas>`, set `dpr={isMobile ? 1 : [1, 2]}`.
   - In `src/components/Scene.tsx`, modify `EntryNode`:
     - `<sphereGeometry args={[data.r * 3, 16, 16]} />` (glow) -> `args={[data.r * 3, isMobile ? 12 : 16, isMobile ? 12 : 16]}`.
     - `<sphereGeometry args={[data.r, 20, 20]} />` (core) -> `args={[data.r, isMobile ? 12 : 20, isMobile ? 12 : 20]}`.
   - In `src/components/Scene.tsx`, modify `ConnectionLine` curve resolution: `curve.getPoints(30)` -> `curve.getPoints(isMobile ? 15 : 30)`.
   - In `src/components/Node.tsx` (unused file? It matches Scene's old component, but the plan requires optimizing mobile everywhere): `<sphereGeometry args={[size * 2.5, 16, 16]}` -> `12, 12`. `<sphereGeometry args={[size, 24, 24]}` -> `16, 16`.
   - Verify changes using `git diff`.

5. **Test Build**
   - Validate that `npm run build` passes with 0 errors.

6. **Pre-commit Step**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

7. **Submit PR**
   - Submit the changes using the `submit` tool.
