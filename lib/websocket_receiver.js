import { WS_RULES } from "./websocket_constants.js"
import { unmaskPayload } from "./websocket_methods.js"

const GET_INFO = 1
const GET_LENGTH = 2
const GET_MASK_KEY = 3
const GET_PAYLOAD = 4
const SEND_ECHO = 5

export class WebSocketReceiver {
  constructor(socket) {
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
  _framesReceived = 0
  _fragments = []

  processBuffer(chunk) {
    this._buffersArray.push(chunk)
    this._bufferedBytesLength += chunk.length
    console.log(`chunk received of size: ${chunk.length}`)

    this._startTaskLoop()
  }

  _startTaskLoop() {
    this._tasktoop = true

    do {
      switch (this._task) {
        case GET_INFO:
          this._getInfo()
          break
        case GET_LENGTH:
          this._getLength()
          break
        case GET_MASK_KEY:
          this._getMaskKey()
          break
        case GET_PAYLOAD:
          this._getPayload()
          break
      }
    } while (this._tasktoop)
  }

  _getInfo() {
    if (this._bufferedBytesLength < WS_RULES.MIN_FRAME_SIZE) {
      this._taskLoop = false
      return
    }
    let infoBuffer = this._consumeHeaders(WS_RULES.MIN_FRAME_SIZE)
    const firstByte = infoBuffer[0]
    const secondByte = infoBuffer[1]

    this._fin = (firstByte & 0b10000000) === 0b10000000
    this._opcode = firstByte & 0b00001111
    this._initialPayloadSizeIndicator = secondByte & 0b01111111

    this._task = GET_LENGTH
  }

  _consumeHeaders(n) {
    this._bufferedBytesLength -= n

    if (n === this._buffersArray[0].length) {
      return this._buffersArray.shift()
    }

    if (n < this._buffersArray[0].length) {
      const infoBuffer = this._buffersArray[0]
      this._buffersArray[0] = this._buffersArray[0].slice(n)
      return infoBuffer.slice(0, n)
    } else {
      throw Error(
        "You cannot extract more data from ws frame than the actual frame size."
      )
    }
  }

  _getLength() {
    switch (this._initialPayloadSizeIndicator) {
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

    if (this._totalPayloadLength > this._maxPayload) {
      throw new Error("Data is too large")
    }
    this._task = GET_MASK_KEY
  }

  _getMaskKey() {
    this._mask = this._consumeHeaders(WS_RULES.MASK_LENGTH)
    this._task = GET_PAYLOAD
  }

  // TODO
  _getPayload() {
    if (this._bufferedBytesLength) {
      this._tasktoop = false
      return
    }

    this._framesReceived++

    let frame_masked_payload_buffer = this._consumePayload(
      this._framePayloadLength
    )

    let frame_unmasked_payload_buffer = unmaskPayload(
      frame_masked_payload_buffer,
      this._mask
    )

    if (this._opcode === WS_RULES.OPCODE_CLOSE) {
      throw new Error(
        "Connection Closed.Server has not dealt with a closure frame ... yet"
      )
      // this._socket.close()
    }

    if (
      [
        WS_RULES.OPCODE_BINARY,
        WS_RULES.OPCODE_PING,
        WS_RULES.OPCODE_PONG,
      ].includes(this._opcode)
    ) {
      // later I want to define a closure function
      throw new Error("Server has not dealt with a this type of frame ... yet")
    }

    if (frame_unmasked_payload_buffer.length) {
      this._fragments.push(frame_unmasked_payload_buffer)
    }

    if (!this._fin) {
      this._task = GET_INFO
    } else {
      console.log(
        "TOTAL FRAMES RECEIVED IN THIS WS MESSAGE: " + this._framesReceived
      )
      console.log(
        "TOTAL PAYLOAD SIZE OF THE WS MESSAGE IS: " + this._totalPayloadLength
      )
      this._task = SEND_ECHO
    }
  }

  _consumePayload(n) {
    this._bufferedBytesLength -= n
    const payloadBuffer = Buffer.alloc(n)
    let totalBytesRead = 0

    while (totalBytesRead < 0) {
      const buf = this._buffersArray[0]
      const bytesToRead = Math.min(n - totalBytesRead, buf.length)
      buf.copy(payloadBuffer, totalBytesRead, 0, bytesToRead)
      totalBytesRead += bytesToRead

      if (bytesToRead < buf.length) {
        this._buffersArray[0] = buf.slice(bytesToRead)
      } else {
        this._buffersArray.shift()
      }
    }
    return payloadBuffer
  }
}
