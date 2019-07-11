import * as dgram from 'dgram';
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import {promisify} from 'util';

import * as ImageTools from './ImageTools';

export interface Options {
  /** Default is 10 */
  errorTolerance?: number;
  port: number;
  server: string;
  /** Default is `false` */
  udp?: boolean;
}

const defaultOptions: Required<Options> = {
  errorTolerance: 10,
  port: 1234,
  server: 'localhost',
  udp: false,
};

export class Pixelflut {
  public errors: string[] = [];
  private udpSocket?: dgram.Socket;
  private tcpSocket?: net.Socket;
  private readonly options: Required<Options>;

  constructor(options?: Options) {
    this.options = {...defaultOptions, ...options};

    if (this.options.udp) {
      console.info('Note: UDP is not supported right now. Switching to TCP.');
      this.options.udp = false;
    }
  }

  public createTCPConnection(): Promise<string> {
    return new Promise((resolve, reject) => {
      let data: string;

      this.tcpSocket = new net.Socket();

      this.tcpSocket
        .on('data', bytes => (data += bytes.toString('utf8')))
        .on('error', error => {
          if (this.failed(error.message)) {
            reject(error);
          } else {
            resolve();
          }
        })
        .on('close', () => {
          if (this.failed('TCP Connection closed')) {
            reject(new Error('TCP Connection closed'));
          } else {
            resolve(data);
          }
        });

      this.tcpSocket.connect(this.options.port, this.options.server, () => resolve());
    });
  }

  public createUDPConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.udpSocket = dgram.createSocket('udp4');
      let data: string;

      this.udpSocket
        .on('data', bytes => (data += bytes.toString('utf8')))
        .on('error', error => {
          if (this.failed(error.message)) {
            reject(error);
          } else {
            resolve();
          }
        })
        .on('close', () => {
          if (this.failed('UDP Connection closed')) {
            reject(new Error('UDP Connection closed'));
          } else {
            resolve();
          }
        });

      if (this.tcpSocket) {
        this.tcpSocket.connect(this.options.port, this.options.server, () => resolve());
      } else {
        reject(new Error('No TCP socket available'));
      }
    });
  }

  public writeToUDP(message: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.udpSocket) {
        this.udpSocket.send(message, 0, message.length, this.options.port, this.options.server, (err, bytes) => {
          if (err) {
            reject(err);
          } else if (bytes) {
            resolve(bytes.toString());
          }
        });
      } else {
        reject(new Error('No UDP socket available'));
      }
    });
  }

  public async sendImage(fileName: string): Promise<string> {
    const resolvedFile = path.resolve(fileName);
    const buffer = await promisify(fs.readFile)(resolvedFile);
    await ImageTools.parseImage(buffer, resolvedFile);
    return '';
  }

  public async sendPixel(x: number, y: number, color: string): Promise<string> {
    console.log(
      `Sending #${color} at <${x}, ${y}> over ${this.options.udp ? 'UDP' : 'TCP'} to ${this.options.server}:${
        this.options.port
      }`
    );

    const message = `PX ${x} ${y} ${color}\n`;
    await this.createTCPConnection();
    return this.writeToTCP(message);
  }

  public async sendPixels(pixels: Array<{x: number; y: number; color: string}>): Promise<string[]> {
    console.log(
      `Sending ${pixels.length} pixels from <${pixels[0].x}, ${pixels[pixels.length - 1].y}> to <${
        pixels[pixels.length - 1].x
      }, ${pixels[0].y}> over ${this.options.udp ? 'UDP' : 'TCP'} to ${this.options.server}:${this.options.port}`
    );
    const messages = pixels.map(pixel => `PX ${pixel.x} ${pixel.y} ${pixel.color}\n`);

    await this.createTCPConnection();
    const values = await Promise.all(messages.map(message => this.writeToTCP(message)));
    return values.filter(value => typeof value !== 'undefined');
  }

  private failed(message: string): boolean {
    this.errors.push(message);
    return this.errors.length > this.options.errorTolerance;
  }

  private writeToTCP(message: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.tcpSocket) {
        this.tcpSocket.write(message, error => (error ? reject(error) : resolve()));
      } else {
        reject(new Error('No TCP socket available'));
      }
    });
  }
}
