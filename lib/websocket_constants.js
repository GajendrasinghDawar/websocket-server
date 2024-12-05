export let ALLOWED_ORIGINS = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:8080",
  "null", // for file://
]

export const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

export let WS_RULES = {
  MIN_FRAME_SIZE: 2,
  MASK_LENGTH: 4, 
  
  // WEBSOCKET PAYLOAD RELATED FIELDS
  SMALL_DATA_SIZE: 125,
  MEDIUM_DATA_SIZE: 65535,

  MEDIUM_DATA_FLAG: 126,
  LARGE_DATA_FLAG: 127,

  MEDIUM_SIZE_BYTE_CONSUMPTION: 2,
  LARGE_SIZE_BYTE_CONSUMPTION: 8,

   // *** WEBSOCKET OPCODES
   OPCODE_TEXT: 0x01, // text frame
   OPCODE_BINARY: 0x02, // binary frame
   OPCODE_CLOSE: 0x08, // closure frame
   OPCODE_PING: 0x09, // ping frame
   OPCODE_PONG: 0x0A, // pong frame
}
