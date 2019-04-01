import bleno from 'bleno' 
import { IXyoBluetoothPeripheral } from '@xyo-network/ble-peripheral'
import { XyoLogger } from '@xyo-network/logger'

export class BlenoServer implements IXyoBluetoothPeripheral {
    private logger = new XyoLogger(false, false)

    public startAdvertising (adv: Buffer, scanResponse: Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            this.logger.info(`Trying to start advertising, adv: ${adv.toString('hex')}, scanResponse: ${scanResponse.toString('hex')}`)

            if (bleno.state == "poweredOn") {
                bleno.startAdvertisingWithEIRData(adv, scanResponse, (error) => {
                    if (error) {
                        this.logger.info(`Error trying to startAdvertising ${error}`)
                        reject(error)
                    } else {
                        resolve()
                    }
                })
            } else {
                reject(`Invalid state: ${bleno.state}`)
            }
        })
        
    }

    public stopAdvertising (): Promise<void> {
        return new Promise((resolve, reject) => { 
            this.logger.info("Trying to stop advertiser")

            bleno.stopAdvertising(() => {
                this.logger.info("Stopped advertiser")
                resolve()
            })
        })
    }
}


const test = new BlenoServer()
