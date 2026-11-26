import GuideDeadlines from "./pages/GuideDeadlines";
import StudentDeadlines from "./pages/StudentDeadlines";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import GuideDashboard from "./pages/GuideDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import Proposal from "./pages/Proposal";
import CoordinatorAssign from "./pages/CoordinatorAssign";

function App() {
  return (
    <Routes>
      <Route path="/coordinator/assign" element={<CoordinatorAssign />} />
      <Route path="/guide/deadlines" element={<GuideDeadlines />} />
      <Route path="/student/deadlines" element={<StudentDeadlines />} />
      <Route path="/proposal" element={<Proposal />} />
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/guide" element={<GuideDashboard />} />
      <Route path="/coordinator" element={<CoordinatorDashboard />} />
    </Routes>
  );
}

export default App;
