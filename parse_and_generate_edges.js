import fs from 'fs';

const p1 = fs.readFileSync('src/data/edges-part1.ts', 'utf8');
const p2 = fs.readFileSync('src/data/edges-part2.ts', 'utf8');

const allMatches = [];
const regex = /\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g;
let match;
while ((match = regex.exec(p1)) !== null) {
  allMatches.push({ source: match[1], target: match[2], label: match[3] });
}
while ((match = regex.exec(p2)) !== null) {
  allMatches.push({ source: match[1], target: match[2], label: match[3] });
}
console.log(`Found ${allMatches.length} edges in parts 1 and 2`);

let strContent = fs.readFileSync('src/data/stories.ts', 'utf8');
strContent = strContent.replace('import { Story } from \'../types\';\n\nexport const STORIES: Story[] = ', '');
// The previous code might have put a trailing newline and semicolon.
if (strContent.endsWith(';\n')) {
    strContent = strContent.slice(0, -2);
} else if (strContent.endsWith(';')) {
    strContent = strContent.slice(0, -1);
}

const stories = JSON.parse(strContent);

let matchCount = 0;
stories.forEach(story => {
  const parts = story.id.split('_');
  if (parts.length >= 2) {
    const s1 = parts[0];
    const s2 = parts[1];
    
    // Exact or partial match in allMatches
    const matchingEdge = allMatches.find(e => 
      (e.source.includes(s1) && e.target.includes(s2)) || 
      (e.source.includes(s2) && e.target.includes(s1))
    );
    
    if (matchingEdge) {
      story.edgeId = `lnk-${matchingEdge.source}-${matchingEdge.target}`;
      matchCount++;
    } else {
      story.edgeId = `lnk-${s1}-${s2}`; // fallback
    }
  }
});

console.log(`Matched ${matchCount} out of ${stories.length} stories directly to existing source/target pairs.`);

const outContent = `import { Story } from '../types';\n\nexport const STORIES: Story[] = ${JSON.stringify(stories, null, 2)};\n`;
fs.writeFileSync('src/data/stories.ts', outContent);

