import React, { useContext, useEffect, useState } from "react";
import { Form, Input, Button } from "antd";
import ConnectionData from "../../utils/context/ConnectionDataContext";
import Link from "next/link";
import Connection from "../../utils/Connection";
import { Container } from "../../components/Container";

const { Item } = Form;
export const AddConnection = () => {
  const [connectionTested, setConnectionTested] = useState(false);
  const [server, setServer] = useState<string | undefined>(undefined);
  const [port, setPort] = useState<string | undefined>(undefined);
  const [database, setDatabase] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<string | undefined>(undefined);
  const [userPassword, setUserPassword] = useState<string | undefined>(
    undefined
  );
  const [connectionString, setConnectionString] = useState<string | undefined>(
    undefined
  );
  const [connectionData, setConnectionData] = useContext(ConnectionData);

  useEffect(() => {
    if (connectionData) {
      setServer(connectionData.server);
      setPort(connectionData.port);
      setDatabase(connectionData.database);
      setUser(connectionData.user);
      setUserPassword(connectionData.userPassword);
      setConnectionString(connectionData.connectionString);
      setConnectionTested(true);
    }
  }, []);
  const onFinish = async () => {
    await testConnection();
  };

  const testConnection = async () => {
    // clients will also use environment variables
    // for connection information
    const connection = new Connection(
      user,
      server,
      database,
      userPassword,
      port,
      connectionString
    );
    await connection.client.connect();
    try {
      await connection.client.query("SELECT NOW()");
      setConnectionTested(true);
      setConnectionData(connection);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container>
      <Form onFinish={onFinish}>
        <Item>
          <Input
            placeholder="Server"
            value={server}
            onChange={(e) => setServer(e.target.value)}
          />
        </Item>
        <Item>
          <Input
            placeholder="Port"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </Item>
        <Item>
          <Input
            placeholder="Database"
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
          />
        </Item>
        <Item>
          <Input
            placeholder="User"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </Item>
        <Item>
          <Input
            placeholder="User Password"
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
          />
        </Item>
        OR
        <Item>
          <Input
            placeholder="Connection String"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
          />
        </Item>
        <Item>
          {!connectionTested ? (
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
            >
              Test Connection
            </Button>
          ) : (
            <Button>
              <Link href={`/schema`}>Schema</Link>
            </Button>
          )}
        </Item>
      </Form>
    </Container>
  );
};

export default AddConnection;
