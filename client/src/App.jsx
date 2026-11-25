import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import GuideDashboard from "./pages/GuideDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import TeamRegistration from "./pages/TeamRegistration";
import ProposalForm from "./pages/ProposalForm";
import StudentStatus from "./pages/StudentStatus";
import GuideTeamList from "./pages/GuideTeamList";
import GuideReview from "./pages/GuideReview";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team-registration"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <TeamRegistration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proposal"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ProposalForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/status"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentStatus />
          </ProtectedRoute>
        }
      />

      <Route
        path="/guide"
        element={
          <ProtectedRoute allowedRoles={["guide"]}>
            <GuideDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guide-teams"
        element={
          <ProtectedRoute allowedRoles={["guide", "coordinator"]}>
            <GuideTeamList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guide-review"
        element={
          <ProtectedRoute allowedRoles={["guide"]}>
            <GuideReview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guide-review/:proposalId"
        element={
          <ProtectedRoute allowedRoles={["guide"]}>
            <GuideReview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coordinator"
        element={
          <ProtectedRoute allowedRoles={["coordinator"]}>
            <CoordinatorDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
