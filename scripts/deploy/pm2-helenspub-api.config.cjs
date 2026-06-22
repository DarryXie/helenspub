const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

module.exports = {
  apps: [
    {
      name: 'helenspub-api',
      cwd: repoRoot,
      script: 'apps/api-server/dist/src/main.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
