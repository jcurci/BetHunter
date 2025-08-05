import React from "react";
import AppNavigator from "./src/core/navigation/AppNavigator";
import { AuthProvider } from "./src/core/AuthContext";

const App = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;
