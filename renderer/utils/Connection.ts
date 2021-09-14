import { Client } from "pg";

class Connection {
  public client: Client;
  constructor(
    public user,
    public server,
    public database,
    public userPassword,
    public port,
    public connectionString
  ) {
    if (connectionString) {
      this.client = new Client({ connectionString });
    } else {
      this.client = new Client({
        user: user,
        host: server,
        database: database,
        password: userPassword,
        port: port,
      });
    }
  }
}
export default Connection;
