# Leetcode Solver

chrome://extensions

- Load Unpacked
- Reload

chrome://extensions/shortcuts

- Shortcut

### How to manage?

Side panel?

|                     |     |
| ------------------- | --- |
| Add toggle bookmark |     |
| Add run JS          |     |
|                     |     |
|                     |     |

## WIP

| Name   | Link                                     |
| ------ | ---------------------------------------- |
| Bamboo | https://cobaltai.bamboohr.com/careers/85 |

```js
node -e "import('@faker-js/faker').then(({ faker }) => { const fs=require('fs');

const suffix = ' ' + faker.word.adjective() + ' ' + faker.color.human();

/* ---------------- content.js ---------------- */
const contentFile = 'content.js';
let content = fs.readFileSync(contentFile,'utf8').split('\n');

/* line 1 */
content[0] =
  'console.log(' +
  JSON.stringify('Content script loading ' + faker.word.adjective() + ' ' + faker.color.human()) +
  ');';

/* line 7 (safe replace) */
content[6] = content[6].replace(
  /'([^']*)'/,
  (m, p1) => '\'' + (p1 + suffix) + '\''
);

fs.writeFileSync(contentFile, content.join('\n'));

/* ---------------- commands.js ---------------- */
const commandsFile = 'commands.js';
let commands = fs.readFileSync(commandsFile,'utf8');

/* update title field safely */
commands = commands.replace(
  /(title:\s*['\"])(.*?)(['\"])/,
  (m, a, b, c) => a + b + suffix + c
);

fs.writeFileSync(commandsFile, commands);

console.log('updated content.js + commands.js');

})" && pnpm esbuild snippets/app-submit/main.js --bundle --outfile=snippets/app-submit/dist/bundle.js
```
