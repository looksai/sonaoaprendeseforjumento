import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/store/useAuth";
import { ConsentProvider } from "@/store/useConsent";
import { ConsentGate } from "@/components/ConsentGate";
import { AppearanceProvider } from "@/store/useAppearance";
import { PersonalChatPanel } from "@/components/PersonalChatPanel";
import { AtmosphericLayer, type AtmosphericMode } from "@/components/AtmosphericLayer";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O caminho que você tentou não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-cta px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-bounce active:scale-95"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0B0F14" },
      { title: "Inglês pra toda vida" },
      {
        name: "description",
        content:
          "Cognitive Spiral Learning Engine: curso de inglês A1→B2 que escuta sua voz, lembra do que você erra e adapta suas próximas lições.",
      },
      { name: "author", content: "CSLE" },
      { property: "og:title", content: "Inglês pra toda vida" },
      {
        property: "og:description",
        content: "Curso A1→B2 com voz, prática de fala e memória adaptativa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Inglês pra toda vida" },
      { name: "description", content: "App mais viciante de linguas" },
      { property: "og:description", content: "App mais viciante de linguas" },
      { name: "twitter:description", content: "App mais viciante de linguas" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/usVP2E0QqGMbemtkvB5LsFLV4GX2/social-images/social-1777159757608-ChatGPT_Image_25_de_abr._de_2026,_01_11_39.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/usVP2E0QqGMbemtkvB5LsFLV4GX2/social-images/social-1777159757608-ChatGPT_Image_25_de_abr._de_2026,_01_11_39.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function getAtmosphericMode(pathname: string): AtmosphericMode {
  if (
    pathname.startsWith("/conversar") ||
    pathname.startsWith("/welcome") ||
    pathname.startsWith("/licao") ||
    pathname.startsWith("/revisar") ||
    pathname.startsWith("/dirigindo") ||
    pathname.startsWith("/legendas") ||
    pathname.startsWith("/series") ||
    pathname.startsWith("/musica")
  ) {
    return "dimmed";
  }
  if (pathname.startsWith("/auth")) {
    return "none";
  }
  return "full";
}

function AtmosphereForRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return <AtmosphericLayer mode={getAtmosphericMode(pathname)} />;
}

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConsentProvider>
          <AppearanceProvider>
            <TooltipProvider>
              {/* Layer 0 — atmospheric image + overlay, fixed, pointer-events none */}
              <AtmosphereForRoute />
              <Sonner position="top-center" />
              <ConsentGate />
              {/* Layer 1 — page content, sits above the atmosphere */}
              <div className="relative" style={{ zIndex: 1 }}>
                <Outlet />
              </div>
              <PersonalChatPanel />
            </TooltipProvider>
          </AppearanceProvider>
        </ConsentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
