import { IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, IXyoNetworkPipe } from '@xyo-network/network'
import { XyoClientBluetoothNetwork } from './xyo-client-ble-network'
import { XyoServerNetwork } from './xyo-server-ble-network'
import { XyoLogger } from '@xyo-network/logger';


export class XyoFullBleNetwork implements IXyoNetworkProvider {
    private logger = new XyoLogger(false, false)
    private server: XyoServerNetwork
    private client: XyoClientBluetoothNetwork
    private serverHandle: (enable: boolean) => void
    private clientHandle: (enable: boolean) => void

  constructor(client: XyoClientBluetoothNetwork,
              server: XyoServerNetwork,
              clientHandle: (enable: boolean) => void,
              serverHandle: (enable: boolean) => void,) {
  
    this.clientHandle = clientHandle
    this.serverHandle = serverHandle
    this.server = server
    this.client = client
  }

  public async find(catalogue: IXyoNetworkProcedureCatalogue): Promise <IXyoNetworkPipe> {
    var found = false

    while (!found) {
      this.serverHandle(true)
      const pipeFromServer = await this.server.findWithTimeout(30_000)

      if (pipeFromServer) {
        found = true
        return pipeFromServer
      }

      this.serverHandle(false)
      this.clientHandle(true)

      const pipeFromClient = await this.client.findWithTimeout(30_000)

      if (pipeFromClient) {
        found = true
        return pipeFromClient
      }

      this.clientHandle(false)
    }

    throw new Error("Invalid state")
  }

  public async stopServer(): Promise <void> {
    await this.client.stopServer()
    await this.server.stopServer()
  }
}   