import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardPage } from "../pages/DashboardPage";
import { SparePartsPage } from "../pages/SparePartsPage";
import { ExcelImportPage } from "../pages/ExcelImportPage";
import { MaintenancePage } from "../pages/MaintenancePage";
import { AlertsPage } from "../pages/AlertsPage";
import { ReportsPage } from "../pages/ReportsPage";
import { HistoryPage } from "../pages/HistoryPage";

export function Layout() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":    return <DashboardPage />;
      case "spare-parts":  return <SparePartsPage />;
      case "excel-import": return <ExcelImportPage />;
      case "maintenance":  return <MaintenancePage />;
      case "alerts":       return <AlertsPage />;
      case "reports":      return <ReportsPage />;
      case "history":      return <HistoryPage />;
      default:             return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-shrink-0">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
