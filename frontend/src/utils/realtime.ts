export interface RealtimeAdapter {
  connect: () => void;
  disconnect: () => void;
}

export class PollingAdapter implements RealtimeAdapter {
  connect() {}
  disconnect() {}
}

export class SocketAdapter implements RealtimeAdapter {
  connect() {}
  disconnect() {}
}
