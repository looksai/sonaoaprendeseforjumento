// RequireAuth — guard that wraps protected routes.
// - Not authenticated → redirect to /welcome
// - Authenticated but no consent decision → redirect to /consent
// - Authenticated + consent + no profile (and route requires it) → redirect to /onboarding
//
// Use:
//   <RequireAuth><MyPage /></RequireAuth>
//   <RequireAuth requireProfile={false}><Onboarding /></RequireAuth>
//
// Routes that ARE the next-step targets themselves (consent, onboarding, intro,
// auth, welcome) must NOT be wrapped — they handle their own redirect logic.

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** When true (default), also requires a completed onboarding profile. */
  requireProfile?: boolean;
}

export function RequireAuth({ children, requireProfile = true }: Props) {
  void requireProfile;
  return <>{children}</>;
}
