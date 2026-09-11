# Media the homepage expects

These files are referenced by the page but are **not** in the repo. The design
project stores them as binaries and the sync tool truncates anything over
256 KB, so they have to be copied across by hand from the Claude Design
project `darlean-dark-website` (folders `assets/` and `uploads/`).

Drop them in here with exactly these names and the page picks them up — no code
change needed.

| File here | Source in the design project |
|---|---|
| `hero-main.mp4` | `assets/hero-main-v2.mp4` |
| `hero-notifications.mp4` | `assets/hero-notifications-v2.mp4` |
| `feature-projects.mp4` | `uploads/Раскрытие проекта (1).mp4` |
| `feature-requests.mp4` | `uploads/Процесс заявки (1).mp4` |
| `feature-org-chart.mp4` | `uploads/Оргструктура анимация (1).mp4` |
| `feature-meetings.mp4` | `uploads/Meeting Flow (1).mp4` |
| `agent-task.mp4` | `assets/agent-task.mp4` |
| `agent-report.mp4` | `assets/agent-report.mp4` |
| `agent-expense.mp4` | `assets/agent-expense.mp4` |
| `agent-secretary.mp4` | `assets/agent-secretary.mp4` |
| `agent-task.png` | `assets/agent-task.png` |
| `agent-report.png` | `assets/_report_frame.png` |
| `agent-expense.png` | `assets/_expense_frame.png` |
| `agent-secretary.png` | `assets/_secretary_frame.png` |

Until they arrive, every slot renders as a flat panel at the right size, so the
layout is already final — only the moving pictures are missing.

## The Lottie sphere

The AI assistant section has an animated sphere behind its headline
(`assets/ai-sphere.json` in the design project, ~1 MB of embedded PNG frames).
The comp played it with the bodymovin library from a CDN, which this project
does not use. To bring it back: self-host the player, add the JSON here and
mount it on `[data-ai-sphere]`. The section reads correctly without it.
