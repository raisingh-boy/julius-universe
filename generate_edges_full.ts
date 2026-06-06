import fs from 'fs';
import { EDGES_PART1 } from './src/data/edges-part1.ts';
import { EDGES_PART2 } from './src/data/edges-part2.ts';

const allEdgesData = [...EDGES_PART1, ...EDGES_PART2];
const processedEdges = [];

allEdgesData.forEach((edgeData, i) => {
  const [source, target, labelRu] = edgeData;
  const id = `lnk-${source}-${target}`;
  processedEdges.push({
    id,
    source,
    target,
    labelRu,
    type: 'conceptual', // Default type
    world: 'atlas',
    resonanceWeight: 1,
    activity: 0
  });
});

console.log(`Generated ${processedEdges.length} edges.`);

// Now we need to parse stories and bind them to these edge IDs
