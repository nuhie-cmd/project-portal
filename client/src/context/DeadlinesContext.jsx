import { createContext, useContext, useState } from "react";

const ScheduleContext = createContext();

export function DeadlinesProvider({ children }) {
  const [events, setEvents] = useState([
    { id: 1, type: "Deadline", title: "Synopsis submission", date: "2026-12-05", teamId: "all", by: "Coordinator" },
    { id: 2, type: "Presentation", title: "Review 1 presentation", date: "2026-12-20", teamId: 1, by: "Guide" },
  ]);

  const addEvent = (e) =>
    setEvents((prev) => [...prev, { ...e, id: Date.now() }]);

  const removeEvent = (id) =>
    setEvents((prev) => prev.filter((e) => e.id !== id));

  return (
    <ScheduleContext.Provider value={{ events, addEvent, removeEvent }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export const useSchedule = () => useContext(ScheduleContext);