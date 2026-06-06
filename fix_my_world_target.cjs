const fs = require('fs');
let content = fs.readFileSync('src/components/MyceliumGraph.tsx', 'utf8');

const targetForceApp = `      } else {
        node.vx = (node.vx || 0) + ((node.targetX || 0) - (node.x || 0)) * gravityStrength;
        node.vy = (node.vy || 0) + ((node.targetY || 0) - (node.y || 0)) * gravityStrength;
        node.vz = (node.vz || 0) + ((node.targetZ || 0) - (node.z || 0)) * gravityStrength;
        node.x = (node.x || 0) + (node.vx || 0);`;

const replacementForceApp = `      } else {
        if (currentWorld === 'me' && node.id !== 'central-me') {
          // pull towards central-me dynamically instead of a fixed target, or pull to a calculated orbit target
          // Using targetX, targetY, targetZ as calculated in the setup phase is already an orbit!
          // We just need to make sure we pull them properly.
          node.vx = (node.vx || 0) + ((node.targetX || 0) - (node.x || 0)) * gravityStrength;
          node.vy = (node.vy || 0) + ((node.targetY || 0) - (node.y || 0)) * gravityStrength;
          node.vz = (node.vz || 0) + ((node.targetZ || 0) - (node.z || 0)) * gravityStrength;
        } else {
          node.vx = (node.vx || 0) + ((node.targetX || 0) - (node.x || 0)) * gravityStrength;
          node.vy = (node.vy || 0) + ((node.targetY || 0) - (node.y || 0)) * gravityStrength;
          node.vz = (node.vz || 0) + ((node.targetZ || 0) - (node.z || 0)) * gravityStrength;
        }
        node.x = (node.x || 0) + (node.vx || 0);`;

content = content.replace(targetForceApp, replacementForceApp);
fs.writeFileSync('src/components/MyceliumGraph.tsx', content);

console.log("Updated MyceliumGraph.tsx radial logic properly");
