// app/protected/layout.tsx
import { getRol } from "@/app/actions";
import ClientProtectedLayout from "@/app/components/ProtectedLayout";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const rol = await getRol();

  return <ClientProtectedLayout rol={rol}>{children}</ClientProtectedLayout>;
}