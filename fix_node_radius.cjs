const fs = require('fs');
let content = fs.readFileSync('src/components/MyceliumGraph.tsx', 'utf8');

// Also update the physical mesh rendering of the node.
// We need to find where the mesh geometry is defined.

// Typically it's: const scale = node.currentRadius || something;
// We'll search for scale calculation.
const match = content.match(/const scale = .*?;/);
if (match) {
  console.log("Found scale definition: " + match[0]);
}

const scaleDefinitionTarget = `const scale = (node.currentRadius || 10) * SCALE * (node.breathPhase ? (1 + node.breathPhase * 0.1) : 1);`;
const scaleReplacement = `
        const baseRadius = node.level === 'macro' ? 1.2 : (node.level === 'meso' ? 0.7 : 0.3);
        const scale = (node.currentRadius || baseRadius) * SCALE * (node.breathPhase ? (1 + node.breathPhase * 0.1) : 1);
`;
content = content.replace(scaleDefinitionTarget, scaleReplacement);
fs.writeFileSync('src/components/MyceliumGraph.tsx', content);

console.log("Updated MyceliumGraph.tsx node radius based on level");
