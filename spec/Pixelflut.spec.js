const { Pixelflut } = require('../dist');

xdescribe(Pixelflut, () => {
  const pf = new Pixelflut('localhost', 8080, 0);

  it('sends a pixel', done => {
    pf
      .sendPixel(200, 200, 'ff0000')
      .then(data => {
        if (data) console.log(data);
        done();
      })
      .catch(err => done.fail(err));
  });

  it('sends many pixels', done => {
    const pixels = Array.from(Array(100), (_, i) => ({
      x: i,
      y: i,
      color: '00ff00'
    }));

    pf
      .sendPixels(pixels)
      .then(data => {
        if (data) console.log('data', data);
        done();
      })
      .catch(err => done.fail(err));
  });
});

describe('Make Jasmine happy', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
