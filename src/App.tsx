import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { GuestRoute } from "./components/auth/GuestRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleGuard } from "./components/auth/RoleGuard";
import { RoleRedirect } from "./components/auth/RoleRedirect";
import { AuthSetup } from "./components/AuthSetup";
import { EmployeeLayout } from "./components/layouts/EmployeeLayout";
import { TechnicianLayout } from "./components/layouts/TechnicianLayout";
import { DashboardPage as EmployeeDashboardPage } from "./pages/employee/DashboardPage";
import { DevicesPage as EmployeeDevicesPage } from "./pages/employee/DevicesPage";
import { TicketDetailPage as EmployeeTicketDetailPage } from "./pages/employee/TicketDetailPage";
import { TicketsPage as EmployeeTicketsPage } from "./pages/employee/TicketsPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage as TechnicianDashboardPage } from "./pages/technicians/DashboardPage";
import { DevicesPage as TechnicianDevicesPage } from "./pages/technicians/DevicesPage";
import { TicketDetailPage as TechnicianTicketDetailPage } from "./pages/technicians/TicketDetailPage";
import { TicketsPage as TechnicianTicketsPage } from "./pages/technicians/TicketsPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";

function LegacyTicketDetailRedirect() {
  const { id = "" } = useParams();
  return <Navigate to={`/employee/tickets/${id}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthSetup>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/unauthorized"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["ADMIN"]}>
                  <UnauthorizedPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleRedirect />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["EMPLOYEE"]}>
                  <EmployeeLayout />
                </RoleGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<EmployeeDashboardPage />} />
            <Route path="tickets" element={<EmployeeTicketsPage />} />
            <Route path="tickets/:id" element={<EmployeeTicketDetailPage />} />
            <Route path="device" element={<EmployeeDevicesPage />} />
          </Route>

          <Route
            path="/technician"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["TECHNICIAN"]}>
                  <TechnicianLayout />
                </RoleGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<TechnicianDashboardPage />} />
            <Route path="tickets" element={<TechnicianTicketsPage />} />
            <Route path="tickets/:id" element={<TechnicianTicketDetailPage />} />
            <Route path="devices" element={<TechnicianDevicesPage />} />
          </Route>

          {/* Legacy flat routes — redirect during transition */}
          <Route path="/tickets" element={<Navigate to="/employee/tickets" replace />} />
          <Route path="/tickets/:id" element={<LegacyTicketDetailRedirect />} />
          <Route path="/device" element={<Navigate to="/employee/device" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthSetup>
    </BrowserRouter>
  );
}

export default App;
