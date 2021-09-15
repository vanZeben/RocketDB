import { useRouter } from "next/dist/client/router";
import React, { useContext, useState, useEffect } from "react";
import ConnectionData from "../../../utils/context/ConnectionDataContext";
import sql from "sql-template-strings";
import { Tag, Layout, Collapse, Table, Menu } from "antd";
import Link from "next/link";
const { Header } = Layout;
const { Panel } = Collapse;
export const TableView = () => {
  const router = useRouter();
  const { name } = router.query;

  const [connection] = useContext(ConnectionData);

  const [columns, setColumns] = useState([]);

  const getIndexes = async () => {
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

  const getForeignKeys = async () => {
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
      const columns = [];

      const indexes = await getIndexes();
      const foriegnKeys = await getForeignKeys();
      for (const column of await getColumns()) {
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
          c.column_name = (
            <>
              {`${c.column_name}`}
              {index.isPK && (
                <>
                  &nbsp;<Tag>PRIMARY KEY</Tag>
                </>
              )}
              {index.isUnique && (
                <>
                  &nbsp;<Tag>UNIQUE</Tag>
                </>
              )}
            </>
          );
        }
        const fk = foriegnKeys.find((v) => v.column_name === c.column_name);
        if (fk) {
          c.foreign_key = (
            <Link href={`/table/${fk.foreign_table_name}`}>
              <Tag style={{ cursor: "pointer" }}>
                {fk.foreign_table_name}.{fk.foreign_column_name}
              </Tag>
            </Link>
          );
        }
        columns.push(c);
      }
      setColumns(columns);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, [name]);

  return (
    <>
      <Table
        pagination={false}
        title={() => name}
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
            title: "Default Value",
            dataIndex: "column_default",
            key: "column_default",
          },
          {
            title: "Is Nullable",
            dataIndex: "is_nullable",
            key: "is_nullable",
          },
          {
            title: "Relations",
            dataIndex: "foreign_key",
            key: "foreign_key",
          },
        ]}
        dataSource={columns.map((v) => ({
          key: v.ordinal_position,
          ...v,
        }))}
      />
    </>
  );
};

export default TableView;
