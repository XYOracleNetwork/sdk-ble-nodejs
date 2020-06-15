
export class XyoAdvertisement {

    private advertisementId = 0x03

    private getMajor () : number {
        const randomBase =  Math.floor(Math.random() * 65534)
        const randomBaseWithMask = randomBase & 0b1111_1111_1100_00000
        return randomBaseWithMask | this.advertisementId
    }

    public major: number
    public minor: number

    constructor(minor: number) {
        this.major = this.getMajor()
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
        majorBuff.writeUInt16BE(this.major, 0)
        const minorBuff = Buffer.alloc(2)
        minorBuff.writeUInt16BE(this.minor, 0)

        const majorBuffString = majorBuff.toString("hex")
        const minorBuffString = minorBuff.toString("hex")

        uuid = uuid + majorBuffString[2] + majorBuffString[3] + majorBuffString[0] + majorBuffString[1]
        uuid = uuid + minorBuffString[2] + minorBuffString[3] + minorBuffString[0] + minorBuffString[1]

        return Buffer.from(
            uuid.toUpperCase(),
            "hex"
        ) 
    }
}


