import { IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, IXyoNetworkPipe } from '@xyo-network/network'
import { XyoClientBluetoothNetwork } from './xyo-client-ble-network'
import { XyoServerNetwork } from './xyo-server-ble-network'
import { XyoLogger } from '@xyo-network/logger';


export class XyoFullBleNetwork implements IXyoNetworkProvider {
    private logger = new XyoLogger(false, false)
    private server: XyoServerNetwork
    private client: XyoClientBluetoothNetwork

  constructor(client: XyoClientBluetoothNetwork, server: XyoServerNetwork) {
    this.server = server
    this.client = client
  }

  public async find(catalogue: IXyoNetworkProcedureCatalogue): Promise <IXyoNetworkPipe> {
      const serverJob = this.server.find(catalogue)
      const clientJob = this.server.find(catalogue)

      const result = await Promise.race([serverJob, clientJob])

      this.stopServer().catch(() => {
        this.logger.warn("Unknown error trying to stop client and server [ble]")
      })

      return result
  }

  public async stopServer(): Promise <void> {
    await this.client.stopServer()
    await this.server.stopServer()
  }
}   