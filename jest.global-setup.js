const { execSync } = require('child_process');

module.exports = async () => {
  console.log('\n[Jest Global Setup] Running migrate:reset...');
  execSync('npm run migrate:reset', { stdio: 'inherit' });
  console.log('[Jest Global Setup] migrate:reset finished.');
};
