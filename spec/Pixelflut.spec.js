'use strict';

const { Pixelflut } = require('../dist');

describe(Pixelflut, () => {
  const pf = new Pixelflut('localhost', 8080);

  it('sends a message', done => {
    pf
      .send(200, 200, 'ff0000')
      .then(data => {
        if (data) console.log(data);
        done();
      })
      .catch(err => done.fail(err));
  });
});
