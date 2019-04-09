
export class XyoAdvertisement {
    public major: number
    public minor: number

    constructor(major: number, minor: number) {
        this.major = major
        this.minor = minor
    }

    public advertisementData(): Buffer {
        const firstBuffer = Buffer.from("02011A1AFF4C000215D684352EDF36484EBC982D5398C5593E", "hex")
        const secondBuffer = Buffer.alloc(5)

        secondBuffer.writeUInt16BE(this.major, 0)
        secondBuffer.writeUInt16BE(this.minor, 2)

        // todo get rssi at 1m instead of fixed -50 
        secondBuffer.writeInt8(-50, 4)


        return Buffer.concat([firstBuffer, secondBuffer])
    }

    

    // "11073E59C598532D98BC4E4836DF 2E 35 84 D6"
    public getScanResponse (): Buffer {
        let uuid = "11073E59C598532D98BC4E4836DF"
        const majorBuff = Buffer.alloc(2)
        majorBuff.writeInt16BE(this.major, 0)
        const minorBuff = Buffer.alloc(2)
        majorBuff.writeInt16BE(this.major, 0)

        uuid = uuid + majorBuff.toString("hex")[1] + majorBuff.toString("hex")[0]
        uuid = uuid + minorBuff.toString("hex")[1] + minorBuff.toString("hex")[0]

        return Buffer.from(
            uuid.toUpperCase(),
            "hex"
        ) 
    }
}


