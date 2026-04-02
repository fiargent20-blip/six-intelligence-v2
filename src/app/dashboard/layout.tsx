import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-black text-white print:block print:h-auto print:overflow-visible print:bg-white print:text-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative print:block print:overflow-visible">
        {children}
      </main>
    </div>
  );
}
