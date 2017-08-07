import * as dgram from 'dgram';
import * as net from 'net';
import { StringDecoder } from 'string_decoder';

export class Pixelflut {
  server: string;
  port: number;
  udpSocket: dgram.Socket;
  tcpSocket: net.Socket;
  udp: boolean = false;

  constructor(server: string, port: number, udp: boolean = false) {
    this.server = server;
    this.port = port;
    this.udp = udp;
  }

  createTCPConnection(message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.tcpSocket = new net.Socket();
      this.tcpSocket.connect(this.port, this.server, () =>
        this.tcpSocket.write(message, err => {
          if (err) reject(err);
        })
      );

      this.tcpSocket.on('data', bytes => resolve(bytes.toString('utf8')));
      this.tcpSocket.on('error', err => reject(err));
      this.tcpSocket.on('close', () => reject('Connection closed'));
    });
  }

  createUDPConnection(message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.udpSocket = dgram.createSocket('udp4');
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
      );
    });
  }

  send(x: number, y: number, color: string): Promise<number | string> {
    console.log(
      `Sending ${color} at <${x}, ${y}> over ${this.udp
        ? 'UDP'
        : 'TCP'} to ${this.server}:${this.port}`
    );
    const message = `PX ${x} ${y} ${color}\n`;
    console.log('Full message:', `"${message}"`);
    if (this.udp) {
      return this.createUDPConnection(message);
    } else {
      return this.createTCPConnection(message);
    }
  }
}
