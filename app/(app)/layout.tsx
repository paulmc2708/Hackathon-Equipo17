import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[920px] px-8 py-14">{children}</div>
      </main>
    </div>
  );
}
