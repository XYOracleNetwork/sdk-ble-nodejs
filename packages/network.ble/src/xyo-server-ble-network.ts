import { IXyoMutableCharacteristic, IXyoMutableCharacteristicListener, IXyoPeripheral, IXyoBluetoothPeripheral } from '@xyo-network/ble-peripheral'
import { IXyoNetworkPipe, IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, CatalogueItem, IXyoNetworkPeer } from '@xyo-network/network';
import { XyoCharacteristicHandle } from './xyo-characteristic-handle'
import { XyoAdvertisement } from './data/xyo-advertisement';

export class XyoServerNetwork implements IXyoNetworkProvider {
    private advData = new XyoAdvertisement(0, 0)
    private server: IXyoBluetoothPeripheral
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

    constructor(pipeCharacteristic: IXyoMutableCharacteristic, server: IXyoBluetoothPeripheral) {
        this.pipeCharacteristic = pipeCharacteristic
        this.server = server
        pipeCharacteristic.addListener("server_xyo_main", this.serverEndpoint)
    }

    private closeHandler = (id: string) => {
        delete this.deviceRouter[id]
    }

    public async find(catalogue: IXyoNetworkProcedureCatalogue): Promise <IXyoNetworkPipe> { 
        await this.server.startAdvertising(this.advData.advertisementData(), this.advData.getScanResponse())

        const result = await new Promise((resolve, reject) => {
            this.onNewPipe = (pipe: IXyoNetworkPipe) => {
                this.onNewPipe = undefined
                resolve(pipe)
            }
        }) as IXyoNetworkPipe

        await this.server.stopAdvertising()
        return result
    }

    private phraseFirstSend (buffer: Buffer): Buffer {
        return buffer.slice(4, buffer.length)
    }

    public async stopServer(): Promise <void> {
        await this.server.stopAdvertising()
    }
}

