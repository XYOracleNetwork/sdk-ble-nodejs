import {
  IXyoPlugin,
  IXyoPluginDelegate,
  XyoBase
} from '@xyo-network/sdk-base-nodejs'
import { BlenoServer } from './bleno-server'

class XyoBleBleno implements IXyoPlugin {
  public BLE_PERIPHERAL: any | undefined

  public getName(): string {
    return 'ble-bleno'
  }

  public getProvides(): string[] {
    return ['BLE_PERIPHERAL']
  }

  public getPluginDependencies(): string[] {
    return []
  }

  public async initialize(delegate: IXyoPluginDelegate): Promise<boolean> {
    const scanner = new BlenoServer()

    this.BLE_PERIPHERAL = scanner

    return true
  }
}

module.exports = new XyoBleBleno()
