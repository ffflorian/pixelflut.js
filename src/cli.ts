#!/usr/bin/env node

import * as commander from 'commander';
import {Pixelflut} from './';

const {name, version, description}: {name: string; version: string; description: string} = require('../package.json');

commander
  .name(name)
  .description(description)
  .arguments('picture')
  .version(version, '-v, --version')
  .parse(process.argv);

if (!commander.args[0]) {
  commander.outputHelp();
  process.exit(1);
}

new Pixelflut({server: 'localhost', port: 1234, errorTolerance: 0})
  .sendImage(commander.args[0])
  .then(message => {
    if (message) {
      console.log('Message from server:', message);
    }
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
