import { createContext, useContext, useState } from "react";

const DeadlinesContext = createContext();

export function DeadlinesProvider({ children }) {
  const [deadlines, setDeadlines] = useState([
    { id: 1, milestone: "Synopsis submission", dueDate: "2026-12-05" },
    { id: 2, milestone: "Review 1", dueDate: "2026-12-20" },
  ]);

  const addDeadline = (d) =>
    setDeadlines((prev) => [...prev, { ...d, id: Date.now() }]);

  const removeDeadline = (id) =>
    setDeadlines((prev) => prev.filter((d) => d.id !== id));

  return (
    <DeadlinesContext.Provider value={{ deadlines, addDeadline, removeDeadline }}>
      {children}
    </DeadlinesContext.Provider>
  );
}

export const useDeadlines = () => useContext(DeadlinesContext);