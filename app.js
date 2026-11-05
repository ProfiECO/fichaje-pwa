import * as api from "./api.js";
import { weekStart, weekSummary, toServer, parse, duration, clock } from "./time.js";

const $ = (id) => document.getElementById(id);
const DAY_GOAL_MS = 8 * 3600000; // bar scale

let state = null; // { employee, settings, logs }

const showError = (err) => ($("error").textContent = err ? err.message || String(err) : "");

async function sync() {
  const employee = await api.getEmployee();
  if (!employee) throw new Error("Tu usuario no tiene un empleado activo en Frappe HR.");
  const since = new Date(weekStart(new Date()));
  since.setDate(since.getDate() - 1); // catch a session opened before Monday
  const [settings, week, last] = await Promise.all([
    api.getHrSettings(),
    api.getCheckins(employee.name, [["time", ">=", toServer(since)]]),
    api.getCheckins(employee.name, [], { order: "time desc", limit: 1 }),
  ]);
  state = { employee, settings, logs: week.length ? week : last };
  $("name").textContent = employee.employee_name;
  render();
}

function render() {
  if (!state) return;
  const now = new Date();
  const days = weekSummary(state.logs, now);
  const todayIdx = (now.getDay() + 6) % 7;
  const lastLog = state.logs.at(-1);
  const inside = lastLog?.log_type === "IN";

  $("status").textContent = lastLog
    ? `${inside ? "Dentro desde" : "Última salida"}: ${parse(lastLog.time).toLocaleString("es", { weekday: "short", hour: "2-digit", minute: "2-digit" })}`
    : "Sin fichajes";
  $("clock").hidden = !inside;
  if (inside) $("clock").textContent = clock(now - parse(lastLog.time));
  $("today-total").textContent = `Hoy: ${duration(days[todayIdx].ms)}`;
  const btn = $("action");
  btn.textContent = inside ? "Salida" : "Entrada";
  btn.classList.toggle("out", inside);

  const scale = Math.max(DAY_GOAL_MS, ...days.map((d) => d.ms));
  $("days").replaceChildren(
    ...days.map((d, i) => {
      const li = document.createElement("li");
      li.classList.toggle("today", i === todayIdx);
      li.innerHTML = `<span></span><div class="bar"><i style="width:${(d.ms / scale) * 100}%"></i></div><span></span>`;
      li.firstChild.textContent = d.date.toLocaleDateString("es", { weekday: "short", day: "numeric" });
      li.lastChild.textContent = duration(d.ms);
      return li;
    })
  );
  $("week-total").textContent = duration(days.reduce((s, d) => s + d.ms, 0));
}

const position = () =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => reject(new Error("No se pudo obtener la ubicación, que es obligatoria para fichar.")),
      { timeout: 10000 }
    )
  );

$("action").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  showError();
  try {
    const inside = state.logs.at(-1)?.log_type === "IN";
    await api.createCheckin({
      employee: state.employee.name,
      log_type: inside ? "OUT" : "IN",
      time: toServer(new Date()),
      ...(state.settings?.allow_geolocation_tracking ? await position() : {}),
    });
    await sync();
  } catch (err) {
    showError(err);
  } finally {
    btn.disabled = false;
  }
});

$("setup").addEventListener("submit", async (e) => {
  e.preventDefault();
  showError();
  const form = new FormData(e.target);
  const btn = e.target.querySelector("button");
  try {
    const domain = new URL(form.get("domain")).origin;
    btn.disabled = true;
    const config = { domain, usr: form.get("usr").trim(), pwd: form.get("pwd") };
    await api.login(config.domain, config.usr, config.pwd);
    await api.saveConfig(config);
    await start();
  } catch (err) {
    await api.clearConfig();
    showError(err);
  } finally {
    btn.disabled = false;
  }
});

$("logout").addEventListener("click", async () => {
  await api.clearConfig();
  state = null;
  start();
});

document.querySelectorAll("[role=tab]").forEach((tab) =>
  tab.addEventListener("click", () => {
    document.querySelectorAll("[role=tab]").forEach((t) => {
      t.setAttribute("aria-selected", t === tab);
      $(t.dataset.tab).hidden = t !== tab;
    });
  })
);

async function start() {
  const config = await api.getConfig();
  $("setup").hidden = !!config;
  $("main").hidden = !config;
  if (!config) return;
  $("domain").textContent = new URL(config.domain).host;
  try {
    await sync();
  } catch (err) {
    showError(err);
  }
}

// Served from the Frappe domain (or the dev proxy), the API lives on this same origin.
if (!location.hostname.endsWith("github.io")) document.querySelector("[name=domain]").value = location.origin;
navigator.serviceWorker?.register("sw.js");
setInterval(render, 1000);
start();
