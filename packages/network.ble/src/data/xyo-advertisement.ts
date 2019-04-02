
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

        secondBuffer.writeInt16BE(this.major, 0)
        secondBuffer.writeInt16BE(this.minor, 2)

        // todo get rssi at 1m instead of fixed -50 
        secondBuffer.writeInt8(-50, 5)

        return Buffer.concat([firstBuffer, secondBuffer])
    }


    public getScanResponse (): Buffer {

        // todo shave off major and minor
        return Buffer.from(
            "11073E59C598532D98BC4E4836DF2E3584D6",
            "hex"
        ) 
    }
}


