import fs from 'fs';

const data = fs.readFileSync('SEAMLESS_UNIVERSE_DATA.txt', 'utf8');

const storiesSection = data.split('РАЗДЕЛ 3: ВСЕ ИСТОРИИ ПЕРЕСЕЧЕНИЙ')[1];
const storyBlocks = storiesSection.split(/--- ИСТОРИЯ \d+ ---/).slice(1);

const parsedStories = [];

storyBlocks.forEach(block => {
  const idMatch = block.match(/ID:\s*(.+)/);
  if (!idMatch) return;
  const id = idMatch[1].trim();

  const titleMatch = block.match(/Title:\s*(.+)/);
  const titleEn = titleMatch ? titleMatch[1].trim() : '';
  const titleRu = titleEn; // Using En as fallback, can improve if separate titles exist

  const linkMatch = block.match(/Связь:\s*(.+)/);
  let figureA = '';
  let figureB = '';
  if (linkMatch) {
    const figures = linkMatch[1].split('x');
    if (figures.length >= 2) {
      figureA = figures[0].trim();
      figureB = figures[1].trim();
    } else {
      figureA = figures[0].trim();
    }
  }

  const yearMatch = block.match(/Год:\s*(.+)/);
  const year = yearMatch ? parseInt(yearMatch[1].trim()) : 0;

  const textRuMatch = block.match(/Текст:\s*([\s\S]*?)(?:\nEN:|\Z)/);
  const textRu = textRuMatch ? textRuMatch[1].trim() : '';

  const textEnMatch = block.match(/EN:\s*([\s\S]*?)(?:\n\Z|\Z)/);
  const textEn = textEnMatch ? textEnMatch[1].trim() : '';

  // Calculate edgeId
  // The story ID is usually sourceId_targetId. Let's try to extract edge ID.
  const parts = id.split('_');
  let edgeId = '';
  if (parts.length >= 2) {
    // try to make an edgeId out of it
    // edges in the system are currently constructed as 'lnk-source-target' but wait, we need to check how they are constructed in nodesData.ts
    // In edges-part1.ts, edges are arrays `["source", "target", "label"]`. The application processes them into objects.
    // If the app uses `lnk-${source}-${target}` as ID, we can do that.
    edgeId = `lnk-${parts[0]}-${parts[1]}`;
  } else {
    edgeId = 'lnk-unknown';
  }

  parsedStories.push({
    id,
    edgeId,
    titleRu,
    titleEn,
    textRu,
    textEn,
    figureA,
    figureB,
    year: isNaN(year) ? 0 : year,
    resonances: 0,
    verified: true
  });
});

console.log(`Parsed ${parsedStories.length} stories`);

const outContent = `import { Story } from '../types';\n\nexport const STORIES: Story[] = ${JSON.stringify(parsedStories, null, 2)};\n`;
fs.writeFileSync('src/data/stories.ts', outContent);
