import { XyoMutablePermissions, IXyoMutableCharacteristic, IXyoMutableCharacteristicListener, IXyoPeripheral } from '@xyo-network/ble-peripheral'
import { IXyoNetworkPipe, IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, CatalogueItem, IXyoNetworkPeer } from '@xyo-network/network';
import { IXyoSerializableObject } from '@xyo-network/serialization';
import { XyoInputStream } from './data/xyo-input-stream';
import { chunkBytes } from './data/xyo-output-stream'
import { XyoLogger } from '@xyo-network/logger';
import { XyoBase } from '@xyo-network/base';

export class XyoCharacteristicHandle implements IXyoNetworkPipe {
    private logger: XyoLogger = new XyoLogger(false, false)
    private characteristic: IXyoMutableCharacteristic
    private packetCompleteCallback: ((packet: Buffer) => void) | undefined
    private inputStream: XyoInputStream = new XyoInputStream()
    private onClose: (id: string) => void

    peer: IXyoNetworkPeer
    initiationData: Buffer | undefined
    networkHeuristics: IXyoSerializableObject[]

    constructor (
        peer: IXyoNetworkPeer, 
        initiationData: Buffer,
        characteristic: IXyoMutableCharacteristic,
        onClose: (id: string) => void ) {

        this.onClose = onClose
        this.networkHeuristics = []
        this.peer = peer
        this.initiationData = initiationData
        this.characteristic = characteristic
    }

    public onWrite (value: Buffer) {
        this.logger.info(`Handler received write: ${value.toString("hex")}`)

        this.inputStream.addChunk(value)

        const newPacket = this.inputStream.getOldestPacket()
        const callback = this.packetCompleteCallback

        if (newPacket && callback) {
            callback(newPacket)
        }
    }

    private delay (mills: number): Promise<void> {
        return new Promise((resolve, reject) => {
          const onDone = () => {
            resolve()
          }
    
          XyoBase.timeout(onDone, mills)
        })
      }

    private async chunkSend (data: Buffer) {
        this.logger.info(`Chunk send for server, entire: ${data.toString("hex")}`)
        // todo add timeout

        const sizeBuffer = Buffer.alloc(4)
        sizeBuffer.writeUInt32BE(data.length + 4, 0)
        const sizeEncodedBuffer = Buffer.concat([sizeBuffer, data])

        // todo get MTU for chunking instead of fixed 20 bytes
        const chunksToSend = chunkBytes(sizeEncodedBuffer, 20) 

        for (const chunk of chunksToSend) {
            this.logger.info(`Sending chunk: ${chunk.toString("hex")}`)
            this.characteristic.value = chunk
            await this.delay(200)
            await this.characteristic.notifyChanged()
        }
    }

    private async waitForWrite () : Promise<Buffer | undefined> {
        // todo add timeout
        this.logger.info(`Waiting for write`)
    
        return new Promise((resolve, reject) => {
            let hasResumed = false

            const onTimeout = () => {
                if (!hasResumed) {
                    hasResumed = true
                    this.packetCompleteCallback = undefined
                    resolve(undefined)
                }
            }

            XyoBase.timeout(onTimeout, 30_000)

            this.packetCompleteCallback = (value: Buffer) => {
                if (!hasResumed) {
                    this.logger.info(`PacketCompleteCallback resolved`)
                    hasResumed = true
                    this.packetCompleteCallback = undefined
                    resolve(value)
                }
            }
        })
    }

    onPeerDisconnect(callback: (hasError: boolean) => void): () => void {
        return () => {}
    }

    async send (data: Buffer, awaitResponse?: boolean): Promise<Buffer | undefined> {
        this.logger.info(`Will chunk send`)
        await this.chunkSend(data)
        this.logger.info(`Done chunk send`)

        if (awaitResponse != false) {
            this.logger.info(`Will receive`)
            return this.waitForWrite()
        }

        return undefined
    }

    async close(): Promise<void> {
        const callback = this.onClose

        if (callback) {
            // todo, find a wait to get await notifaction so we do not have this delay
            await this.delay(500)
            // todo get id of device
            callback("0")
        }
    }
}
