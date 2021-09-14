import React, { useContext, useEffect, useState } from "react";
import { Form, Input, Button, Card } from "antd";
import ConnectionData from "../../utils/context/ConnectionDataContext";
import Link from "next/link";
import Connection from "../../utils/Connection";
import { Container } from "../../components/Container";
import cryptojs from "crypto-js";
import mkdirp from "mkdirp";
import fs from "fs";
import path from "path";
import { F_OK } from "constants";
import { route } from "next/dist/server/router";
import { Router, useRouter } from "next/dist/client/router";

const CONFIG_FILE = "configs/data";
const hash = "ad21f733-4cc0-423f-b75c-ac8322c78a41";
const { Item } = Form;

export const AddConnection = () => {
  const router = useRouter();
  const [savedConnections, setSavedConnections] = useState<any[]>([]);
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
    fetchConnections();
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
  const saveConnection = async () => {
    const config = {
      connections: {
        dev: {
          host: connectionData.client.host,
          port: connectionData.client.port,
          user: connectionData.client.user,
          password: connectionData.client.password,
          database: connectionData.client.database,
        },
      },
    };
    const json = cryptojs.AES.encrypt(JSON.stringify(config), hash).toString();
    const dir = path.dirname(CONFIG_FILE);

    try {
      await new Promise((resolve, reject) => {
        fs.access(dir, F_OK, (notExists) => {
          if (!notExists) return fs.writeFile(CONFIG_FILE, json, resolve);
          return mkdirp(dir, (err) => {
            if (err) {
              return reject();
            }
            return fs.writeFile(CONFIG_FILE, json, resolve);
          });
        });
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConnections = async () => {
    const realData = await new Promise((resolve, reject) => {
      fs.readFile(CONFIG_FILE, { encoding: "utf8" }, (err, data) => {
        if (err) reject(err);
        const realData = JSON.parse(
          cryptojs.enc.Utf8.stringify(cryptojs.AES.decrypt(data, hash))
        );
        resolve(realData);
      });
    });
    setSavedConnections(realData["connections"]);
  };

  return (
    <>
      <Container>
        <Card>
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
                <>
                  <Button onClick={() => saveConnection()}>Save</Button>
                  <Button>
                    <Link href={`/schema`}>Schema</Link>
                  </Button>
                </>
              )}
              <Button onClick={() => fetchConnections()}>read</Button>
            </Item>
          </Form>
        </Card>
        <Card style={{ marginTop: "100px" }}>
          <h2>Saved Connections</h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {Object.keys(savedConnections)?.map((connectionName) => (
              <div style={{ display: "flex", flexDirection: "row" }}>
                <Button
                  style={{ marginRight: "50px" }}
                  onClick={() => {
                    setConnectionString(
                      `postgresql://${savedConnections[connectionName].user}:${savedConnections[connectionName].password}@${savedConnections[connectionName].host}:${savedConnections[connectionName].port}/${savedConnections[connectionName].database}`
                    );
                    testConnection();
                    router.push("/schema");
                  }}
                >
                  Connect to {connectionName}
                </Button>
                <code>{`postgresql://${savedConnections[connectionName].user}:${savedConnections[connectionName].password}@${savedConnections[connectionName].host}:${savedConnections[connectionName].port}/${savedConnections[connectionName].database}`}</code>
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </>
  );
};

export default AddConnection;
