---
target: ParaTrack redesign (Figma Screens page)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "url:https://www.figma.com/design/46EIhMGyMDUB4712Nqp1au/ParaTrack-Midterm--Copy-"
timestamp: 2026-10-03T17-47-31Z
slug: hmgymdub4712nqp1au-paratrack-midterm-copy-7827bd19
closed: true
---
Method: dual-agent (A: design review agent · B: mechanical scan agent)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | "Live" never changes; no stale/offline state |
| 2 | Match System / Real World | 3 | Strong PH context; capacity bar shows taken while label counts left |
| 3 | User Control and Freedom | 3 | No guest exit from sign-up; no undo on Mark as full; no back on 12 |
| 4 | Consistency and Standards | 3 | Right column = wait on 06/08 but trip time on 07; 2 vs 1 min alert lead; Full alert yellow on 13 |
| 5 | Error Prevention | 2 | Anyone can become a driver; Go offline and Mark as full are one tap |
| 6 | Recognition Rather Than Recall | 3 | Map ring colors unlabeled; saved places only in Account |
| 7 | Flexibility and Efficiency | 2 | No recents or saved trips on Home/Search; no quick driver seat mode |
| 8 | Aesthetic and Minimalist Design | 3 | Disciplined; screen 12 announces next stop twice |
| 9 | Error Recovery | 2 | No wrong-code, offline, location-denied or vehicle-gone states |
| 10 | Help and Documentation | 2 | Good inline notes; no Help or Report a problem |
| **Total** | | **26/40** | **Acceptable** |

## Design Specificity Verdict
Coherent system, category-default structure (search over map, sheet, rows, 3 tabs). PH character lives in copy (LTFRB math, "Para po", plates, SM City). Misses: fill-then-leave terminal state, "Para" as toggle not action, fare hidden at payment (12).
Deterministic: impeccable detect could not run (no Chromium for URL scans; Figma canvas has no markup). Figma-native scan: contrast fails 2/319 (both disabled labels, exempt); 0/920 unbound colors; 0 clipped text; 0 sizes under 12px; max 1 primary per screen; 28 targets under 44pt with no larger hit area (18 map stops 14-28pt, 8 vehicle markers 36pt, checkbox 24pt in a 40pt row); text links ~20pt tall.

## Priority Issues
- [P1] Live data has no failure states. Fix: Updated/offline badge variants, offline Home, stopped-sharing state on 11, location pre-prompt, wrong-code error on 03. /impeccable harden
- [P1] Sign-up wall before value. Fix: guest-first Welcome ("Find rides near me"), number only for alerts/saved places/discount fares, code login. /impeccable onboard
- [P1] Seat counts can't be trusted. Fix: driver verification (operator code + plate), Go offline confirm, Marked full undo, count button pressed state. /impeccable harden
- [P1] Map status color-only, small targets. Fix: seats tag on markers, 44pt hit areas, darker filling ring. /impeccable colorize
- [P2] Same slot, different meaning. Fix: 07 wait time, one 2 min alert setting, red full alerts, capacity label, consistent times. /impeccable clarify

## Persona Red Flags
Casey: no guest path; search out of thumb reach; retyping trips; fare hidden at payment. Jordan: no ring legend; "27 min" meaning shift; unexplained "Student ID verified". Sam: color-only markers; sub-44pt markers, stops, checkbox, links; unread dot only. Driver: tap per passenger with no feedback; no undo/confirm; full styled as error; no GPS-lost state.

## Minor Observations
Plate styling inconsistent (08, 15); header styles split (10); off-grid 2/6/10/14 spacing in components; tab bars end 1px past screen on 8 screens; "You" dot covers stops on 7 screens; Map fill bound to primitive; 07 footnote vs "Next bus full"; no Share trip on 12; filter single-select now; no trip history or stop lookup.

## Questions to Consider
Leaves-when-full honesty; what an account gives a commuter; would anyone guess this is a jeepney app without strings.
