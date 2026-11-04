import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PaletteToggle } from "@/components/palette-toggle";
import { logoutAction } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
        <span className="font-semibold">DuoCash</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{session?.user?.name}</span>
          <PaletteToggle />
          <ThemeToggle />
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
