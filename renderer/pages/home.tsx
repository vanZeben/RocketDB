import React, { useContext, useEffect } from "react";
import Link from "next/link";
import { Layout, Form, Select, Menu } from "antd";
import { Container } from "../components/Container";
import ConnectionData from "../utils/context/ConnectionDataContext";
import { useRouter } from "next/dist/client/router";
import { route } from "next/dist/server/router";

function Home() {
  const router = useRouter();
  const [connection] = useContext(ConnectionData);
  useEffect(() => {
    if (!connection?.client) {
      router.push("/connections/add");
    }
  }, []);

  return <Container>Homepage</Container>;
}

export default Home;
