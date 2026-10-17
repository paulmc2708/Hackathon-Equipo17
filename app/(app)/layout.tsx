import { Sidebar } from "@/components/Sidebar";
import { Puerta } from "@/components/Puerta";
import { ChatAgente } from "@/components/ChatAgente";
import { AnalisisAutomatico } from "@/components/AnalisisAutomatico";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <span className="mancha left-[10%] top-[-10%] size-[520px] bg-c-azul" />
        <span className="mancha right-[-8%] top-[20%] size-[460px] bg-c-magenta [animation-delay:-9s]" />
        <span className="mancha bottom-[-15%] left-[35%] size-[540px] bg-c-aqua [animation-delay:-17s]" />
      </div>
      <Puerta>
        <Sidebar />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[920px] px-4 pt-20 pb-24 md:px-8 md:py-14 md:pb-24">{children}</div>
        </main>
        <ChatAgente />
        <AnalisisAutomatico />
      </Puerta>
    </div>
  );
}
