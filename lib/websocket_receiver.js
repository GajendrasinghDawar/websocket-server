import { WS_RULES } from "./websocket_constants.js"

const GET_INFO = 1
const GET_LENGTH = 2
const GET_MASK_KEY = 3
const GET_PAYLOAD = 4
const SEND_ECHO = 5

export class WebSocketReceiver {
    constructor (socket) {
        this._socket = socket
    }

    _buffersArray = []
    _bufferedBytesLength = 0
    _tasktoop = false
    _task = GET_INFO
    _fin = false
    _opcode = null
    _masked = false
    _initialPayloadSizeIndicator = 0
    _framePayloadLength = 0
    _maxPayload = 1024 * 1024
    _totalPayloadLength = 0
    _mask = Buffer.alloc(WS_RULES.MASK_LENGTH)

    processBuffer(chunk) {
        this._buffersArray.push(chunk)
        this._bufferedBytesLength += chunk.length
        console.log(`chunk received of size: ${chunk.length}`)

        this._startTaskLoop()
    }

    _startTaskLoop() {
        this._tasktoop = true

        do
        {
            switch (this._task)
            {
                case GET_INFO:
                    this._getInfo()
                    break
                case GET_LENGTH:
                    this._getLength()
                    break
                case GET_MASK_KEY:
                    this._getMaskKey()
                    break
            }
        } while (this._tasktoop)
    }

    _getInfo() {
        let infoBuffer = this._consumeHeaders(WS_RULES.MIN_FRAME_SIZE)
        const firstByte = infoBuffer[ 0 ]
        const secondByte = infoBuffer[ 1 ]

        this._fin = (firstByte & 0b10000000) === 0b10000000
        this._opcode = firstByte & 0b00001111
        this._initialPayloadSizeIndicator = secondByte & 0b01111111

        this._task = GET_LENGTH
    }

    _consumeHeaders(n) {
        this._bufferedBytesLength -= n

        if (n === this._buffersArray[ 0 ].length)
        {
            return this._buffersArray.shift()
        }

        if (n < this._buffersArray[ 0 ].length)
        {
            const infoBuffer = this._buffersArray[ 0 ]
            this._buffersArray[ 0 ] = this._buffersArray[ 0 ].slice(n)
            return infoBuffer.slice(0, n)
        } else
        {
            throw Error(
                "You cannot extract more data from ws frame than the actual frame size."
            )
        }
    }

    _getLength() {
        switch (this._initialPayloadSizeIndicator)
        {
            case WS_RULES.MEDIUM_DATA_FLAG:
                let mediumPayloadLengthBuffer = this._consumeHeaders(
                    WS_RULES.MEDIUM_SIZE_BYTE_CONSUMPTION
                )
                this._framePayloadLength = mediumPayloadLengthBuffer.readUInt16BE()
                this._processLength()
                break
            case WS_RULES.LARGE_DATA_FLAG:
                let largePayloadLengthBuffer = this._consumeHeaders(
                    WS_RULES.LARGE_SIZE_BYTE_CONSUMPTION
                )
                let bufBigInt = largePayloadLengthBuffer.readBigUInt64BE()
                this._framePayloadLength = Number(bufBigInt)

                this._processLength()
                break
            default:
                this._framePayloadLength = this._initialPayloadSizeIndicator
                this._processLength
        }
    }

    _processLength() {
        this._totalPayloadLength += this._framePayloadLength

        if (this._totalPayloadLength > this._maxPayload)
        {
            throw new Error('Data is too large')
        }
        this._task = GET_MASK_KEY
    }

    _getMaskKey(){
        this._mask = this._consumeHeaders(WS_RULES.MASK_LENGTH)
        this._task = GET_PAYLOAD
    }
}
