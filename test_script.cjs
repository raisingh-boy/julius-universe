const fs = require('fs');
const data = fs.readFileSync('SEAMLESS_UNIVERSE_DATA.txt', 'utf8');

const match = data.match(/РАЗДЕЛ 3: ВСЕ ИСТОРИИ ПЕРЕСЕЧЕНИЙ.*?\n-{10,}/s);
if (match) {
  console.log("Found match:");
  console.log(match[0].substring(0, 500));
} else {
  console.log("Not found.");
}
