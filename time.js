// Frappe returns naive datetimes ("YYYY-MM-DD HH:mm:ss").
// shortcut: assumes browser timezone = server timezone, read the system timezone if they ever differ.
export const parse = (s) => new Date(s.replace(" ", "T"));

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toServer = (d) => `${ymd(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export function weekStart(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
}

// logs: [{log_type: "IN"|"OUT", time}] sorted ascending. Returns 7 days Mon..Sun with worked ms.
export function weekSummary(logs, now) {
  const start = weekStart(now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return { date, ms: 0 };
  });
  const add = (from, to) => {
    for (const day of days) {
      const next = new Date(day.date);
      next.setDate(next.getDate() + 1);
      const a = Math.max(from, day.date), b = Math.min(to, next);
      if (b > a) day.ms += b - a;
    }
  };
  let open = null;
  for (const log of logs) {
    const t = parse(log.time);
    if (log.log_type === "IN") open ??= t; // repeated IN keeps the first one
    else if (open) { add(open, t); open = null; }
  }
  if (open) add(open, now);
  return days;
}

export const duration = (ms) => {
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}h ${pad(m % 60)}m`;
};

export const clock = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
};
