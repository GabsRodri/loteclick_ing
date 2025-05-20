// app/layout.tsx
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getUser, signOutAction } from "./actions";
import { UserMenu } from "./components/userMenu";
import { ThemeToggle } from "./components/ThemeToggle";
import { OnlineGuard } from "./components/OnlineGuard";

// Definir URL base para metadatos
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

// Establecer metadatos
export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "LoteClick",
  description: "Proyecto para una constructora",
  icons: {
    icon: "/favicon.ico?v=2",
  },
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const user = await getUser();

  return (
    <html lang="es" className={`${geistSans.className} dark`} suppressHydrationWarning>
      <body className="bg-background text-foreground">
      <OnlineGuard>
        <header className="w-full border-b border-primary/60 bg-background shadow-md shadow-primary/10 dark:bg-black dark:border-gray-700">
  <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-y-4">
    {/* Logo + Título */}
    <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
      <img
        src="/favicon.ico"
        alt="Logo"
        className="w-9 h-9 object-contain"
      />
      <Link
        href="/"
        className="text-2xl font-bold text-primary hover:opacity-90 transition-opacity dark:text-gray-100"
      >
        LoteClick
      </Link>
    </div>

    {/* Acciones: usuario o login/registro */}
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center w-full sm:w-auto justify-center sm:justify-end">
      {user ? (
        <>
          <span className="text-sm text-muted-foreground dark:text-gray-100 text-center sm:text-left">
            {user.email}
          </span>
          <UserMenu user={user} signOutAction={signOutAction} />
        </>
      ) : (
        <>
          <Link
            href="/sign-in"
            className="text-primary hover:underline text-sm font-medium dark:text-gray-100"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/sign-up"
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md border border-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm dark:text-gray-100 dark:bg-black dark:border-gray-700 dark:hover:bg-zinc-800"
          >
            Registrarse
          </Link>
        </>
      )}
      <ThemeToggle />
    </div>
  </div>
</header>
        <main className="min-h-screen flex flex-col items-center justify-center px-4">
          {children}
        </main>
        </OnlineGuard>
      </body>
    </html>
  );
}
