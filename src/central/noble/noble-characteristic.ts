import { IXyoCharacteristic, IXyoDescriptor } from '../'
import { NobleDescriptor } from './noble-descriptor'
import noble from '@xyo-network/noble'
import { XyoBase } from '@xyo-network/sdk-base-nodejs'

export class NobleCharacteristic extends XyoBase implements IXyoCharacteristic {
  get uuid(): string {
    return this.characteristic.uuid
  }

  get name(): string {
    return this.characteristic.name
  }

  get type(): string {
    return this.characteristic.type
  }

  get properties(): string[] {
    return this.characteristic.properties
  }

  get descriptors(): IXyoDescriptor[] {
    const returnArray: IXyoDescriptor[] = []

    this.characteristic.descriptors.forEach(descriptor => {
      returnArray.push(new NobleDescriptor(descriptor))
    })

    return returnArray
  }

  // tslint:disable-next-line:prefer-array-literal
  public notifyListeners: Array<
    (data: Buffer, isNotification: boolean) => void
  > = []
  public characteristic: noble.Characteristic

  constructor(characteristic: noble.Characteristic) {
    super()
    this.characteristic = characteristic
    this.characteristic.on('data', this.onNotify)
    this.characteristic.on('notify', this.onNotify)
    this.characteristic.on('broadcast', this.onNotify)
  }

  public read(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.logInfo(
        `Trying to read characteristic with uuid: ${this.characteristic.uuid}`
      )

      this.characteristic.read((error, buffer) => {
        if (error == null) {
          this.logInfo(
            `Successfully read with uuid: ${this.characteristic.uuid}`
          )
          resolve(buffer)
        } else {
          this.logError(
            `Error reading characteristic with uuid: ${this.characteristic.uuid}`
          )
          reject(error)
        }
      })
    })
  }

  public write(value: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logInfo(
        `Trying to write to characteristic with uuid: ${this.characteristic.uuid}`
      )

      // todo figure out what this true or false really does
      this.characteristic.write(value, true, error => {
        if (error == null) {
          this.logInfo(
            `Successfully wrote to characteristic with uuid: : ${this.characteristic.uuid}`
          )
          resolve()
        } else {
          this.logError(
            `Error writing to characteristic with uuid: ${this.characteristic.uuid}`
          )
          reject(error)
        }
      })
    })
  }

  public discoverDescriptors(): Promise<IXyoDescriptor[]> {
    return new Promise((resolve, reject) => {
      this.logInfo(
        `Trying to discover descriptors on characteristic with uuid: ${this.characteristic.uuid}`
      )

      this.characteristic.discoverDescriptors((error, descriptors) => {
        if (error == null) {
          this.logInfo(
            `Successfully discovered descriptors on characteristic: ${this.characteristic.uuid}`
          )
          const returnArray: IXyoDescriptor[] = []

          descriptors.forEach(descriptor => {
            returnArray.push(new NobleDescriptor(descriptor))
          })

          resolve(returnArray)
        } else {
          this.logError(
            `Error discovering descriptors on characteristic: ${this.characteristic.uuid}`
          )
          reject(error)
        }
      })
    })
  }

  public subscribe(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logInfo(
        `Trying to subscribe to characteristic with uuid: ${this.characteristic.uuid}`
      )

      this.characteristic.subscribe(error => {
        if (error == null) {
          this.logInfo(
            `Successfully subscribed to characteristic with uuid: ${this.characteristic.uuid}`
          )
          resolve()
        } else {
          this.logError(
            `Error subscribing to characteristic with uuid: ${this.characteristic.uuid}`
          )
          reject(error)
        }
      })
    })
  }

  public unsubscribe(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logInfo(
        `Trying to unsubscribe from characteristic with uuid: ${this.characteristic.uuid}`
      )

      this.characteristic.unsubscribe(error => {
        if (error == null) {
          this.logInfo(
            `Successfully unsubscribed from characteristic with uuid: ${this.characteristic.uuid}`
          )
          resolve()
        } else {
          this.logInfo(
            `Error unsubscribing from characteristic with uuid: : ${this.characteristic.uuid}`
          )
          reject(error)
        }
      })
    })
  }

  public on(
    event: 'notification',
    listener: (data: Buffer, isNotification: boolean) => void
  ): this {
    this.logInfo('Notfied')
    this.notifyListeners.push(listener)
    return this
  }

  private onNotify = (data: Buffer, isNotification: boolean) => {
    this.logInfo(
      `Received notification on characteristic with UUID: ${this.characteristic.uuid}`
    )
    this.notifyListeners.forEach(listener => {
      listener(data, isNotification)
    })
  }
}
