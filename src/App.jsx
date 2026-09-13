import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { router } from "./Routes/index";
import { queryClient } from "./queryClient";
import AuthContextProvider from "./context/AuthContext";
import PWAInstallProvider from "./context/PWAInstallContext";
import AppToaster from "./components/ui/Toast";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <PWAInstallProvider>
          <RouterProvider router={router} />

          <AppToaster />
        </PWAInstallProvider>
      </AuthContextProvider>
    </QueryClientProvider>
  );
}

export default App;
