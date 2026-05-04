import { Redirect } from 'expo-router';

/** Tab stack anchor: actual entry is modal routes under /calls/[roomId] or /calls/answer */
export default function CallsTabIndex() {
  return <Redirect href="/(app)/home" />;
}
