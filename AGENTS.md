# Architecture rules
- Resolve the support recipient through the authenticated `get_support_admin_id` RPC, not client reads of protected role rows, so ordinary members can contact support without exposing role data.
- Build admin conversation summaries with `src/lib/chat.ts` and fetch both profiles and the signed-in administrator's messages so new conversations and unread counts share one tested rule.
- Scope message subscriptions to the current account, use unique channel names, and read the selected conversation through a ref so realtime callbacks never target an outdated selection.
