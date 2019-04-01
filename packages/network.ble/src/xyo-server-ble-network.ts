import { IXyoMutableCharacteristic, IXyoMutableCharacteristicListener, IXyoPeripheral } from '@xyo-network/ble-peripheral'
import { IXyoNetworkPipe, IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, CatalogueItem, IXyoNetworkPeer } from '@xyo-network/network';
import { XyoCharacteristicHandle } from './xyo-characteristic-handle'

export class XyoServerNetwork implements IXyoNetworkProvider {
    private deviceRouter: { [key:string]:XyoCharacteristicHandle; } = {};
    private pipeCharacteristic: IXyoMutableCharacteristic
    private onNewPipe: ((pipe: IXyoNetworkPipe) => void) | undefined

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

            this.deviceRouter[deviceKey] = new XyoCharacteristicHandle(
                peer,
                firstSend, 
                this.pipeCharacteristic,
                this.closeHandler
            )
        }
    }

    constructor(pipeCharacteristic: IXyoMutableCharacteristic) {
        this.pipeCharacteristic = pipeCharacteristic
        pipeCharacteristic.addListener("server_xyo_main", this.serverEndpoint)
    }

    private closeHandler = (id: string) => {
        delete this.deviceRouter[id]
    }

    public find(catalogue: IXyoNetworkProcedureCatalogue): Promise <IXyoNetworkPipe> { 
        return new Promise((resolve, reject) => {
            this.onNewPipe = (pipe: IXyoNetworkPipe) => {
                this.onNewPipe = undefined
                resolve(pipe)
            }
        })
    }

    private phraseFirstSend (buffer: Buffer): Buffer {
        return buffer.slice(4, buffer.length)
    }

    public async stopServer(): Promise <void> {

        return
    }
}

