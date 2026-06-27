/**
 * Top-level patient portal components rendered by app routes. Kept separate
 * from `api.ts` so non-UI consumers don't transitively load client components.
 */

export { HomeScreen } from "./components/HomeScreen";
export { RecordScreen } from "./components/RecordScreen";
export { MedicationsScreen } from "./components/MedicationsScreen";
export { TestsScreen } from "./components/TestsScreen";
export { VisitsScreen } from "./components/VisitsScreen";
export { ProfileScreen } from "./components/ProfileScreen";
export { NotificationsScreen } from "./components/NotificationsScreen";
