import * as dgram from 'dgram';
import * as net from 'net';

export class Pixelflut {
  public errors: string[] = [];
  private readonly errorTolerance: number;
  private readonly port: number;
  private readonly server: string;
  private tcpSocket?: net.Socket;
  private readonly udp: boolean = false;
  private udpSocket?: dgram.Socket;

  constructor(server: string, port: number, errorTolerance: number = 10, udp: boolean = false) {
    this.server = server;
    this.port = port;
    this.udp = udp;
    this.errorTolerance = errorTolerance;

    if (udp) {
      console.info('Note: UDP is not supported right now. Switching to TCP.');
      this.udp = false;
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

      this.tcpSocket.connect(this.port, this.server, () => resolve());
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
        this.tcpSocket.connect(this.port, this.server, () => resolve());
      } else {
        reject(new Error('No TCP socket available'));
      }
    });
  }

  public async sendPixel(x: number, y: number, color: string): Promise<string> {
    console.log(`Sending #${color} at <${x}, ${y}> over ${this.udp ? 'UDP' : 'TCP'} to ${this.server}:${this.port}`);

    const message = `PX ${x} ${y} ${color}\n`;
    await this.createTCPConnection();
    return this.writeToTCP(message);
  }

  public async sendPixels(pixels: Array<{color: string; x: number; y: number}>): Promise<string[]> {
    console.log(
      `Sending ${pixels.length} pixels from <${pixels[0].x}, ${pixels[pixels.length - 1].y}> to <${
        pixels[pixels.length - 1].x
      }, ${pixels[0].y}> over ${this.udp ? 'UDP' : 'TCP'} to ${this.server}:${this.port}`
    );
    const messages = pixels.map(pixel => `PX ${pixel.x} ${pixel.y} ${pixel.color}\n`);

    await this.createTCPConnection();
    const values = await Promise.all(messages.map(message => this.writeToTCP(message)));
    return values.filter(value => typeof value !== 'undefined');
  }

  public writeToUDP(message: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.udpSocket) {
        this.udpSocket.send(message, 0, message.length, this.port, this.server, (err, bytes) => {
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

  private failed(message: string): boolean {
    this.errors.push(message);
    return this.errors.length > this.errorTolerance;
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
