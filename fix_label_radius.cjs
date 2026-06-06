const fs = require('fs');
let content = fs.readFileSync('src/components/MyceliumGraph.tsx', 'utf8');

const labelRadiusTarget = `  const radius = (node.currentRadius || 10) * SCALE;`;
const labelRadiusReplacement = `  const levelRadius = node.level === 'macro' ? 1.2 : (node.level === 'meso' ? 0.7 : 0.3);
  const radius = (node.currentRadius || levelRadius) * SCALE;`;

content = content.replace(labelRadiusTarget, labelRadiusReplacement);
fs.writeFileSync('src/components/MyceliumGraph.tsx', content);

console.log("Fixed label radius");
