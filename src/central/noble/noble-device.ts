import { IXyoBluetoothDevice, IXyoAdvertisement, IXyoService } from '../'
import { NobleAdvertisement } from './noble-advertisement'
import { NobleService } from './noble-service'
// import noble from '@s524797336/noble-mac'
import noble from '@s524797336/noble-mac'
import { XyoBase } from '@xyo-network/sdk-base-nodejs'

export class NobleDevice extends XyoBase implements IXyoBluetoothDevice {
  public device: noble.Peripheral
  public lastSeen: number = Date.now()

  public get id(): string {
    return this.device.id
  }

  public get uuid(): string {
    return this.device.uuid
  }

  public get connectable(): boolean {
    return this.device.connectable
  }

  public get advertisement(): IXyoAdvertisement {
    return new NobleAdvertisement(this.device.advertisement)
  }

  public get rssi(): number {
    return this.device.rssi
  }

  public get services(): IXyoService[] {
    const returnArray: IXyoService[] = []

    this.device.services.forEach(service => {
      returnArray.push(new NobleService(service))
    })

    return returnArray
  }

  public get state():
    | 'error'
    | 'connecting'
    | 'connected'
    | 'disconnecting'
    | 'disconnected' {
    return this.device.state
  }

  constructor(device: noble.Peripheral) {
    super()
    this.device = device
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logInfo(`Trying to connect to device with id: ${this.device.id}`)

      const timeout = setTimeout(() => {
        reject('Timeout connecting')
      }, 10000)

      this.device.connect(error => {
        if (error == null) {
          clearTimeout(timeout)
          this.logInfo(`Connected to device with id: ${this.device.id}`)
          resolve()
        } else {
          clearTimeout(timeout)
          this.logError(`Error connecting to device with id: ${this.device.id}`)
          reject(error)
        }
      })
    })
  }

  public disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logInfo(`Trying to disconnect to device with id: ${this.device.id}`)

      this.device.disconnect(() => {
        this.logInfo(`Disconnected from device with id: ${this.device.id}`)
        resolve()
      })
    })
  }

  public updateRssi(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.logInfo(`Trying to update device RSSI with id: ${this.device.id}`)

      this.device.updateRssi((error, rssi) => {
        if (error == null) {
          this.logInfo(`Updated RSSI for device with id: ${this.device.id}`)
          resolve(rssi)
        } else {
          this.logInfo(
            `Error updating RSSI for device with id: ${this.device.id}`
          )
          reject(error)
        }
      })
    })
  }

  public discoverServicesForUuids(
    serviceUUIDs: string[]
  ): Promise<IXyoService[]> {
    return new Promise((resolve, reject) => {
      this.logInfo(
        `Trying to discover services for device with id: ${this.device.id}`
      )

      this.device.discoverServices(serviceUUIDs, (error, services) => {
        if (error == null) {
          this.logInfo(
            `Successfully discovered services for device with id: ${this.device.id}`
          )
          const returnArray: IXyoService[] = []

          services.forEach(service => {
            returnArray.push(new NobleService(service))
          })

          resolve(returnArray)
        } else {
          this.logError(
            `Error discovering services for device with id: ${this.device.id}`
          )
          reject(error)
        }
      })
    })
  }

  public discoverServices(): Promise<IXyoService[]> {
    return this.discoverServicesForUuids([])
  }
}
