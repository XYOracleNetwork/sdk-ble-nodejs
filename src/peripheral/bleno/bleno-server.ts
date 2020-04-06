import bleno from '@xyo-network/bleno'
import { IXyoBluetoothPeripheral, IXyoBluetoothPeripheralListener } from '../'
import { XyoBase } from '@xyo-network/sdk-base-nodejs'

export class BlenoServer extends XyoBase implements IXyoBluetoothPeripheral {
  private listeners = new Map<string, IXyoBluetoothPeripheralListener>()

  constructor() {
    super()
    bleno.on('accept', this.onConnect)
    bleno.on('disconnect', this.onDisconnect)
  }

  public addListener(key: string, listener: IXyoBluetoothPeripheralListener) {
    this.listeners.set(key, listener)
  }

  public removeListener(key: string) {
    this.listeners.delete(key)
  }

  public startAdvertising(adv: Buffer, scanResponse: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      let hasResumed = false
      this.logInfo(
        `Trying to start advertising, adv: ${adv.toString(
          'hex'
        )}, scanResponse: ${scanResponse.toString('hex')}`
      )

      setTimeout(() => {
        if (!hasResumed) {
          hasResumed = true
          resolve()
        }
      }, 15_000)

      if (bleno.state == 'poweredOn') {
        bleno.startAdvertisingWithEIRData(adv, scanResponse, error => {
          if (error) {
            this.logInfo(`Error trying to startAdvertising ${error}`)
            reject(error)
          } else {
            if (!hasResumed) {
              hasResumed = true
              resolve()
            }
          }
        })
      } else {
        reject(`Invalid state: ${bleno.state}`)
      }
    })
  }

  public async disconnect() {
    bleno.disconnect()
  }

  onConnect = () => {
    for (const [_, value] of this.listeners) {
      const callback = value.onConnect

      if (callback) {
        callback()
      }
    }
  }

  onDisconnect = () => {
    for (const [_, value] of this.listeners) {
      const callback = value.onDisconnect

      if (callback) {
        callback()
      }
    }
  }

  public stopAdvertising(): Promise<void> {
    return new Promise((resolve, reject) => {
      let hasResumed = false
      this.logInfo('Trying to stop advertiser')

      setTimeout(() => {
        if (!hasResumed) {
          hasResumed = true
          resolve()
        }
      }, 15_000)

      bleno.stopAdvertising(() => {
        this.logInfo('Stopped advertiser')

        if (!hasResumed) {
          hasResumed = true
          resolve()
        }
      })
    })
  }
}
