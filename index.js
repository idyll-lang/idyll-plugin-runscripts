const AST = require('idyll-ast');

const { execSync } = require('child_process');
const fs = require('fs');

const hashCode = (s) => {
  return "" + Math.abs(s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
}

let lastTime = 0;
const MIN_TIME = 1000;

module.exports = (ast) => {

  const curTime = new Date().getTime();

  return AST.modifyNodesByName(ast, 'codehighlight', (node) => {
    if (node.properties.language && node.properties.language.value.startsWith('exec:')) {
      const language = node.properties.language.value.replace('exec:', '');
      if (['rscript', 'rstats', 'r'].indexOf(language.toLowerCase()) > -1) {
        const contents = node.children[0].value;
        const id = hashCode(contents);
        const tmpFileName = `.idyll/${id}.r`;
        const imageFileName = `.idyll/${id}.png`;
        const fileContents = `
          png(filename="${imageFileName}");
          ${contents}
          dev.off();
        `
        fs.writeFileSync(tmpFileName, fileContents);
        execSync(`Rscript ${tmpFileName}`);
        fs.unlinkSync(tmpFileName);
        if ((curTime - lastTime) < MIN_TIME) {
          fs.renameSync(imageFileName, `static/${id}.png`);
        } else {
          lastTime = curTime;
          fs.renameSync(imageFileName, `build/static/${id}.png`);
        }
        node.name = 'div';
        node.properties = {};
        node.children = [
          AST.createNode(node.children[0].id, 'img', 'component', { src: { type: 'value', value: `static/${id}.png`}})
        ]
      }
    }
    return node;
  })

};