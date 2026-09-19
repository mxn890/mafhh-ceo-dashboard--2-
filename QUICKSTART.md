# MAFHH CEO Dashboard — ready to run

This is your full dashboard project. Live data from the Module 4 VPS,
employee profiles, alerts, attendance-by-PC-activity, and now a 30-day
history view. Verified with an actual `next build` before packaging —
it compiles clean from a fresh `npm install`.

## Run it

```bash
cd mafhh-ceo-dashboard
npm install
npm run dev
```

Open http://localhost:3000

**Deploy the VPS server files first, this dashboard zip second.** This
dashboard now calls `/config/seats`, an endpoint that only exists in the
`module4-apiRoutes.js` from this same delivery — if you run this dashboard
against an older, not-yet-updated VPS, every page will fail with a 502.
If you've already run `./deploy.sh` for this round, you're fine; if not,
do that first.

`node_modules` and `.next` are not included — regenerable, and would be
Linux binaries from the build machine, not Mac ones. `.env.local` already
points at your VPS. Nothing else to configure.

## What's new in this round

**PC-10's two shifts are now tracked as two separate people, everywhere.**
Amjad (day) and Hamza (night) share one physical machine, and until now
every part of the system — live status, active/idle minutes, screen time,
alert cooldowns, and the saved daily reports — was keyed by PC only, so
their activity was silently merging into one bucket under whichever of them
was most recently active. They now show as two separate rows throughout the
dashboard, each labeled "Day shift" / "Night shift", each with completely
independent numbers. This requires the matching VPS update — see the
`module4-fixes` server files from the same delivery; the dashboard alone
can't fix this without the server-side change.

**Browse any of the last 30 days, not just today.** Both the employee
profile page and the Alerts page now have a day picker — Today, Yesterday,
or pick an older date. A past day pulls from the closed daily report and
that day's alerts, so it can never look like it's "still loading" the way
a live number can mid-day. On the VPS side, the server now backfills any
missing daily report on startup, so a restart that happens to land near the
6pm report-generation time can't silently leave a permanent gap — but that
part requires the updated `module4-server.js` to be deployed on the VPS
(separate from this zip).

**"Last updated" timestamp on every live page**, and pages now re-check
themselves the instant you switch back to the tab, not just on the 30-second
timer. Browsers throttle background tabs, so if this dashboard sits open
behind other windows for a while, the old behavior could quietly show data
staler than it looked. Now you can always see exactly how fresh what you're
looking at is, and switching back to the tab forces an immediate recheck.

## What's real vs. what's still mock

**Live, from your actual VPS:**
- `/module4` — all 15 PCs, live status, 30s auto-refresh
- `/employees` — directory, links to full profiles
- `/employees/[pcId]` — profile with a day picker: today's live numbers, or
  any of the last 30 closed days
- `/alerts` — day-grouped (Today, Yesterday, pick a date), filter by
  severity or open-only, acknowledge button
- `/attendance` — PC-activity presence proxy (see below)

**Still mock (modules 1–3 and 6 — left for later, as agreed):**
- Homepage tiles for flights, shipments, CCTV
- `/module2`, `/module3`, `/module6` pages

## About the Attendance page

Still not a real attendance system — Module 5 (GPS + selfie) is waiting on
the client's shift-rules form. `/attendance` shows the first PC activity
each employee had today, which is a useful signal but not verified
attendance. Says so in the banner on the page. Don't use it to make
disciplinary calls.

## Folders you can delete if you still have them lying around

Only relevant if you're merging into an older copy instead of using this
zip fresh — five folders from a shell command that didn't expand `{a,b,c}`
syntax properly:

```
app/api/{auth,employees,pc-monitoring,flights,shipments,attendance,cctv}
app/components/{common,dashboard,module4,module5,module2,module3,module6}
app/{module2,module3,module6}
app/module{2,3,6}
app/lib/{db,auth,socket,utils}
```

This zip doesn't have them.
