import * as dgram from 'dgram';
import * as net from 'net';
import { StringDecoder } from 'string_decoder';

export class Pixelflut {
  private server: string;
  private port: number;
  private udpSocket: dgram.Socket;
  private tcpSocket: net.Socket;
  private udp: boolean = false;
  private errorTolerance: number;
  public errors: Array<string> = [];

  constructor(
    server: string,
    port: number,
    errorTolerance: number = 10,
    udp: boolean = false
  ) {
    this.server = server;
    this.port = port;
    this.udp = udp;
    this.errorTolerance = errorTolerance;

    if (udp) {
      console.info('Note: UDP is not supported right now. Switching to TCP.');
      this.udp = false;
    }
  }

  public createTCPConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      let data: string;

      this.tcpSocket = new net.Socket();

      this.tcpSocket
        .on('data', bytes => {
          data += bytes.toString('utf8');
        })
        .on('error', err => {
          if (this.failed(err.message)) {
            reject(err.message);
          } else {
            resolve();
          }
        })
        .on('close', () => {
          if (this.failed('TCP Connection closed')) {
            reject('TCP Connection closed');
          } else {
            resolve();
          }
        });

      this.tcpSocket.connect(this.port, this.server, () => resolve());
    });
  }

  public createUDPConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      let data: string;

      this.udpSocket = dgram.createSocket('udp4');

      this.udpSocket
        .on('data', bytes => {
          data += bytes.toString('utf8');
        })
        .on('error', err => {
          if (this.failed(err.message)) {
            reject(err.message);
          } else {
            resolve();
          }
        })
        .on('close', () => {
          if (this.failed('UDP Connection closed')) {
            reject('UDP Connection closed');
          } else {
            resolve();
          }
        });

      this.tcpSocket.connect(this.port, this.server, () => resolve());
    });
  }

  private writeToUDP(message: string): Promise<any> {
    return new Promise((resolve, reject) =>
      this.udpSocket.send(
        message,
        0,
        message.length,
        this.port,
        this.server,
        (err, bytes) => {
          if (err) {
            reject(err);
          } else if (bytes) {
            resolve(bytes.toString());
          }
        }
      )
    );
  }

  private failed(message: string): boolean {
    this.errors.push(message);
    return this.errors.length > this.errorTolerance;
  }

  public sendPixel(x: number, y: number, color: string): Promise<string> {
    console.log(
      `Sending #${color} at <${x}, ${y}> over ${this.udp
        ? 'UDP'
        : 'TCP'} to ${this.server}:${this.port}`
    );

    const message = `PX ${x} ${y} ${color}\n`;
    return this.createTCPConnection().then(() => this.writeToTCP(message));
  }

  public sendPixels(
    pixels: Array<{ x: number; y: number; color: string }>
  ): Promise<any> {
    console.log(
      `Sending ${pixels.length} pixels from <${pixels[0].x}, ${pixels[
        pixels.length - 1
      ].y}> to <${pixels[pixels.length - 1].x}, ${pixels[0].y}> over ${this.udp
        ? 'UDP'
        : 'TCP'} to ${this.server}:${this.port}`
    );
    const messages: Array<string> = pixels.map(
      pixel => `PX ${pixel.x} ${pixel.y} ${pixel.color}\n`
    );

    return this.createTCPConnection().then(() =>
      Promise.all(
        messages.map(message => this.writeToTCP(message))
      ).then(values => values.filter(value => typeof value !== 'undefined'))
    );
  }

  private writeToTCP(message: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.tcpSocket.write(message, err => {
        if (err) {
          reject(err.message);
        } else {
          resolve();
        }
      });
    });
  }
}
