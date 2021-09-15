import { useRouter } from "next/dist/client/router";
import React, { useContext, useState, useEffect } from "react";
import ConnectionData from "../utils/context/ConnectionDataContext";
import sql from "sql-template-strings";
import { Tag, Layout, Collapse, Table, Menu, Card, Divider } from "antd";
import Link from "next/link";
import { KeyOutlined, BranchesOutlined } from "@ant-design/icons";
const { Header } = Layout;
const { Panel } = Collapse;

export const ErdView = () => {
  const [connection] = useContext(ConnectionData);

  const [tables, setTables] = useState([]);
  const getTables = async () => {
    const { rows: tables } = await connection.client.query(sql`
        SELECT *
        FROM pg_catalog.pg_tables
        WHERE 
          schemaname != 'pg_catalog' 
        AND
          schemaname != 'information_schema'
        ORDER BY tablename`);
    return tables;
  };

  const getIndexes = async (name) => {
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
    const _indexes = [];
    for (const index of indexes) {
      let _index = {};
      if (index.index_name.indexOf("_pkey") !== -1) {
        _index = { column: index.column_name, isPK: true };
      } else if (index.index_name.indexOf("_unique") !== -1) {
        _index = { column: index.column_name, isUnique: true };
      }
      _indexes.push(_index);
    }
    return _indexes;
  };

  const getColumns = async (name) => {
    const { rows: columns } = await connection.client.query(sql`
        SELECT *
        FROM information_schema.columns
        WHERE 
          table_name = ${name}
        ORDER BY 
          ordinal_position ASC;`);
    return columns;
  };

  const getForeignKeys = async (name) => {
    const { rows: keys } = await connection.client.query(sql`
    SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name=${name};
`);
    return keys;
  };

  const fetchSchema = async () => {
    try {
      const tables = await getTables();
      const _tables = [];
      for (const { tablename: name } of tables) {
        const columns = [];
        const indexes = await getIndexes(name);
        const foriegnKeys = await getForeignKeys(name);
        for (const column of await getColumns(name)) {
          const c = { ...column };
          if (
            column.udt_schema === "public" &&
            column.data_type === "USER-DEFINED"
          ) {
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
            for (const { enum_value, enum_name } of enumVals) {
              if (c.column_default === `'${enum_value}'::${enum_name}`) {
                c.column_default = <Tag>{enum_value}</Tag>;
              }
            }
          }
          if (c.udt_name === "timestamp") {
            c.data_type = c.udt_name;
          }
          if (
            !!c.column_default &&
            typeof c.column_default === "string" &&
            c.column_default.indexOf("nextval(") !== -1
          ) {
            c.column_default = <Tag>AutoIncrement</Tag>;
          }
          const index = indexes.find((v) => v.column === c.column_name);
          if (index) {
            if (index.isPK) {
              c.isPK = true;
            }
          }
          const fk = foriegnKeys.find((v) => v.column_name === c.column_name);
          if (fk) {
            c.isFK = true;
            c.foreign_key_table = fk.foreign_table_name;
            c.foreign_key_column = fk.foreign_column_name;
          }
          columns.push(c);
        }
        _tables.push({ name, columns });
      }
      setTables(_tables);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, [name]);

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {tables.map((table) => (
        <Card size="small" title={table.name}>
          <table>
            {table.columns.map((column) => (
              <tr>
                <td>{column.isPK && <KeyOutlined />}</td>
                <td>{column.column_name}</td>
                <td>{column.data_type}</td>
                <td>{column.isFK && <BranchesOutlined />}</td>
              </tr>
            ))}
          </table>
        </Card>
      ))}
    </div>
  );
};

export default ErdView;
