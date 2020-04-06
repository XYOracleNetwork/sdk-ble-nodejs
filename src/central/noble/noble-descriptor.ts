import { IXyoDescriptor } from '../'
import noble from '@xyo-network/noble'
import { XyoBase } from '@xyo-network/sdk-base-nodejs'

export class NobleDescriptor extends XyoBase implements IXyoDescriptor {
  public descriptor: noble.Descriptor

  constructor(descriptor: noble.Descriptor) {
    super()
    this.descriptor = descriptor
  }

  get uuid(): string {
    return this.descriptor.uuid
  }

  get name(): string {
    return this.descriptor.name
  }

  get type(): string {
    return this.descriptor.type
  }

  public readValue(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.logInfo(
        `Trying to read value on descriptor with uuid: ${this.descriptor.uuid}`
      )

      this.descriptor.readValue((error, data) => {
        if (error == null) {
          this.logInfo(
            `Successfully read value of descriptor with uuid: ${this.descriptor.uuid}`
          )
          resolve(data)
        } else {
          this.logError(
            `Error reading value of descriptor with uuid: ${this.descriptor.uuid}`
          )
          reject(error)
        }
      })
    })
  }

  public writeValue(value: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logInfo(
        `Trying to write value to descriptor with uuid: ${this.descriptor.uuid}`
      )

      this.descriptor.writeValue(value, error => {
        if (error == null) {
          this.logInfo(
            `Successfully wrote value to descriptor with uuid: ${this.descriptor.uuid}`
          )
          resolve()
        } else {
          this.logError(
            `Error writing value to descriptor with uuid: ${this.descriptor.uuid}`
          )
          reject(error)
        }
      })
    })
  }
}
