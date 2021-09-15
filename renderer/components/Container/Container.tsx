import React from "react";
import { Layout } from "antd";
import Sider from "antd/lib/layout/Sider";
const { Content } = Layout;
export const Container = ({ children }) => {
  return (
    <React.Fragment>
      <Sider></Sider>
      <Layout
        style={{
          display: "flex",
          minWidth: "100vw",
          minHeight: "calc(100vh - 64px)",
          padding: "24px 24px",
        }}
      >
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: "#fff",
          }}
        >
          {children}
        </Content>
      </Layout>
    </React.Fragment>
  );
};
