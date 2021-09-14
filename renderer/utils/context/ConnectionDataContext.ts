import React from "react";
import Connection from "../Connection";

export const ConnectionData =
  React.createContext<[Connection, React.Dispatch<Connection>]>(null);
export default ConnectionData;
