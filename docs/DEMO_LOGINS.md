# Demo logins and video walkthrough

Demo build (no Supabase `.env`). Everything runs in the browser and syncs live between windows
of the **same Chrome profile** (normal windows, not incognito). Each window keeps its own login.

Start the site: `npx expo export -p web` then `npx serve -s dist -l 8093`, open http://localhost:8093

## Logins

| Who | Where | Login | Password |
|---|---|---|---|
| Student | http://localhost:8093 | any 10-digit phone, or any email | OTP **123456** |
| HR Cafe staff | http://localhost:8093/staff/login | hrcafe@foodcart.test | HRcafe#4821 |
| Creative Food staff | same | creativefood@foodcart.test | Creative#7316 |
| Books n Cooks staff | same | booksncooks@foodcart.test | Books#5194 |
| TJ staff | same | tj@foodcart.test | TJstall#2648 |
| La Pino'z Pizza staff | same | lapinoz@foodcart.test | Lapinoz#9073 |
| Corner Cafe staff | same | cornercafe@foodcart.test | Corner#3517 |
| Food Republic staff | same | foodrepublic@foodcart.test | Republic#6402 |
| Food Cart HQ (developers) | same | hq@foodcart.test | FoodCartHQ#2026 |

On the team sign-in page, "Demo logins for the walkthrough" lists these; tapping a row fills the form.

## What the security demo shows
- One login per stall. A stall login only ever opens its own stall: orders, menu, prices, deals.
- Wrong password: "Email or password is wrong. 4 tries left." The fifth miss locks that login for 30 s
  (even the right password is refused until then). The message never says which half was wrong.
- Signed in as HR Cafe, open http://localhost:8093/staff?stall=lapinoz : "Not your counter."
- Signed in as staff, open http://localhost:8093/admin : "HQ is team only."
- HQ, Users tab: every team account and the one stall it runs.
- Live backend: the same rules run in Postgres (`is_staff_of`, RLS, security-definer functions),
  covered by `npm test`.

## Video script (about 3 minutes)
1. Window 1 (student) and window 2 (staff) side by side: Win+Left / Win+Right.
2. Window 2: team sign-in, HR Cafe login, Sign in. The console opens on HR Cafe only.
   If a yellow "New-order sound is off" bar shows (after a page refresh), tap it once.
3. Window 1: onboarding (or Skip), phone, code 123456, name, then HR Cafe, add two dishes,
   cart, Cash on pickup, slide to order. The celebration plays.
4. Window 2: the order chime plays, "New order #0xx from <name>" pops up, the card is outlined in New.
   Walk-up orders from the counter appear in Cooking on their own; only online orders land in New.
5. Window 2: Accept. Window 1 changes to "The chef said yes", then "Your food is cooking".
6. Window 2: Mark ready. Window 1 plays the ready sound: "Ready at the counter", pickup code and QR.
7. Window 2: Handed over. Window 1: "Enjoy your meal!"
8. Staff menu: Menu tab, Add a dish (name, price, photo), or tap a price to change it.
   Window 1 shows it on the HR Cafe page straight away.
9. Security: sign out, wrong password twice, then the URL checks above.
10. Window 3: sign in as HQ for every stall, live orders, menus, deals and users.

Reset for a clean take: HQ, System, Reset demo data (or student Profile, Reset demo data).
Everyone stays signed in; orders, deals and menu edits go back to the start.
