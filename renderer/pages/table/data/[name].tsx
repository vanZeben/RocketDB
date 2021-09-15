import { useRouter } from "next/dist/client/router";
import React, { useContext, useState, useEffect } from "react";
import ConnectionData from "../../../utils/context/ConnectionDataContext";
import sql from "sql-template-strings";
import { Pagination, Tag, Layout, Collapse, Table, Menu, Card } from "antd";
import Link from "next/link";
const { Header } = Layout;
const { Panel } = Collapse;
export const TableView = () => {
  const router = useRouter();
  const { name } = router.query;

  const [connection] = useContext(ConnectionData);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(-1);
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const total_per_page = 10;
  const getColumns = async () => {
    const { rows: columns } = await connection.client.query(sql`
        SELECT *
        FROM information_schema.columns
        WHERE 
          table_name = ${name}
        ORDER BY 
          ordinal_position ASC;`);
    return columns;
  };

  const getPK = async () => {
    const { rows: indexes } = await connection.client.query(sql`
    select
    t.relname as table_name,
    i.relname as index_name,
    a.attname as column_name
from
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a
where
    t.oid = ix.indrelid
    and i.oid = ix.indexrelid
    and a.attrelid = t.oid
    and a.attnum = ANY(ix.indkey)
    and t.relkind = 'r'
    and t.relname like ${name}
order by
    t.relname,
    i.relname;`);
    for (const index of indexes) {
      if (index.index_name.indexOf("_pkey") !== -1) {
        return index.column_name;
      }
    }
    return null;
  };

  useEffect(() => {
    getData();
  }, [currentPage]);

  const getData = async () => {
    const pk = await getPK();
    const { rows: data } = await connection.client.query(`
      SELECT ${pk}, * 
      FROM ${name}
      ORDER BY ${pk} ASC
      LIMIT ${total_per_page} OFFSET ${total_per_page * (currentPage - 1)};
    `);
    setData(data);
  };
  const getTotalItems = async () => {
    const { rows: data } = await connection.client.query(`
      SELECT COUNT(*) 
      FROM ${name}
    `);
    setTotalItems(data[0].count);
  };

  const fetchSchema = async () => {
    try {
      getTotalItems();
      setColumns(await getColumns());
      await getData();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, [name]);

  return (
    <Card>
      {name}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Table
          style={{
            overflowX: "scroll",
            minWidth: "100%",
          }}
          bordered={true}
          size="small"
          pagination={false}
          columns={columns.map((column) => ({
            title: column.column_name,
            dataIndex: column.column_name,
            key: column.column_name,
            render: (text) => {
              if (!!text) {
                if (text instanceof Date) {
                  return text.toISOString();
                }
                return text;
              } else {
                return <Tag>NULL</Tag>;
              }
            },
          }))}
          dataSource={data}
        />
        <Pagination
          current={currentPage}
          onChange={(page) => setCurrentPage(page)}
          total={totalItems}
          pageSize={total_per_page}
          showSizeChanger={false}
          style={{ marginTop: "20px", marginLeft: "auto" }}
        />
      </div>
    </Card>
  );
};

export default TableView;
