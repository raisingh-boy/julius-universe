const fs = require('fs');
let content = fs.readFileSync('src/data/nodesData.ts', 'utf8');

const target1 = `    titleEn: 'Gregory Bateson and Somatic Synergies',
    authorRu: 'Лекция: Проф. Григорий Шевелев',
    authorEn: 'Lecture: Prof. Gregory Shevelev',
    sourceRu: 'Архив Института Эсален',`;
const rep1 = `    titleEn: 'Gregory Bateson and Somatic Synergies',
    authorRu: 'Лекция: Проф. Григорий Шевелев',
    authorEn: 'Lecture: Prof. Gregory Shevelev',
    audioUrl: '/audio/test.mp3',
    sourceRu: 'Архив Института Эсален',`;

content = content.replace(target1, rep1);

const target2 = `    titleEn: 'Rhizomatic Body: Deleuze in Practice',
    authorRu: 'Семинарская запись',
    authorEn: 'Seminar transcript',
    sourceRu: 'Париж, 1980',`;
const rep2 = `    titleEn: 'Rhizomatic Body: Deleuze in Practice',
    authorRu: 'Семинарская запись',
    authorEn: 'Seminar transcript',
    audioUrl: '/audio/test.mp3',
    sourceRu: 'Париж, 1980',`;
    
content = content.replace(target2, rep2);

fs.writeFileSync('src/data/nodesData.ts', content);
console.log("Updated SAMPLE_AUDIO properly");
