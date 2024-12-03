# WebSocket Server (Work in Progress)

This is my current project: a WebSocket server based on [RFC 6455](https://datatracker.ietf.org/doc/html/rfc6455). The project is not completed yet, but some features, such as the HTTP handshake, are implemented.

## Features implemented

- **HTTP Handshake**: The server successfully performs the WebSocket handshake as specified in RFC 6455.
- **WebSocket Frame Parsing**: Basic frame parsing is implemented, including handling of FIN bit and opcode.

## TODO

-  Add CLI for local http test server management
-  Implement message fragmentation and reassembly
-  Add support for different WebSocket opcodes (e.g., ping, pong, close)
-  Improve error handling and validation
-  Add unit tests for core functionalities
-  Optimize performance for high concurrency