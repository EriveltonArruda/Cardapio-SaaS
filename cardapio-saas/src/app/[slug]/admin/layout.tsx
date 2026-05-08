import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    // Trocado bg-[#F8FAFC] por bg-background para respeitar o tema
    <div className="min-h-screen bg-background flex justify-center transition-colors duration-300">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}