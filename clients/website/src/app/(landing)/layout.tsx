import { LandingNavbar } from "@/components/layout/navbar/landing-navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingNavbar className="mt-4" />
      <div className="w-full mx-auto px-4 max-w-7xl">
        {children}
      </div>
    </>
  )
}
