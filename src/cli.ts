#!/usr/bin/env node

/* eslint-disable no-magic-numbers */

import {Pixelflut} from './';

new Pixelflut('localhost', 8080, 0)
  .sendPixel(200, 200, 'ff0000')
  .then(data => {
    if (data) {
      console.info('data:', data);
    }
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
