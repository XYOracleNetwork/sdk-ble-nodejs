import bleno, { Bleno } from '@xyo-network/bleno' 
import { IXyoBluetoothPeripheral, IXyoBluetoothPeripheralListener } from '@xyo-network/ble-peripheral'
import { XyoLogger } from '@xyo-network/logger'
import { XyoBase } from '@xyo-network/base';

export class BlenoServer implements IXyoBluetoothPeripheral {
    private listeners = new Map<string, IXyoBluetoothPeripheralListener>()
    private logger = new XyoLogger(false, false)
    public blenoInstance : Bleno

    constructor (instance: Bleno) {
        this.blenoInstance = instance
        this.reset()
    }

    public reset () {
        this.blenoInstance.on('accept', this.onConnect)
        this.blenoInstance.on('disconnect', this.onDisconnect)
    }

    public addListener(key: string, listener: IXyoBluetoothPeripheralListener) {
        this.listeners.set(key, listener)
    }

    public removeListener(key: string) {
        this.listeners.delete(key)
    }

    public startAdvertising (adv: Buffer, scanResponse: Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            let hasResumed = false
            this.logger.info(`Trying to start advertising, adv: ${adv.toString('hex')}, scanResponse: ${scanResponse.toString('hex')}`)

            XyoBase.timeout(() => {
                if (!hasResumed) {
                    hasResumed = true
                    resolve()
                }
            }, 15_000)

            if (this.blenoInstance.state == "poweredOn") {
                this.blenoInstance.startAdvertisingWithEIRData(adv, scanResponse, (error) => {
                    if (error) {
                        this.logger.info(`Error trying to startAdvertising ${error}`)
                        reject(error)
                    } else {
                        if (!hasResumed) {
                            hasResumed = true
                            resolve()
                        }
                    }
                })
            } else {
                reject(`Invalid state: ${this.blenoInstance.state}`)
            }
        })
    }

    public async disconnect () {
        this.blenoInstance.disconnect()
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

    public stopAdvertising (): Promise<void> {
        return new Promise((resolve, reject) => { 
            let hasResumed = false
            this.logger.info("Trying to stop advertiser")

            XyoBase.timeout(() => {
                if (!hasResumed) {
                    hasResumed = true
                    resolve()
                }
            }, 15_000)

            this.blenoInstance.stopAdvertising(() => {
                this.logger.info("Stopped advertiser")

                if (!hasResumed) {
                    hasResumed = true
                    resolve()
                }
            })
        })
    }
}
