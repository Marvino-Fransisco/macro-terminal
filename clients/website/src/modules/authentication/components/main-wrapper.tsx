export function MainWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="px-6 pt-64 gap-9 flex flex-col sm:py-0 sm:px-12 xl:px-40">
      {children}
    </main>
  );
}
