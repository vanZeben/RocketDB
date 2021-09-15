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
      console.info("Connecting with: " + connectionString);
      this.client = new Client({ connectionString });
    } else {
      console.info("connecting with ", {
        user: user,
        host: server,
        database: database,
        password: userPassword,
        port: port,
      });
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
