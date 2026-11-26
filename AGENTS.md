# Architecture rules
- Resolve the support recipient through the authenticated `get_support_admin_id` RPC, not client reads of protected role rows, so ordinary members can contact support without exposing role data.
- Build admin conversation summaries with `src/lib/chat.ts` and fetch both profiles and the signed-in administrator's messages so new conversations and unread counts share one tested rule.
- Scope message subscriptions to the current account, use unique channel names, and read the selected conversation through a ref so realtime callbacks never target an outdated selection.
- Use manifest-only installation for home-screen support; do not introduce app-shell service workers or offline caches without an explicit offline request, so preview, authentication, and current content remain network-driven.
