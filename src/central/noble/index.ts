import { IXyoPlugin, IXyoPluginDelegate } from '@xyo-network/sdk-base-nodejs'
import { NobleScan } from './noble-scan'

export class XyoBleNoble implements IXyoPlugin {
  public BLE_CENTRAL: any | undefined

  public getName(): string {
    return 'ble-noble'
  }

  public getProvides(): string[] {
    return ['BLE_CENTRAL']
  }

  public getPluginDependencies(): string[] {
    return []
  }

  public async initialize(delegate: IXyoPluginDelegate): Promise<boolean> {
    const scanner = new NobleScan()

    this.BLE_CENTRAL = scanner

    return true
  }
}
