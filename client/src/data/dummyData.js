export const dummyTeams = [
  {
    id: 1,
    teamName: "Team Alpha",
    members: ["Mirvaza", "Nuha"],
    projectTitle: "Smart Project Portal",
    status: "Pending",
  },
  {
    id: 2,
    teamName: "Team Beta",
    members: ["Asha", "Ravi"],
    projectTitle: "Canteen Food Wastage Predictor",
    status: "Approved",
  },
];

export const coordinatorStats = [
  { label: "Teams registered", value: 42 },
  { label: "Teams without a guide", value: 6 },
  { label: "Pending proposals", value: 11 },
  { label: "Deadlines in 7 days", value: 2 },
];

export const upcomingDeadlines = [
  { milestone: "Synopsis submission", dueDate: "dd/mm/yyyy", pending: 9 },
  { milestone: "Review 1", dueDate: "dd/mm/yyyy", pending: 42 },
];

export const studentStats = [
  { label: "Team status", value: "Registered" },
  { label: "Assigned guide", value: "Pending" },
  { label: "Proposal status", value: "Draft" },
  { label: "Next deadline", value: "dd/mm/yyyy" },
];

export const studentTasks = [
  { milestone: "Synopsis submission", dueDate: "dd/mm/yyyy", status: "Not submitted" },
  { milestone: "Review 1", dueDate: "dd/mm/yyyy", status: "Not submitted" },
];
export const guideStats = [
  { label: "Assigned teams", value: 4 },
  { label: "Proposals to review", value: 2 },
  { label: "Approved projects", value: 1 },
  { label: "Feedback pending", value: 3 },
];

export const guideTeams = [
  { team: "Team Alpha", project: "Smart Project Portal", status: "Pending review" },
  { team: "Team Beta", project: "Canteen Food Wastage Predictor", status: "Approved" },
  { team: "Team Gamma", project: "Attendance Using Face Recognition", status: "Changes requested" },
];
export const teamProject = {
  title: "Smart Project Portal",
  problemStatement:
    "Academic project management relies on manual processes, making it hard to spot overlapping ideas and track progress.",
  guide: "Guide name",
  members: ["Mirvaza", "Nuha"],
  status: "Approved",
};
