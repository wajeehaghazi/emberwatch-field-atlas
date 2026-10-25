<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- FireWatch data, scoring, hashing and map geometry live in `src/lib/firewatch/`; UI components read only from there so demo data stays centralised and swappable for real feeds.
- Risk scoring is a transparent weighted-logistic prototype (`scoring.ts`); never label it a trained model. Threshold tests sit next to it.
- The app shell (sidebar + command bar) wraps `<Outlet />` in `__root.tsx`; shared selection/filter state comes from `FireWatchProvider`.
