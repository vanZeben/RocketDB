import React, { useContext, useState } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";

import "antd/dist/antd.css";
import ConnectionData from "../utils/context/ConnectionDataContext";
import AddConnection from "./connections/add";
import App from "../components/App/App";
import { Container } from "../components/Container";

function MyApp({ Component, pageProps }: AppProps) {
  const [connectionData, setConnectionData] = useState(null);

  return (
    <ConnectionData.Provider value={[connectionData, setConnectionData]}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>RocketDB</title>
      </Head>

      {!connectionData ? (
        <Container>
          <AddConnection />
        </Container>
      ) : (
        <App>
          <Component {...pageProps} />
        </App>
      )}
    </ConnectionData.Provider>
  );
}

export default MyApp;
