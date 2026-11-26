import DashboardLayout from "../components/DashboardLayout";
import ScheduleManager from "../components/ScheduleManager";
import { GUIDE_TEAM_IDS } from "../data/demoTeams";

function GuideDeadlines() {
  return (
    <DashboardLayout role="Guide">
      <h2>Schedule</h2>
      <p>Set deadlines and presentations for your teams.</p>
      <ScheduleManager role="Guide" teamIds={GUIDE_TEAM_IDS} allowAll={false} />
    </DashboardLayout>
  );
}

export default GuideDeadlines;