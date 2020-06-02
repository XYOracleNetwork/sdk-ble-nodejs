import { IXyoBluetoothDevice, IXyoCharacteristic } from '../central'
import {
  IXyoNetworkPipe,
  XyoAdvertisePacket
} from '@xyo-network/sdk-core-nodejs'
import { chunkBytes } from './output-stream'
import { XyoInputStream } from './input-stream'

export class XyoClientBlePipe implements IXyoNetworkPipe {
  private device: IXyoBluetoothDevice
  private characteristic: IXyoCharacteristic | undefined
  private notifyHandle: ((bytes: Buffer) => void) | undefined

  constructor(device: IXyoBluetoothDevice) {
    this.device = device
  }

  public getInitiationData(): XyoAdvertisePacket | undefined {
    return undefined
  }

  public async send(
    data: Buffer,
    waitForResponse: boolean
  ): Promise<Buffer | undefined> {
    if (!this.characteristic) {
      console.log('no characteristic')
      throw new Error('characteristic not found')
    }

    const chunks = chunkBytes(this.addBleSize(data), 20)
    const readJob = waitForResponse
      ? new Promise<Buffer | undefined>((resolve, reject) => {
          const reader = new XyoInputStream()

          const timeOutJob = setTimeout(() => {
            this.notifyHandle = undefined
            reject('timed out')
          }, 20_000)

          this.notifyHandle = (bytes: Buffer): void => {
            reader.addChunk(bytes)
            const all = reader.getOldestPacket()

            if (all) {
              clearTimeout(timeOutJob)
              this.notifyHandle = undefined
              resolve(all)
            }
          }
        })
      : undefined

    for (let i = 0; i < chunks.length; i++) {
      await this.characteristic.write(chunks[i])
    }

    return readJob
  }

  private addBleSize(data: Buffer): Buffer {
    const buffer = Buffer.alloc(4)
    buffer.writeUInt32BE(data.length + 4, 0)
    return Buffer.concat([buffer, data])
  }

  public close(): Promise<void> {
    return this.device.disconnect()
  }

  public async init(): Promise<void> {
    await this.device.connect()
    const services = await this.device.discoverServices()
    const xyoServices = services.filter(s => {
      return s.uuid.toLowerCase() === 'd684352edf36484ebc982d5398c5593e'
    })

    if (xyoServices.length < 1) {
      throw new Error('xyo service not found')
    }

    const xyoService = xyoServices[0]
    const characteristics = await xyoService.discoverCharacteristics()

    const xyoCharacteristics = characteristics.filter(c => {
      return c.uuid.toLowerCase() === '727a36390eb44525b1bc7fa456490b2d'
    })

    if (xyoCharacteristics.length < 1) {
      throw new Error('xyo characteristic not found')
    }

    this.characteristic = xyoCharacteristics[0]

    await this.characteristic.subscribe()
    this.characteristic.on('notification', data => {
      console.log('got notify', data.toString('hex'))
      const handle = this.notifyHandle

      if (handle) {
        handle(data)
      }
    })
  }
}

export async function createPipeFromDevice(
  device: IXyoBluetoothDevice
): Promise<XyoClientBlePipe> {
  const pipe = new XyoClientBlePipe(device)
  await pipe.init()
  return pipe
}
