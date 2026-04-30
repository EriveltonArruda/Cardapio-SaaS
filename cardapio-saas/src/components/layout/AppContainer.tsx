import { ReactNode } from "react";

interface AppContainerProps {
  children: ReactNode;
}

export function AppContainer({ children }: AppContainerProps) {
  return (
    <div className="min-h-screen bg-neutral-200 flex justify-center">
      {/* TRAVADO EM 480px (Modo App Mobile) 
         - No celular: ocupa 100%.
         - No PC: fica centralizado com largura de celular.
      */}
      <div className="w-full max-w-[480px] min-h-screen bg-background shadow-2xl">
        {children}
      </div>
    </div>
  );
}