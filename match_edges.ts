import fs from 'fs';
import path from 'path';

import { EDGES_PART1 } from './src/data/edges-part1.ts';
import { EDGES_PART2 } from './src/data/edges-part2.ts';
import { NODES_PART1 } from './src/data/nodes-part1.ts';
import { NODES_PART2 } from './src/data/nodes-part2.ts';
import { NODES_PART3 } from './src/data/nodes-part3.ts';

const allEdges = [...EDGES_PART1, ...EDGES_PART2];
const allNodes = [...NODES_PART1, ...NODES_PART2, ...NODES_PART3];

const stories = JSON.parse(fs.readFileSync('parsed_stories.json', 'utf8'));

function findNodeId(name: string): string | null {
  if (!name) return null;
  const nname = name.trim().toLowerCase();
  
  const node = allNodes.find(n => 
    (n.nameRu && n.nameRu.toLowerCase() === nname) || 
    (n.nameEn && n.nameEn.toLowerCase() === nname)
  );
  return node ? node.id : null;
}

function findEdge(node1: string, node2: string): any | null {
  return allEdges.find(e => 
    (e.source === node1 && e.target === node2) ||
    (e.source === node2 && e.target === node1)
  ) || null;
}

let matchedCount = 0;

stories.forEach(story => {
  const idA = findNodeId(story.figureA);
  const idB = findNodeId(story.figureB);
  
  if (idA && idB) {
    const edge = findEdge(idA, idB);
    if (edge) {
      story.edgeId = edge.id;
      matchedCount++;
    } else {
      console.log(`Missing edge for ${story.figureA} (${idA}) and ${story.figureB} (${idB})`);
    }
  } else {
    console.log(`Missing nodes for ${story.figureA} (${idA}) and ${story.figureB} (${idB})`);
  }
});

console.log(`Matched ${matchedCount} out of ${stories.length} stories to edges.`);

fs.writeFileSync('stories_with_edges.json', JSON.stringify(stories, null, 2));
