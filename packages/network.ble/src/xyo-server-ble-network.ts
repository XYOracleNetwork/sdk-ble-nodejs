import { IXyoMutableCharacteristic, IXyoMutableCharacteristicListener, IXyoPeripheral } from '@xyo-network/ble-peripheral'
import { IXyoNetworkPipe, IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, CatalogueItem, IXyoNetworkPeer } from '@xyo-network/network';
import { XyoCharacteristicHandle } from './xyo-characteristic-handle'

export class XyoServerNetwork implements IXyoNetworkProvider {
    private deviceRouter: { [key:string]:XyoCharacteristicHandle; } = {};
    private pipeCharacteristic: IXyoMutableCharacteristic

    private serverEndpoint: IXyoMutableCharacteristicListener = {
        onWrite: (value: Buffer, device: IXyoPeripheral)  => {
            const deviceKey = device.id
            const handler = this.deviceRouter[deviceKey]

            if (handler) {
                handler.onWrite(value)
                return
            }

            const peer: IXyoNetworkPeer = {
                getTemporaryPeerId: () => {
                    return Buffer.from(deviceKey)
                }
            }

            const firstSend = this.phraseFirstSend(value)

            this.deviceRouter[deviceKey] = new XyoCharacteristicHandle(peer, firstSend, this.pipeCharacteristic)
        }
    }

    constructor(pipeCharacteristic: IXyoMutableCharacteristic) {
        this.pipeCharacteristic = pipeCharacteristic

        pipeCharacteristic.addListener("server_xyo_main", this.serverEndpoint)
    }

    public find(catalogue: IXyoNetworkProcedureCatalogue): Promise <IXyoNetworkPipe> { 
        throw new Error("stub")
    }

    private phraseFirstSend (buffer: Buffer): Buffer {
        return buffer.slice(4, buffer.length)
    }

    public async stopServer(): Promise <void> {

        return
    }
}

