import {
  check,
  createUpgradeHeaders,
  isOriginAllowed,
} from "./websocket_methods.js"
import { WebSocketReceiver } from "./websocket_receiver.js"

export function onUpgradeHandler(req, socket, head) {
  const upgradeHeaderCheck =
    req.headers[ "upgrade" ].toLowerCase() === "websocket"
  const connectionHeaderCheck =
    req.headers[ "connection" ].toLowerCase() === "upgrade"
  const methodCheck = req.method === "GET"
  const origin = req.headers[ "origin" ]
  const originCheck = isOriginAllowed(origin)

  if (
    check(
      socket,
      upgradeHeaderCheck,
      connectionHeaderCheck,
      methodCheck,
      originCheck
    )
  )
  {
    upgradeConnection(req, socket, head)
  }
}

function upgradeConnection(req, socket, head) {
  let wsClientKey = req.headers[ "sec-websocket-key" ]

  let headers = createUpgradeHeaders(wsClientKey)

  socket.write(headers)
  startWebSocketConnection(socket)
}

function startWebSocketConnection(socket) {
  console.log(`ws connection established. client port: ${socket.remoteport} and address: ${socket.remoteAddress}`)

  let receiver = new WebSocketReceiver(socket)

  socket.on("data", (chunk) => {
    receiver.processBuffer(chunk)
  })

  socket.on("end", () => {
    console.log('connection closed! ')
  })
}

function processBuffer(chunk) {
  console.log(chunk)
}
