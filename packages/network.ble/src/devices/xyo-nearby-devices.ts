import { XyoPipeClient } from './xyo-pipe-client'
import { getIBeacon, IXyoBluetoothDevice } from "@xyo-network/ble-central"
import { XyoLogger } from '@xyo-network/logger'

export class XyoNearbyDevices {
  public logger: XyoLogger = new XyoLogger(false, false)

  public nearby (allDevices: IXyoBluetoothDevice[]): XyoPipeClient[] {
    const returnDevices: XyoPipeClient[] = []

    allDevices.forEach((device) => {
      if (this.isXyoCompatible(device)) {
        returnDevices.push(new XyoPipeClient(device))
      }
    })

    this.logger.info(`${returnDevices.length} + XYO devices in range`)

    return returnDevices
  }

  public isXyoCompatible (device: IXyoBluetoothDevice): boolean {
    const asIBeacon = getIBeacon(device.advertisement)

    if (asIBeacon == null) {
      return false
    }

    return asIBeacon.uuid.toLocaleLowerCase() === "d684352edf36484ebc982d5398c5593e".toLocaleLowerCase()
  }

}
