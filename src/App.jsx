import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { router } from "./Routes/index";
import AuthContextProvider from "./context/AuthContext";
import PWAInstallProvider from "./context/PWAInstallContext";
import AppToaster from "./components/ui/Toast";

function App() {
  // Created once — a client rebuilt on every render throws away the cache.
  const [queryClient] = useState(() => new QueryClient());

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
