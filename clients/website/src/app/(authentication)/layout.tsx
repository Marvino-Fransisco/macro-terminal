import { Logo } from "@/components/shared/logo";
import { VisualImageView } from "@/modules/authentication/views/visual-image-view";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1">
      <div className="absolute top-0 left-0">
        <Logo />
      </div>
      <div className="flex flex-col flex-1 sm:min-w-120 md:justify-center md:w-[50vw]">
        {children}
      </div>
      <div className="hidden md:block md:w-[50vw] bg-gray-500">
        <VisualImageView />
      </div>
    </div>
  )
}
