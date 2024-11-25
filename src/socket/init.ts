import env from "@/configs/env";
import { Server, ServerOptions } from "socket.io";
import http from "http";

const opt: Partial<ServerOptions> = {
  cors: {
    origin: `${env.CLIENT_URL}`,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
};

class SocketServer extends Server {
  private static io: SocketServer;

  constructor(httpServer: http.Server) {
    super(httpServer, opt);
  }

  public static getInstance(httpServer?: http.Server): SocketServer {
    if (!SocketServer.io) {
      if (!httpServer) throw Error("httpServer to create SocketServer");
      SocketServer.io = new SocketServer(httpServer);
    }
    return SocketServer.io;
  }
}
export default SocketServer;
