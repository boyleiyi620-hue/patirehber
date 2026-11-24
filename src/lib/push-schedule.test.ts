import { describe, expect, it } from "vitest";
import { localClockAt, shouldSendReminderNow, type PushNotificationPreferences, type PushReminderCandidate } from "./push-schedule";

const now = new Date("2026-11-24T14:30:00.000Z");
const preferences: PushNotificationPreferences = {
  enabled: true,
  food: true,
  water: true,
  litter: true,
  health: true,
  quietHours: true,
};
const reminder: PushReminderCandidate = {
  id: "r1",
  type: "food",
  title: "Sabah maması",
  time: "09:30",
  days: [2],
  enabled: true,
  last_completed: null,
  snoozed_until: null,
};

describe("background push schedule", () => {
  it("uses the device time zone and local weekday", () => {
    const clock = localClockAt(now, "America/New_York");
    expect(clock).toEqual({ date: "2026-11-24", weekday: 2, time: "09:30", hour: 9 });
    expect(shouldSendReminderNow(reminder, preferences, clock, now)).toBe(true);
  });

  it("respects quiet hours and category preferences", () => {
    const night = localClockAt(new Date("2026-11-24T04:30:00.000Z"), "America/New_York");
    const lateReminder = { ...reminder, time: night.time };
    expect(shouldSendReminderNow(lateReminder, preferences, night, new Date("2026-11-24T04:30:00.000Z"))).toBe(false);
    expect(shouldSendReminderNow(reminder, { ...preferences, food: false }, localClockAt(now, "America/New_York"), now)).toBe(false);
  });

  it("does not repeat a completed or currently snoozed reminder", () => {
    const clock = localClockAt(now, "America/New_York");
    expect(shouldSendReminderNow({ ...reminder, last_completed: clock.date }, preferences, clock, now)).toBe(false);
    expect(shouldSendReminderNow({ ...reminder, snoozed_until: now.getTime() + 60_000 }, preferences, clock, now)).toBe(false);
  });

  it("allows other reminder types while quiet hours are disabled", () => {
    const clock = localClockAt(now, "America/New_York");
    expect(shouldSendReminderNow({ ...reminder, type: "special" }, { ...preferences, quietHours: false }, clock, now)).toBe(true);
  });
});
