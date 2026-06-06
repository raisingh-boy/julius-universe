const fs = require('fs');
let content = fs.readFileSync('src/components/MyceliumGraph.tsx', 'utf8');

const targetMeshLogic = `
  // Render updates loops dynamically scale glowing spheres indicating life cycle breath
  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const t = state.clock.elapsedTime;
      const pulse = Math.sin(t * (node.breathSpeed || 2.0) + (node.breathPhase || 0)) * 0.12;
      const baseRadius = (node.currentRadius || 0.45);
      const s = (baseRadius + pulse * baseRadius) * SCALE;
      meshRef.current.scale.set(s, s, s);
      glowRef.current.scale.set(s * 1.6, s * 1.6, s * 1.6);
      
      meshRef.current.position.set((node.x || 0) * SCALE, (node.y || 0) * SCALE, (node.z || 0) * SCALE);
      glowRef.current.position.set((node.x || 0) * SCALE, (node.y || 0) * SCALE, (node.z || 0) * SCALE);
    }
  });
`;

const meshLogicReplacement = `
  // Render updates loops dynamically scale glowing spheres indicating life cycle breath
  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const t = state.clock.elapsedTime;
      const pulse = Math.sin(t * (node.breathSpeed || 2.0) + (node.breathPhase || 0)) * 0.12;
      
      // Calculate LOD radius base
      const levelRadius = node.level === 'macro' ? 1.2 : (node.level === 'meso' ? 0.7 : 0.3);
      const baseRadius = (node.currentRadius || levelRadius);
      
      const s = (baseRadius + pulse * baseRadius) * SCALE;
      meshRef.current.scale.set(s, s, s);
      glowRef.current.scale.set(s * 1.6, s * 1.6, s * 1.6);
      
      meshRef.current.position.set((node.x || 0) * SCALE, (node.y || 0) * SCALE, (node.z || 0) * SCALE);
      glowRef.current.position.set((node.x || 0) * SCALE, (node.y || 0) * SCALE, (node.z || 0) * SCALE);
    }
  });
`;

content = content.replace(targetMeshLogic, meshLogicReplacement);

// Let's also check if the Text is updated correctly.
// Oh, the pointer-events: none is not directly supported by <Text> from react-three-drei, because it's a mesh inside canvas. 
// But <Billboard> makes it face the camera. Since the user doesn't interact with the text (they interact with the sphere mesh), the text overlapping doesn't block clicks unless raycasting hits the text mesh and stops.
// Actually <Text> has a property `characters` or we can set `raycast={() => null}` to prevent it from capturing clicks.
const textRenderReplacement = `
    <Billboard position={[
      (node.x || 0) * SCALE,
      (node.y || 0) * SCALE + radius + 0.16,
      (node.z || 0) * SCALE
    ]}>
      <Text
        fontSize={node.level === 'macro' ? 0.22 : (node.level === 'meso' ? 0.16 : 0.12)}
        color={isSelected || isActiveAudio ? '#DFB757' : (node.level === 'macro' ? '#FFFFFF' : '#D1D7E0')}
        anchorX="center"
        anchorY="bottom"
        maxWidth={3.0}
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </Billboard>
`;
const textRaycastReplacement = `
    <Billboard position={[
      (node.x || 0) * SCALE,
      (node.y || 0) * SCALE + radius + 0.16,
      (node.z || 0) * SCALE
    ]}>
      <Text
        raycast={() => null}
        fontSize={node.level === 'macro' ? 0.22 : (node.level === 'meso' ? 0.16 : 0.12)}
        color={isSelected || isActiveAudio ? '#DFB757' : (node.level === 'macro' ? '#FFFFFF' : '#D1D7E0')}
        anchorX="center"
        anchorY="bottom"
        maxWidth={3.0}
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </Billboard>
`;
content = content.replace(textRenderReplacement, textRaycastReplacement);

fs.writeFileSync('src/components/MyceliumGraph.tsx', content);
console.log("Updated mesh LOD and raycast");
