import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { WorkspaceProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "GrowthBrain Local",
  description: "Motor de marketing autónomo para contenido, piezas visuales, leads y WhatsApp."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <WorkspaceProvider>
          <AppShell>{children}</AppShell>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
