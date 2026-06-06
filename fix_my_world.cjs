const fs = require('fs');
let content = fs.readFileSync('src/components/MyceliumGraph.tsx', 'utf8');

const targetLogic = `        if (n.id === 'central-me') {
          tx = 0; ty = 0; tz = 0;
        } else {
          const seed = Math.sin(idx * 1.5);
          const dist = 120 + Math.abs(seed) * 150;
          const angle = idx * 1.2;
          tx = Math.cos(angle) * dist;
          ty = Math.sin(angle) * dist;
          tz = idx * 16 * Math.sin(idx * 0.65); // Multi-layer overlapping shells
        }`;

const replacementLogic = `        if (n.id === 'central-me') {
          tx = 0; ty = 0; tz = 0;
        } else {
          // Orbit layout around "Me"
          // Keep new senses nearby
          const seed = Math.sin(idx * 1.5);
          const dist = 60 + Math.abs(seed) * 80; // Closer orbit radius (was 120 + abs * 150)
          const angle = idx * ((Math.PI * 2) / Math.max(1, gState.nodes.length - 1)); // distribute evenly
          tx = Math.cos(angle) * dist;
          ty = Math.sin(angle) * dist;
          tz = Math.cos(idx * 0.5) * 40; // slight Z variation
        }`;

content = content.replace(targetLogic, replacementLogic);

// Add gravity force towards center for 'me' world
const targetGravity = `    const gravityStrength = 0.045;`;
const replacementGravity = `    const gravityStrength = currentWorld === 'me' ? 0.08 : 0.045; // Stronger center pull in My World`;

content = content.replace(targetGravity, replacementGravity);

const targetForceApp = `    // Gravity to center
    gState.nodes.forEach(n => {
      n.vx = (n.vx || 0) - (n.x || 0) * gravityStrength;
      n.vy = (n.vy || 0) - (n.y || 0) * gravityStrength;
      n.vz = (n.vz || 0) - (n.z || 0) * gravityStrength;
    });`;

const replacementForceApp = `    // Gravity to center
    gState.nodes.forEach(n => {
      if (currentWorld === 'me' && n.id !== 'central-me') {
        // pull towards central-me dynamically
        const meNode = gState.nodes.find(node => node.id === 'central-me');
        if (meNode) {
          const dx = (n.x || 0) - (meNode.x || 0);
          const dy = (n.y || 0) - (meNode.y || 0);
          const dz = (n.z || 0) - (meNode.z || 0);
          n.vx = (n.vx || 0) - dx * gravityStrength;
          n.vy = (n.vy || 0) - dy * gravityStrength;
          n.vz = (n.vz || 0) - dz * gravityStrength;
        } else {
          n.vx = (n.vx || 0) - (n.x || 0) * gravityStrength;
          n.vy = (n.vy || 0) - (n.y || 0) * gravityStrength;
          n.vz = (n.vz || 0) - (n.z || 0) * gravityStrength;
        }
      } else {
        n.vx = (n.vx || 0) - (n.x || 0) * gravityStrength;
        n.vy = (n.vy || 0) - (n.y || 0) * gravityStrength;
        n.vz = (n.vz || 0) - (n.z || 0) * gravityStrength;
      }
    });`;

content = content.replace(targetForceApp, replacementForceApp);

fs.writeFileSync('src/components/MyceliumGraph.tsx', content);

console.log("Updated MyceliumGraph.tsx radial layout for My World");
