import { IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, IXyoNetworkPipe } from '@xyo-network/network'
import { XyoNearbyDevices } from './devices/xyo-nearby-devices'
import { IXyoScan } from "@xyo-network/ble-central"
import { XyoPipeClient } from './devices/xyo-pipe-client'
import { XyoBase } from '@xyo-network/base';
import { resolve } from 'dns';

export class XyoClientBluetoothNetwork implements IXyoNetworkProvider {
  private scanner: IXyoScan
  private tryingDevice = false
  private nearbyDevices: XyoPipeClient[] = []
  private scanInterval : NodeJS.Timeout | undefined
  private nearby = new XyoNearbyDevices()
  private onPipe : ((pipe: IXyoNetworkPipe) => void) | undefined

  constructor(scanner: IXyoScan) {
    this.scanner = scanner
  }

  private scanLambda = () => {
    const nearbyNow = this.scanner.getDevices()
    this.nearbyDevices = this.nearby.nearby(nearbyNow)

    if (!this.tryingDevice && this.nearbyDevices.length > 0) {
      const randomDevice = this.nearbyDevices[Math.floor(Math.random() * this.nearbyDevices.length)]
      this.tryingDevice = true

      randomDevice.tryCreatePipe().then(async (createdPipe) => {
        if (this.scanInterval) {
          clearInterval(this.scanInterval)
        }

        if (createdPipe) {
          await this.scanner.stopScan()
          this.resolveCallback(createdPipe)
        } else {
          this.tryingDevice = false
        }
      }).catch(async (e) => {
        await this.scanner.startScan()
        this.tryingDevice = false
      })
    }
  }

  private resolveCallback (pipe: IXyoNetworkPipe) {
    const callback = this.onPipe

    if (callback) {
      callback(pipe)
    }
  }

  private async shutDown () {
    const interval = this.scanInterval

    if (interval) {
      clearInterval(interval)
      this.scanInterval = undefined
    }

    this.onPipe = undefined
    await this.scanner.stopScan()
  }

  public findWithTimeout (timeoutInMills: number) : Promise<IXyoNetworkPipe | undefined> {
    this.tryingDevice = false

    return new Promise((resolve, reject) => {
      this.scanner.startScan().then(() => {
        var hasResumed = false
        const onTimeout = async () => {
          if (!hasResumed) {
            await this.shutDown()
            resolve(undefined)
          }
        }

        XyoBase.timeout(onTimeout, timeoutInMills)

        this.onPipe = async (pipe: IXyoNetworkPipe) => {
          hasResumed = true
          await this.shutDown()
          resolve(pipe)
        }

        this.scanInterval = setInterval(this.scanLambda, 1000)
      }).catch(() => {
        resolve()
      })
    })
  }

  public find(catalogue: IXyoNetworkProcedureCatalogue): Promise <IXyoNetworkPipe> {
    this.tryingDevice = false
    
    return new Promise(async (resolve, reject) => {
      await this.scanner.startScan()

      this.onPipe = (pipe: IXyoNetworkPipe) => {
        this.shutDown()
        resolve(pipe)
      }

      this.scanInterval = setInterval(this.scanLambda, 1000)
    })
  }

  public stopServer(): Promise <void> {
    return this.scanner.stopScan()
  }

}
