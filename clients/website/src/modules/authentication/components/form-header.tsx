export function FormHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 text-center">
      {children}
    </div>
  )
}
