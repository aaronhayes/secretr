#!/usr/bin/env node
/*
 * Wait for local servers/hosts to come online
 * 
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 16-December-2018
 * @flow
 */
const hollaback = require('hollaback');

if (process.argv.length !== 3) {
  console.error('Usage: node wait-for-host [host]:[port]|[host]:[port]');
  process.exit(1);
}

const hosts = process.argv[2].split('|');

console.log('Waiting for hosts ...', hosts);


hollaback(...hosts, { timeout: 10000 })
  .then(() => {
    setTimeout(() => {
      console.log('All hosts now available');
      process.exit(0);
    }, 500);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
