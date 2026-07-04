import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function Layout({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <main className="relative z-10 flex-1 pt-16 lg:pt-[68px]">{children}</main>
      {footer && <Footer />}
    </div>
  );
}
