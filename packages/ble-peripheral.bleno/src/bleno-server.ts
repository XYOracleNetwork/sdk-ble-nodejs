import bleno from 'bleno' 

export class BlenoServer {
    
    constructor() {
        
    }


    public test () {
        bleno.on('stateChange', (state) => {
            console.log(state)

            bleno.startAdvertising("carter")
        })
    }
}


const test = new BlenoServer()
test.test()