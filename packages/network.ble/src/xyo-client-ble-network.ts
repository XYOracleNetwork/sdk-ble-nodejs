import { IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, IXyoNetworkPipe } from '@xyo-network/network'
import { XyoNearbyDevices } from './devices/xyo-nearby-devices'
import { IXyoScan } from "@xyo-network/ble-central"
import { XyoPipeClient } from './devices/xyo-pipe-client'
import { XyoBase } from '@xyo-network/base';

export class XyoClientBluetoothNetwork implements IXyoNetworkProvider {
  private scanner: IXyoScan
  private tryingDevice = false
  private nearbyDevices: XyoPipeClient[] = []
  private scanInterval : NodeJS.Timeout | undefined
  private nearby = new XyoNearbyDevices()
  private onPipe : ((pipe: IXyoNetworkPipe) => void) | undefined
  private onClose : (() => void) | undefined

  constructor(scanner: IXyoScan) {
    this.scanner = scanner
  }

  private scanLambda = async () => {
    const nearbyNow = this.scanner.getDevices()
    this.nearbyDevices = this.nearby.nearby(nearbyNow)

    if (!this.tryingDevice && this.nearbyDevices.length > 0) {
      const randomDevice = this.nearbyDevices[Math.floor(Math.random() * this.nearbyDevices.length)]
      this.tryingDevice = true

      await this.scanner.stopScan()
      randomDevice.tryCreatePipe().then(async (createdPipe) => {
        if (this.scanInterval) {
          clearInterval(this.scanInterval)
        }

        if (createdPipe) {
          this.resolveCallback(createdPipe)
        } else {
          const callback = this.onClose
          if (callback) {
            callback()
            return
          }

          await this.scanner.startScan()
          this.tryingDevice = false
        }
      }).catch(async (e) => {
        const callback = this.onClose
        if (callback) {
          callback()
          return
        }

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
    this.onClose = undefined
    await this.scanner.stopScan()
  }

  private async waitForJobToFinish () {
    return new Promise((resolve, reject) => {
      this.onClose = () => {
        resolve()
      }
    })
  }

  public findWithTimeout (timeoutInMills: number) : Promise<IXyoNetworkPipe | undefined> {
    this.tryingDevice = false

    return new Promise((resolve, reject) => {
      this.scanner.startScan().then(() => {
        var hasResumed = false
        const onTimeout = async () => {
          if (!hasResumed) {
            if (this.tryingDevice) {
              await this.waitForJobToFinish()
            }

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
