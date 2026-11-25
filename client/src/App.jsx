import { Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <Routes>
  <Route path="/" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/student" element={<StudentDashboard />} />
  <Route path="/guide" element={<GuideDashboard />} />
  <Route path="/coordinator" element={<CoordinatorDashboard />} />
  <Route path="/team-registration" element={<TeamRegistration />} />
  <Route path="/proposal" element={<ProposalForm />} />
  <Route path="/status" element={<StudentStatus />} />
  <Route path="/guide-teams" element={<GuideTeamList />} />
  <Route path="/guide-review" element={<GuideReview />} />
</Routes>
    
  );
}

export default App;
