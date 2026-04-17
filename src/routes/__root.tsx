import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
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
      { title: "LLM Perception Tracker" },
      { name: "description", content: "Track whether your brand positioning shows up in LLM outputs. Based on Ulli Applebaum's brand association framework." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "LLM Perception Tracker" },
      { name: "twitter:title", content: "LLM Perception Tracker" },
      { property: "og:description", content: "Track whether your brand positioning shows up in LLM outputs. Based on Ulli Applebaum's brand association framework." },
      { name: "twitter:description", content: "Track whether your brand positioning shows up in LLM outputs. Based on Ulli Applebaum's brand association framework." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2c52ad9b-1b8a-401f-9b31-e0dcb974f267/id-preview-f122b2a6--d6e8f4a1-7e2f-4372-b50e-d7792ba828b7.lovable.app-1776456382697.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2c52ad9b-1b8a-401f-9b31-e0dcb974f267/id-preview-f122b2a6--d6e8f4a1-7e2f-4372-b50e-d7792ba828b7.lovable.app-1776456382697.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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

function RootComponent() {
  return <Outlet />;
}
