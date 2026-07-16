import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { DashboardPage } from "../pages/DashboardPage";
import { SparePartsPage } from "../pages/SparePartsPage";
import { ExcelImportPage } from "../pages/ExcelImportPage";
import { MaintenancePage } from "../pages/MaintenancePage";
import { AlertsPage } from "../pages/AlertsPage";
import { ReportsPage } from "../pages/ReportsPage";
import { HistoryPage } from "../pages/HistoryPage";
import { ManagePermissionsPage } from "../pages/ManagePermissionsPage";
import { StorageDashboard } from "../pages/StorageDashboard";
import { useApp } from "../context/AppContext";
import { cn } from "./ui/utils";
import type { UserRole } from "../types";

const defaultPageForRole: Record<UserRole, string> = {
  Admin:              "dashboard",
  "Maintenance Team": "dashboard",
  "Storage Team":     "excel-import",
};

function RoleSwitcher() {
  const { state, dispatch } = useApp();
  const roles: UserRole[] = ["Admin", "Maintenance Team", "Storage Team"];
  return (
    <div className="flex items-center gap-3 px-5 py-2 bg-primary/5 border-b border-primary/10 text-xs">
      <span className="text-muted-foreground font-medium">Demo view:</span>
      <div className="flex gap-1.5 flex-1">
        {roles.map(role => (
          <button
            key={role}
            onClick={() => dispatch({ type: "SWITCH_CURRENT_ROLE", payload: role })}
            className={cn(
              "px-3 py-1 rounded-full font-medium transition-all",
              state.currentUser.role === role
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            )}
          >
            {role}
          </button>
        ))}
      </div>
      <button
        onClick={() => dispatch({ type: "LOGOUT" })}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all font-medium"
        title="Sign out"
      >
        <LogOut className="w-3 h-3" /> Sign out
      </button>
    </div>
  );
}

export function Layout() {
  const { state } = useApp();
  const role = state.currentUser.role;
  const [currentPage, setCurrentPage] = useState(defaultPageForRole[role]);

  useEffect(() => {
    setCurrentPage(defaultPageForRole[role]);
  }, [role]);

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":          return <DashboardPage />;
      case "spare-parts":        return <SparePartsPage />;
      case "excel-import":       return role === "Storage Team" ? <StorageDashboard /> : <ExcelImportPage />;
      case "maintenance":        return <MaintenancePage />;
      case "alerts":             return <AlertsPage />;
      case "reports":            return <ReportsPage />;
      case "history":            return <HistoryPage />;
      case "manage-permissions": return <ManagePermissionsPage />;
      default:                   return <DashboardPage />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <RoleSwitcher />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-shrink-0">
          <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
