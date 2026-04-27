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

import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useConsent } from "@/store/useConsent";
import { useProgress } from "@/store/useProgress";

interface Props {
  children: ReactNode;
  /** When true (default), also requires a completed onboarding profile. */
  requireProfile?: boolean;
}

export function RequireAuth({ children, requireProfile = true }: Props) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { decided } = useConsent();
  const { profile } = useProgress();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/welcome" });
      return;
    }
    if (!decided) {
      navigate({ to: "/consent" });
      return;
    }
    if (requireProfile && !profile) {
      navigate({ to: "/onboarding" });
    }
  }, [decided, loading, navigate, profile, requireProfile, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !decided || (requireProfile && !profile)) return null;

  return <>{children}</>;
}
