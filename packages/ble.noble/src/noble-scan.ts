import { XyoLogger } from "@xyo-network/logger"
import { IXyoBluetoothDevice, IXyoScan } from '@xyo-network/ble'
// import noble from '@s524797336/noble-mac'
import noble from 'noble'
import { NobleDevice } from "./noble-device"

export class NobleScan implements IXyoScan {
  private logger = new XyoLogger(false, false)
  private inRangeDevices: {[key: string]: IXyoBluetoothDevice; } = {}

  constructor () {
    noble.on("stateChange", this.stateChange)
    noble.on("discover", this.discover)
    setInterval(this.cleanDevices, 1000)
  }

  public startScan (): Promise<void> {
    return new Promise((resolve, reject) => {
      if (noble.state === "poweredOn") {

        const callback = () => {
          this.logger.info("Scanner stared successfully")
          noble.removeListener('scanStart', callback)
          resolve()
        }

        noble.on('scanStart', callback)

        this.logger.info("Trying to start scanner")

        noble.startScanning([], true)
        return
      }

      this.logger.error("Noble is not powered on")
      reject()
    })
  }

  public stopScan (): Promise<void> {
    return new Promise((resolve) => {
      this.logger.info("Stopping noble scanner")
      noble.stopScanning()
      resolve()
    })
  }

  public getDevices (): IXyoBluetoothDevice[] {
    const returnArray: IXyoBluetoothDevice[] = []

    for (const [key, value] of Object.entries(this.inRangeDevices)) {
      returnArray.push(value)
    }

    return returnArray
  }

  private cleanDevices = () => {
    for (const id in this.inRangeDevices) {
      if (Date.now() - (this.inRangeDevices[id].lastSeen) > 5000) {
        delete this.inRangeDevices[id]
      }
    }
  }

  private stateChange = (state: string) => {
    this.logger.info(`Noble state change: ${state}`)
  }

  private discover = (peripheral: noble.Peripheral) => {
    const entered = !this.inRangeDevices[peripheral.id]

    if (entered) {
      this.inRangeDevices[peripheral.id] = new NobleDevice(peripheral)
    }

    this.inRangeDevices[peripheral.id].lastSeen = Date.now()
  }

}
