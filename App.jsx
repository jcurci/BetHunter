import React from "react";
import { StatusBar } from "expo-status-bar";
import Login from "./src/screens/Login";

const App = () => {
  return (
    <>
      <StatusBar style="auto" />
      <Login />
    </>
  );
};

export default App;
