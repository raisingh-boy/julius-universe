const fs = require('fs');
let stories = JSON.parse(fs.readFileSync('src/data/stories.ts', 'utf8').replace('import { Story } from \'../types\';\n\nexport const STORIES: Story[] = ', '').replace(/;\s*$/, ''));

// We actually noticed my first parse script didn't extract text correctly because of formatting
// Let's re-extract textRu and textEn correctly from the original text!

const data = fs.readFileSync('SEAMLESS_UNIVERSE_DATA.txt', 'utf8');
const storiesSection = data.split('РАЗДЕЛ 3: ВСЕ ИСТОРИИ ПЕРЕСЕЧЕНИЙ')[1];
const storyBlocks = storiesSection.split(/--- ИСТОРИЯ \d+ ---/).slice(1);

const parsedStories = [];

storyBlocks.forEach((block, index) => {
  const idMatch = block.match(/ID:\s*(.+)/);
  if (!idMatch) return;
  const id = idMatch[1].trim();

  const titleMatch = block.match(/Title:\s*(.+)/);
  const titleEn = titleMatch ? titleMatch[1].trim() : '';
  const titleRu = titleEn;

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

  // textRu is between "Текст:" and "EN:" (if present) or end
  const textRuMatch = block.match(/Текст:\s*([\s\S]*?)(?=\nEN:|\nID:|$)/);
  const textRu = textRuMatch ? textRuMatch[1].trim() : '';

  // textEn is between "EN:" and "ID:" (if next story) or end
  const textEnMatch = block.match(/EN:\s*([\s\S]*?)(?=\nID:|$)/);
  const textEn = textEnMatch ? textEnMatch[1].trim() : '';
  
  const parts = id.split('_');
  let edgeId = `lnk-${parts.join('-')}`; // fallback

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

