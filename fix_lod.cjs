const fs = require('fs');
let content = fs.readFileSync('src/components/MyceliumGraph.tsx', 'utf8');

// 1. LOD Node rendering logic
// Find Node function definition
// Add distance from camera logic. 
// We can use the useFrame to calculate distance if needed, or simply let the radius be based on level, and only render text if the camera is close enough.
// Actually, drei's Text already scales correctly if we just change the label rendering.

const replaceTextRender = `
    <Billboard position={[
      (node.x || 0) * SCALE,
      (node.y || 0) * SCALE + radius + 0.16,
      (node.z || 0) * SCALE
    ]}>
      <Text
        fontSize={isSelected || isActiveAudio ? 0.19 : 0.14}
        color={isSelected || isActiveAudio ? '#DFB757' : '#D1D7E0'}
        anchorX="center"
        anchorY="bottom"
        maxWidth={2.5}
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
      >
        {label}
      </Text>
    </Billboard>
`;

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

content = content.replace(replaceTextRender, textRenderReplacement);

// 2. Adjust node radius based on level
// Find:
// const radius = node.currentRadius || 0.3;
// Actually we need to check how it's calculated.

// 3. Prevent text overlapping by letting d3-force handle node collisions.
// The task asks to add a d3-force 'collide' equivalent.
// Wait, the current layout is purely custom force loop in useFrame.
// We can add a simple collision force in the custom loop.

const collisionForceLogic = `
        const distSq = dx*dx + dy*dy + dz*dz;
        const dist = Math.sqrt(distSq);

        // Simple Collision force based on LOD radius
        const n1Radius = n1.level === 'macro' ? 1.2 : (n1.level === 'meso' ? 0.7 : 0.3);
        const n2Radius = n2.level === 'macro' ? 1.2 : (n2.level === 'meso' ? 0.7 : 0.3);
        const minDistance = (n1Radius + n2Radius) * 2.5; // Padding factor

        if (dist > 0.1 && dist < minDistance) {
          const overlap = minDistance - dist;
          const collisionForce = overlap * 0.15;
          n1.vx = (n1.vx || 0) - (dx / dist) * collisionForce;
          n1.vy = (n1.vy || 0) - (dy / dist) * collisionForce;
          n1.vz = (n1.vz || 0) - (dz / dist) * collisionForce;
          n2.vx = (n2.vx || 0) + (dx / dist) * collisionForce;
          n2.vy = (n2.vy || 0) + (dy / dist) * collisionForce;
          n2.vz = (n2.vz || 0) + (dz / dist) * collisionForce;
        }
`;

const replaceRepulsion = `
        const distSq = dx*dx + dy*dy + dz*dz;
        const dist = Math.sqrt(distSq);
`;

content = content.replace(replaceRepulsion, collisionForceLogic);

fs.writeFileSync('src/components/MyceliumGraph.tsx', content);
console.log("Updated MyceliumGraph.tsx LOD and collision forces");
