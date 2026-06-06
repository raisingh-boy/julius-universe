const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetApp = `      score: 1,
      descriptionRu: obs.text,
      descriptionEn: obs.text,
      addedBy: userProfile.name,
      isPrivate: obs.isPrivate,
      lastActiveAt: Date.now()
    };`;

const replacementApp = `      score: 1,
      descriptionRu: obs.text,
      descriptionEn: obs.text,
      addedBy: userProfile.name,
      isPrivate: obs.isPrivate,
      lastActiveAt: Date.now(),
      // Start near Me
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 20,
      z: (Math.random() - 0.5) * 20,
    };`;

content = content.replace(targetApp, replacementApp);
fs.writeFileSync('src/App.tsx', content);

console.log("Updated App.tsx to spawn nodes near origin");
