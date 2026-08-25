const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ByteCode_Complete_Guide.html');
let html = fs.readFileSync(filePath, 'utf8');

// Find all sections
const lines = html.split('\n');
let currentLetter = '';
let currentCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Match section header: <div class="q-cat">A. Something</div>
  const catMatch = line.match(/<div class="q-cat">([A-Z])\.\s/);
  if (catMatch) {
    currentLetter = catMatch[1];
    currentCount = 0;
  }
  
  // Match question badge: <div class="q-n">XYZ</div>
  if (line.includes('<div class="q-n">') && currentLetter) {
    currentCount++;
    lines[i] = line.replace(/<div class="q-n">[^<]+<\/div>/, `<div class="q-n">${currentLetter}${currentCount}</div>`);
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Successfully repaired all question numbers!');
