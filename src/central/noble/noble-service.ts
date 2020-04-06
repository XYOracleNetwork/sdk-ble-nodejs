import noble from '@xyo-network/noble'
import { IXyoService, IXyoCharacteristic } from '../'
import { NobleCharacteristic } from './noble-characteristic'
import { XyoBase } from '@xyo-network/sdk-base-nodejs'

export class NobleService extends XyoBase implements IXyoService {
  public service: noble.Service

  get uuid(): string {
    return this.service.uuid
  }

  get name(): string {
    return this.service.name
  }

  get type(): string {
    return this.service.type
  }

  get characteristics(): IXyoCharacteristic[] {
    const returnArray: IXyoCharacteristic[] = []

    this.service.characteristics.forEach(characteristic => {
      returnArray.push(new NobleCharacteristic(characteristic))
    })

    return returnArray
  }

  constructor(service: noble.Service) {
    super()
    this.service = service
  }

  public discoverCharacteristics(): Promise<IXyoCharacteristic[]> {
    return new Promise((resolve, reject) => {
      this.logInfo(
        `Trying to discover characteristics for service with uuid: ${this.service.uuid}`
      )

      this.service.discoverCharacteristics([], (error, characteristics) => {
        if (error == null) {
          this.logInfo(
            `Successfully discovered characteristics for service with uuid: ${this.service.uuid}`
          )

          const returnArray: IXyoCharacteristic[] = []

          characteristics.forEach(characteristic => {
            returnArray.push(new NobleCharacteristic(characteristic))
          })

          resolve(returnArray)
        } else {
          this.logError(
            `Error discovering characteristics for service with uuid: ${this.service.uuid}`
          )
          reject(error)
        }
      })
    })
  }
}
