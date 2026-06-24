const fs = require('fs');
const glob = require('glob'); // Note: we might not have glob, better to use fs.readdirSync

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = dir + '/' + file;
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      // Ignore
    }
  });
  return filelist;
}

const files = walkSync('src/modules');
files.filter(f => f.endsWith('.ts')).forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Regex to find trace.generation with model, and then getGroqClient()
  // This is a simplistic approach. A better approach is to find getGroqClient() and look backwards for model: "..."
  const regex = /model:\s*["']([^"']+)["'][^]*?const\s+groqClient\s*=\s*getGroqClient\(\)/g;
  
  content = content.replace(regex, (match, modelName) => {
    console.log(`Fixing ${file} to use model ${modelName}`);
    changed = true;
    return match.replace(/getGroqClient\(\)/, `getGroqClient("${modelName}")`);
  });
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
