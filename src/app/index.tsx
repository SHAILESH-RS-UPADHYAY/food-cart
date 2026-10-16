import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { useSession } from '@/store/session';
import { useSettings } from '@/store/settings';

/** Front door: onboarding, then login, then the right home for the role. */
export default function Index() {
  const [hydrated, setHydrated] = useState(useSettings.persist.hasHydrated());
  useEffect(() => useSettings.persist.onFinishHydration(() => setHydrated(true)), []);
  const onboarded = useSettings((s) => s.onboarded);
  const user = useSession((s) => s.user);

  if (!hydrated) return null;
  if (!onboarded) return <Redirect href="/onboarding" />;
  if (!user) return <Redirect href="/login" />;
  if (user.role === 'staff') return <Redirect href="/staff" />;
  if (user.role === 'admin') return <Redirect href="/admin" />;
  if (!user.name) return <Redirect href="/welcome" />;
  return <Redirect href="/home" />;
}
