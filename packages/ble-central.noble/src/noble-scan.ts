import { XyoLogger } from "@xyo-network/logger"
import { IXyoBluetoothDevice, IXyoScan } from "@xyo-network/ble-central"
// import noble from '@s524797336/noble-mac'
import noble, { Noble } from '@xyo-network/noble'
import { NobleDevice } from "./noble-device"

export class NobleScan implements IXyoScan {
  private logger = new XyoLogger(false, false)
  private inRangeDevices: {[key: string]: IXyoBluetoothDevice; } = {}
  public nobleInstance: Noble

  constructor (nobleInstance: Noble) {
    this.nobleInstance = nobleInstance
    this.reset()
    setInterval(this.cleanDevices, 1000)
  }

  public reset () {
    this.nobleInstance.on("stateChange", this.stateChange)
    this.nobleInstance.on("discover", this.discover)
  }

  public startScan (): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.nobleInstance.state === "poweredOn") {

        const callback = () => {
          this.logger.info("Scanner stared successfully")
          this.nobleInstance.removeListener('scanStart', callback)
          resolve()
        }

        this.nobleInstance.on('scanStart', callback)

        this.logger.info("Trying to start scanner")

        this.nobleInstance.startScanning([], true)
        return
      }

      this.logger.error("Noble is not powered on")
      reject()
    })
  }

  public stopScan (): Promise<void> {
    return new Promise((resolve) => {
      this.logger.info("Stopping noble scanner")
      this.nobleInstance.stopScanning()
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
