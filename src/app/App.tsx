import { AppProvider, useApp } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";

function AppContent() {
  const { state } = useApp();
  if (!state.isAuthenticated) return <LoginPage />;
  return <Layout />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
