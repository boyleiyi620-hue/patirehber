import { describe, expect, it } from "vitest";
import type { Reminder, Task } from "./types";
import { isReminderCompletedOn, taskCompletedOn, taskProgressOn } from "./utils";

const task: Task = {
  id: "task-1",
  catId: "cat-1",
  title: "İlaç ver",
  emoji: "💊",
  kind: "medication",
  target: 2,
  progress: 2,
  progressByDate: [
    { date: "2026-11-21", progress: 2, completedAt: "2026-11-21T12:00:00.000Z" },
  ],
  createdAt: "2026-11-20T12:00:00.000Z",
};

const reminder: Reminder = {
  id: "reminder-1",
  catId: "cat-1",
  type: "medication",
  title: "İlaç",
  time: "09:00",
  days: [0, 1, 2, 3, 4, 5, 6],
  enabled: true,
  streak: 0,
  history: ["2026-11-21"],
};

describe("date-scoped history", () => {
  it("reads task progress only from the selected day", () => {
    expect(taskProgressOn(task, "2026-11-21")).toBe(2);
    expect(taskProgressOn(task, "2026-11-20")).toBe(0);
  });

  it("marks the task complete on its recorded day only", () => {
    expect(taskCompletedOn(task, "2026-11-21")).toBe(true);
    expect(taskCompletedOn(task, "2026-11-20")).toBe(false);
  });

  it("recognizes a reminder completion in its history", () => {
    expect(isReminderCompletedOn(reminder, "2026-11-21")).toBe(true);
    expect(isReminderCompletedOn(reminder, "2026-11-20")).toBe(false);
  });
});
