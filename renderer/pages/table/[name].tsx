import { useRouter } from "next/dist/client/router";
import React, { useContext, useState, useEffect } from "react";
import ConnectionData from "../../utils/context/ConnectionDataContext";
import sql from "sql-template-strings";
import { Tag, Layout, Collapse, Table, Menu } from "antd";
import Link from "next/link";
import { Container } from "../../components/Container";
const { Header } = Layout;
const { Panel } = Collapse;
export const TableView = () => {
  const router = useRouter();
  const { name } = router.query;

  const [connection] = useContext(ConnectionData);

  const [columns, setColumns] = useState([]);

  const fetchSchema = async () => {
    try {
      const { rows: columns } = await connection.client.query(sql`
        SELECT *
        FROM information_schema.columns
        WHERE 
          table_name = ${name}
        ORDER BY 
          ordinal_position ASC;`);
      const _columns = [];
      for (const column of columns) {
        const c = { ...column };
        if (column.udt_schema === "public") {
          const { rows: enumVals } = await connection.client.query(sql`
            select n.nspname as enum_schema,  
              t.typname as enum_name,  
              e.enumlabel as enum_value
            from pg_type t 
              join pg_enum e on t.oid = e.enumtypid  
              join pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typname = ${column.udt_name};`);
          c.data_type = (
            <>
              {enumVals.map(({ enum_value }) => (
                <Tag>{enum_value}</Tag>
              ))}
            </>
          );
        }
        _columns.push(c);
      }
      setColumns(_columns);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  return (
    <React.Fragment>
      <Header>
        <span style={{ color: "white", float: "left", marginRight: "20px" }}>
          {name}
        </span>
        <Menu theme="dark" mode="horizontal">
          <Menu.Item>
            <Link href="/schema">Table list</Link>
          </Menu.Item>
        </Menu>
      </Header>
      <Container>
        <Table
          pagination={false}
          columns={[
            {
              title: "Column Name",
              dataIndex: "column_name",
              key: "column_name",
            },
            {
              title: "Type",
              dataIndex: "data_type",
              key: "type",
            },
            {
              title: "Is Nullable",
              dataIndex: "is_nullable",
              key: "is_nullable",
            },
          ]}
          dataSource={columns.map((v) => ({
            key: v.ordinal_position,
            ...v,
          }))}
        />
      </Container>
    </React.Fragment>
  );
};

export default TableView;
