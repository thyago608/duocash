import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <span className="font-semibold">DuoCash</span>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="max-w-full break-words text-sm text-muted-foreground">{session?.user?.name}</span>
          <ThemeToggle />
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <main className="min-w-0 flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
