const fs = require('fs');

let content = fs.readFileSync('src/components/MyceliumGraph.tsx', 'utf8');

// The field logic: if currentWorld === 'field', the repulsion should scale by node count.
// Instead of const repulsionStrength = 2200; we should do:
// let repulsionStrength = 2200;
// if (currentWorld === 'field') {
//   repulsionStrength = Math.max(300, 2200 - (100 - gState.nodes.length * 50)); 
//   or simply:
//   repulsionStrength = gState.nodes.length < 10 ? 300 : 2200;
// }

const replaceTarget = `
    const gravityStrength = 0.045;
    const repulsionStrength = 2200;
    const attractionStrength = 0.038;
`;

const replacement = `
    const gravityStrength = 0.045;
    let repulsionStrength = 2200;
    const attractionStrength = 0.038;
    
    // Dynamic Field spacing based on node count
    if (currentWorld === 'field') {
      const fieldNodesCount = gState.nodes.length;
      if (fieldNodesCount < 10) {
        repulsionStrength = 400 + (fieldNodesCount * 40); // Pack closer when few nodes
      } else {
        repulsionStrength = Math.min(2200, 800 + (fieldNodesCount * 20)); // Gradually expand
      }
    }
`;

content = content.replace(replaceTarget, replacement);
fs.writeFileSync('src/components/MyceliumGraph.tsx', content);

console.log("Updated MyceliumGraph.tsx repulsion forces");
