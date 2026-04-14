// React import not needed in React 18+
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "../components/ui/sonner";
import { AppProvider } from "../context/AppContext";
import { MobileShell } from "../components/MobileShell";

function App() {
  return (
    <AppProvider>
      <MobileShell>
        <RouterProvider router={router} />
      </MobileShell>
      <Toaster />
    </AppProvider>
  );
}

export default App;
