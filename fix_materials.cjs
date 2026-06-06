const fs = require('fs');

let content = fs.readFileSync('src/data/nodesData.ts', 'utf8');

// The field-seed nodes have some mock articles, but the main raw nodes from NODES_PART1/2/3 don't.
// Let's modify the map rawNodes to dynamically inject mock articles if they are missing.

const targetMap = `export const INITIAL_NODES: SomaticNode[] = rawNodes.map((node: any, index: number) => ({
  id: node.id,
  nameRu: node.nameRu,
  nameEn: node.nameEn,
  type: node.type,
  level: mapIdToLevel(node.id),
  domain: mapGroupToDomain(node.group),
  world: 'atlas',
  status: 'atlas',
  resonances: Math.floor(Math.random() * 50) + 10,
  connections: Math.floor(Math.random() * 30),
  carries: Math.floor(Math.random() * 15),
  score: 100,
  descriptionRu: node.descRu,
  descriptionEn: node.descEn,
  epochRu: node.epochRu || 'XX век',
  epochEn: node.epochEn || '20th Century',
  authorRu: node.figures,
  authorEn: node.figures,
}));`;

const replacementMap = `export const INITIAL_NODES: SomaticNode[] = rawNodes.map((node: any, index: number) => {
  const domain = mapGroupToDomain(node.group);
  return {
    id: node.id,
    nameRu: node.nameRu,
    nameEn: node.nameEn,
    type: node.type,
    level: mapIdToLevel(node.id),
    domain,
    world: 'atlas',
    status: 'atlas',
    resonances: Math.floor(Math.random() * 50) + 10,
    connections: Math.floor(Math.random() * 30),
    carries: Math.floor(Math.random() * 15),
    score: 100,
    descriptionRu: node.descRu,
    descriptionEn: node.descEn,
    epochRu: node.epochRu || 'XX век',
    epochEn: node.epochEn || '20th Century',
    authorRu: node.figures,
    authorEn: node.figures,
    articles: [
      {
        id: \`art-\${node.id}-1\`,
        nodeId: node.id,
        titleRu: \`Исследование: \${node.nameRu}\`,
        titleEn: \`Research paper on \${node.nameEn}\`,
        summaryRu: \`Академическая статья, исследующая влияние и развитие концепции "\${node.nameRu}" в современном контексте.\`,
        summaryEn: \`Academic paper exploring the evolution of \${node.nameEn} in modern somatic contexts.\`,
        sourceUrl: 'https://scholar.google.com',
        sourceTitle: 'Somatic Research Journal',
        year: 2021,
        type: 'research'
      },
      {
        id: \`art-\${node.id}-2\`,
        nodeId: node.id,
        titleRu: \`Книга: Практики и \${node.nameRu}\`,
        titleEn: \`Book: Practice of \${node.nameEn}\`,
        summaryRu: \`Фундаментальный труд, описывающий практическое применение \${node.nameRu} для студентов и преподавателей.\`,
        summaryEn: \`Fundamental book describing practical applications.\`,
        sourceUrl: 'https://amazon.com',
        sourceTitle: 'Movement Publishers',
        year: 1998,
        type: 'book'
      },
      {
        id: \`art-\${node.id}-3\`,
        nodeId: node.id,
        titleRu: \`Видео-лекция: \${node.figures || 'Эксперт'} о \${node.nameRu}\`,
        titleEn: \`Lecture: \${node.figures || 'Expert'} on \${node.nameEn}\`,
        summaryRu: \`Запись выступления на конференции, посвященная философии и применению \${node.nameRu}.\`,
        summaryEn: \`Conference talk recording.\`,
        sourceUrl: 'https://youtube.com',
        sourceTitle: 'Somatic Movement Archive',
        year: 2015,
        type: 'video'
      }
    ]
  };
});`;

content = content.replace(targetMap, replacementMap);
fs.writeFileSync('src/data/nodesData.ts', content);

console.log("Injected mock articles into INITIAL_NODES in nodesData.ts");
