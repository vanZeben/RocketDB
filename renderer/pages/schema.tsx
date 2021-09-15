import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { Collapse, Tag, Layout, Table, Card } from "antd";
import ConnectionData from "../utils/context/ConnectionDataContext";
import sql from "sql-template-strings";
import { Container } from "../components/Container";
import { table } from "console";
import App from "../components/App/App";
const { Header, Content, Sider } = Layout;

const { Panel } = Collapse;
function Home() {
  const [connection] = useContext(ConnectionData);

  const [tables, setTables] = useState([]);

  const fetchSchema = async () => {
    try {
      const { rows: tables } = await connection.client.query(sql`
        SELECT *
        FROM pg_catalog.pg_tables
        WHERE 
          schemaname != 'pg_catalog' 
        AND
          schemaname != 'information_schema'
        ORDER BY tablename`);

      setTables(tables);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {tables.map(({ tablename }) => (
          <Link key={tablename} href={`/table/${tablename}`}>
            {tablename}
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default Home;
