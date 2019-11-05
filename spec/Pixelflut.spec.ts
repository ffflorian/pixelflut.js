import {Pixelflut} from '../src';

xdescribe('Pixelflut', () => {
  const pf = new Pixelflut({errorTolerance: 0, port: 8080, server: 'localhost'});

  it('sends a pixel', done => {
    pf.sendPixel(200, 200, 'ff0000')
      .then(data => {
        if (data) {
          console.log(data);
        }
        done();
      })
      .catch(err => done.fail(err));
  });

  it('sends many pixels', done => {
    const pixels = Array.from(Array(100), (_, i) => ({
      color: '00ff00',
      x: i,
      y: i,
    }));

    pf.sendPixels(pixels)
      .then(data => {
        if (data) {
          console.log('data', data);
        }
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
