import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center">
      {/* É esta linha abaixo que faz a mágica: max-w-7xl trava a largura, e o flex centraliza */}
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* O 'children' aqui é a SUA página que já existe, com suas abas */}
        {children}
      </div>
    </div>
  );
}