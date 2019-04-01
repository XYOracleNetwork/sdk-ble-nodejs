import { XyoMutablePermissions, IXyoMutableCharacteristic, IXyoMutableCharacteristicListener, IXyoPeripheral } from '@xyo-network/ble-peripheral'
import { IXyoNetworkPipe, IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, CatalogueItem, IXyoNetworkPeer } from '@xyo-network/network';
import { IXyoSerializableObject } from '@xyo-network/serialization';
import { XyoInputStream } from './data/xyo-input-stream';
import { chunkBytes } from './data/xyo-output-stream'

export class XyoCharacteristicHandle implements IXyoNetworkPipe {
    private characteristic: IXyoMutableCharacteristic
    private packetCompleteCallback: ((packet: Buffer) => void) | undefined
    private inputStream: XyoInputStream = new XyoInputStream()
    private onClose: (id: string) => void

    peer: IXyoNetworkPeer
    otherCatalogue: CatalogueItem[] | undefined
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
        this.inputStream.addChunk(value)

        const newPacket = this.inputStream.getOldestPacket()
        const callback = this.packetCompleteCallback

        if (newPacket && callback) {
            callback(newPacket)
        }
    }

    private async chunkSend (data: Buffer) {
        // todo add timeout

        const sizeBuffer = Buffer.alloc(4)
        sizeBuffer.writeUInt32BE(data.length + 4, 0)
        const sizeEncodedBuffer = Buffer.concat([sizeBuffer, data])

        // todo get MTU for chunking instead of fixed 20 bytes
        const chunksToSend = chunkBytes(sizeEncodedBuffer, 20) 

        for (const chunk of chunksToSend) {
            this.characteristic.value = chunk
            await this.characteristic.notifyChanged()
        }
    }

    private async waitForWrite () : Promise<Buffer | undefined> {
        // todo add timeout
    
        return new Promise((resolve, reject) => {
            this.packetCompleteCallback = (value: Buffer) => {
                this.packetCompleteCallback = undefined
                resolve(value)
            }
        })
    }

    onPeerDisconnect(callback: (hasError: boolean) => void): () => void {
        return () => {}
    }

    async send (data: Buffer, awaitResponse?: boolean): Promise<Buffer | undefined> {
        await this.chunkSend(data)

        if (awaitResponse != false) {
            return this.waitForWrite()
        }

        return
    }

    async close(): Promise<void> {
        this.close()
    }
}
