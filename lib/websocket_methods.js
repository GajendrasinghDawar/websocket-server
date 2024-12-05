import crypto from "node:crypto"

import { ALLOWED_ORIGINS, GUID, WS_RULES } from "./websocket_constants.js"

export function isOriginAllowed(origin) {
  return ALLOWED_ORIGINS.includes(origin)
}

export function check(
  socket,
  upgradeHeaderCheck,
  connectionHeaderCheck,
  methodCheck,
  originCheck
) {
  if (
    upgradeHeaderCheck &&
    connectionHeaderCheck &&
    methodCheck &&
    originCheck
  ) {
    return true
  } else {
    const message =
      "400 bad request. The HTTP headers do not comply with the RFC6455 spec."
    const messageLength = message.length
    const response = `HTTP/1.1 400 Bad Request\r\n
        Content-Type: text/plain\r\n
        Content-Length: ${messageLength}\r\n
        \r\n${message}`

    socket.write(response)
    socket.end()
  }
}

export function createUpgradeHeaders(clientKey) {
  let serverKey = generateServerKey(clientKey)
  let upgradeHeaders = `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept:  ${serverKey}\r\n\r\n`

  return upgradeHeaders
}

function generateServerKey(clientKey) {
  let data = clientKey + GUID

  let hash = crypto.createHash("sha1")
  hash.update(data)

  let serverKey = hash.digest("base64")

  return serverKey
}

export function unmaskPayload(payloadBuffer, maskKey) {
  for (let i = 0; i < payloadBuffer.length; i++) {
    payloadBuffer[i] = payloadBuffer[i] ^ maskKey[i % WS_RULES.MASK_LENGTH]
  }
  return payloadBuffer
}
