const fs = require('fs');
let content = fs.readFileSync('src/data/nodesData.ts', 'utf8');

content = content.replace(
  `authorEn: 'Lecture: Prof. Gregory Shevelev',\n    sourceRu: 'Архив Института Эсален'`,
  `authorEn: 'Lecture: Prof. Gregory Shevelev',\n    audioUrl: '/audio/test.mp3',\n    sourceRu: 'Архив Института Эсален'`
);

content = content.replace(
  `authorEn: 'Seminar transcript',\n    sourceRu: 'Париж, 1980'`,
  `authorEn: 'Seminar transcript',\n    audioUrl: '/audio/test.mp3',\n    sourceRu: 'Париж, 1980'`
);

fs.writeFileSync('src/data/nodesData.ts', content);
console.log("Updated SAMPLE_AUDIO to use /audio/test.mp3");
