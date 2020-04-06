import {
  IXyoMutableCharacteristic,
  XyoMutablePermissions,
  IXyoMutableDescriptor,
  IXyoMutableCharacteristicListener
} from '../'
import {
  Characteristic,
  Bleno,
  Descriptor,
  CharacteristicOptions,
  Property
} from '@xyo-network/bleno'
import { BlenoDescriptor } from './bleno-descriptor'
import { XyoBase } from '@xyo-network/sdk-base-nodejs'

export class BlenoCharacteristic extends XyoBase
  implements IXyoMutableCharacteristic {
  private listenersMap = new Map<string, IXyoMutableCharacteristicListener>()
  private notifyChangedCallback: ((value: Buffer) => void) | undefined
  characteristic: Characteristic

  get uuid(): string {
    return this.characteristic.uuid
  }

  get permissions(): XyoMutablePermissions[] {
    // todo find way to get permissions
    return []
  }

  // value: (Buffer | undefined) = Buffer.alloc(2)

  get value(): Buffer | undefined {
    const value = this.characteristic.value

    if (value) {
      return value
    }

    return undefined
  }

  set value(value: Buffer | undefined) {
    if (value) {
      this.characteristic.value = value
    } else {
      this.characteristic.value = null
    }
  }

  get descriptors(): IXyoMutableDescriptor[] {
    const descs: IXyoMutableDescriptor[] = []

    this.characteristic.descriptors.forEach((desc: Descriptor) => {
      descs.push(new BlenoDescriptor(desc))
    })

    return descs
  }

  constructor(uuid: string, properties: Property[]) {
    super()
    const options: CharacteristicOptions = {
      uuid,
      properties: properties,
      onWriteRequest: this.onWriteRequest,
      onSubscribe: this.onSubscribe,
      onReadRequest: this.onReadRequest,
      onUnsubscribe: this.onUnsubscribe
    }

    this.characteristic = new Characteristic(options)
  }

  onSubscribe = (maxValueSize: number, updateValueCallback: any) => {
    this.logInfo('onSubscribe')
    this.notifyChangedCallback = updateValueCallback

    for (const [_, value] of this.listenersMap) {
      const callback = value.onSubscribe

      if (callback) {
        callback()
      }
    }
  }

  onUnsubscribe = () => {
    this.logInfo('onUnsubscribe')
    this.notifyChangedCallback = undefined

    for (const [_, value] of this.listenersMap) {
      const callback = value.onUnsubscribe

      if (callback) {
        callback()
      }
    }
  }

  onWriteRequest = async (
    data: Buffer,
    offset: number,
    withoutResponse: boolean,
    callback: (result: number) => void
  ) => {
    this.logInfo('onWriteRequest')
    for (const [_, value] of this.listenersMap) {
      const handle = value.onWrite

      if (handle) {
        const canWrite = await handle(data)

        if (canWrite) {
          this.characteristic.value = data
          callback(Characteristic.RESULT_SUCCESS)
        } else {
          callback(Characteristic.RESULT_UNLIKELY_ERROR)
        }

        return
      }
    }

    callback(Characteristic.RESULT_UNLIKELY_ERROR)
  }

  onReadRequest = (
    offset: number,
    callback: (result: number, data?: Buffer) => void
  ) => {
    this.logInfo('onReadRequest')
    for (const [_, value] of this.listenersMap) {
      const handle = value.onRead

      if (handle) {
        handle()
      }
    }

    const value = this.characteristic.value

    if (value) {
      callback(Characteristic.RESULT_SUCCESS, value)
      return
    }

    callback(Characteristic.RESULT_SUCCESS)
  }

  public async notifyChanged(): Promise<void> {
    this.logInfo('notifyChanged')
    const value = this.value

    if (this.notifyChangedCallback && value) {
      this.notifyChangedCallback(value)
    }
  }

  public addListener(key: string, listener: IXyoMutableCharacteristicListener) {
    this.listenersMap.set(key, listener)
  }

  public removeListener(key: string) {
    this.listenersMap.delete(key)
  }
}
