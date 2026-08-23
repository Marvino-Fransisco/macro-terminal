import Image from "next/image";
import Link from "next/link";

const ALT = "Macro Terminal";
const WIDTH = 128;
const HEIGHT = 128;
const DRAGGABLE = false;

export function Logo() {
  return (
    <>
      <Link className="flex items-center justify-center" href={"/"}>
        <Image
          src="/logos/logo-light-transparent.png"
          alt={ALT}
          width={WIDTH}
          height={HEIGHT}
          className="logo-light select-none"
          draggable={DRAGGABLE}
        />
        <Image
          src="/logos/logo-dark-transparent.png"
          alt={ALT}
          width={WIDTH}
          height={HEIGHT}
          className="logo-dark select-none"
          draggable={DRAGGABLE}
        />
      </Link>
    </>
  )
}
