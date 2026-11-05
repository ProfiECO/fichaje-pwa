import { test } from "node:test";
import assert from "node:assert/strict";
import { weekStart, weekSummary, duration, clock } from "./time.js";

const H = 3600000;

test("weekStart is Monday 00:00", () => {
  assert.equal(weekStart(new Date(2026, 10, 4, 15)).toDateString(), new Date(2026, 10, 2).toDateString());
  assert.equal(weekStart(new Date(2026, 10, 8, 23)).toDateString(), new Date(2026, 10, 2).toDateString());
});

test("pairs IN/OUT per day and counts the open session until now", () => {
  const logs = [
    { log_type: "IN", time: "2026-11-02 08:00:00" },
    { log_type: "OUT", time: "2026-11-02 14:00:00" },
    { log_type: "IN", time: "2026-11-02 15:00:00" },
    { log_type: "OUT", time: "2026-11-02 17:30:00" },
    { log_type: "IN", time: "2026-11-04 09:00:00" },
    { log_type: "IN", time: "2026-11-04 09:05:00" },
  ];
  const days = weekSummary(logs, new Date(2026, 10, 4, 11));
  assert.equal(days[0].ms, 8.5 * H);
  assert.equal(days[1].ms, 0);
  assert.equal(days[2].ms, 2 * H);
});

test("splits sessions across midnight and ignores time before Monday", () => {
  const logs = [
    { log_type: "IN", time: "2026-11-01 22:00:00" },
    { log_type: "OUT", time: "2026-11-02 02:00:00" },
  ];
  assert.equal(weekSummary(logs, new Date(2026, 10, 4))[0].ms, 2 * H);
});

test("formatters", () => {
  assert.equal(duration(8.5 * H), "8h 30m");
  assert.equal(clock(H + 61000), "01:01:01");
});
