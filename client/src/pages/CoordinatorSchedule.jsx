import DashboardLayout from "../components/DashboardLayout";
import ScheduleManager from "../components/ScheduleManager";
import { ALL_TEAMS } from "../data/demoTeams";

function CoordinatorSchedule() {
  return (
    <DashboardLayout role="Coordinator">
      <h2>Schedule</h2>
      <p>Set deadlines and presentations for any team, or for everyone at once.</p>
      <ScheduleManager
        role="Coordinator"
        teamIds={ALL_TEAMS.map((t) => t.id)}
        allowAll={true}
      />
    </DashboardLayout>
  );
}

export default CoordinatorSchedule;