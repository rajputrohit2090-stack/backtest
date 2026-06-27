# Application Shell and Dashboard

The web app now includes a responsive SaaS application shell using the existing authentication flow. Authenticated users land on `/dashboard`; unauthenticated users are redirected to `/login`.

## Included UI

- Desktop shell with top navigation, left sidebar, main content, and collapsible right insights panel.
- Mobile shell with hamburger drawer and bottom navigation.
- Global search UI for strategies, reports, journal entries, and backtests. Results are intentionally UI-only until backend search exists.
- Notification center with mark/clear behavior represented in local UI state.
- Theme, sidebar, right panel, selected workspace, and user preference state persisted in `localStorage`.
- Dashboard widgets with clearly marked mock content for metrics, recent activity, recent strategies, recent backtests, pinned strategies, and quick actions.
- Placeholder pages for the requested product areas with breadcrumbs and empty states.
- Reusable UI primitives: Button, Card, Modal, Drawer, Dropdown, Tabs, DataTable, SearchInput, Toast, LoadingSpinner, EmptyState, and ConfirmationDialog.

## Scope boundaries

No strategy-builder, AI, backtesting, replay, payment, MT5, Python engine, or business-logic implementation was added.
