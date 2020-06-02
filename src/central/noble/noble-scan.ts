import { IXyoBluetoothDevice, IXyoScan } from '../'
// import noble from '@s524797336/noble-mac'
import noble from '@s524797336/noble-mac'
import { NobleDevice } from './noble-device'
import { XyoBase } from '@xyo-network/sdk-base-nodejs'

export class NobleScan extends XyoBase implements IXyoScan {
  private inRangeDevices: { [key: string]: IXyoBluetoothDevice } = {}

  constructor() {
    super()
    noble.on('stateChange', this.stateChange)
    noble.on('discover', this.discover)
    setInterval(this.cleanDevices, 1000)
  }

  public startScan(): Promise<void> {
    console.log('1')

    return new Promise((resolve, reject) => {
      console.log('2')
      if (noble.state === 'poweredOn') {
        const callback = () => {
          this.logInfo('Scanner stared successfully')
          noble.removeListener('scanStart', callback)
          resolve()
        }

        noble.on('scanStart', callback)

        this.logInfo('Trying to start scanner')

        noble.startScanning([], true)
        return
      }
      this.logError('Noble is not powered on')
      reject()
    })
  }

  public stopScan(): Promise<void> {
    return new Promise(resolve => {
      this.logInfo('Stopping noble scanner')
      noble.stopScanning()
      resolve()
    })
  }

  public getDevices(): IXyoBluetoothDevice[] {
    const returnArray: IXyoBluetoothDevice[] = []

    for (const [key, value] of Object.entries(this.inRangeDevices)) {
      returnArray.push(value)
    }

    return returnArray
  }

  private cleanDevices = () => {
    for (const id in this.inRangeDevices) {
      if (Date.now() - this.inRangeDevices[id].lastSeen > 5000) {
        delete this.inRangeDevices[id]
      }
    }
  }

  private stateChange = (state: string) => {
    this.logInfo(`Noble state change: ${state}`)
  }

  private discover = (peripheral: noble.Peripheral) => {
    const entered = !this.inRangeDevices[peripheral.id]

    if (entered) {
      this.inRangeDevices[peripheral.id] = new NobleDevice(peripheral)
    }

    this.inRangeDevices[peripheral.id].lastSeen = Date.now()
  }
}
