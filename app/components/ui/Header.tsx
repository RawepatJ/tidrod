"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="flex h-[56px] rounded-full py-4 my-4 mx-4 backdrop-blur-none bg-neutral-50 shadow-md shrink-0 z-50">
      <div className="flex justify-between items-center w-full">
        {/* Logo */}
        <div>
          <Link href="/" className="text-xl font-bold m-auto mx-10">
          TidRod
        </Link>
        </div>

        {/* Navigation */}
        <nav className="flex gap-10 mx-10">
          <Link href="/" className="hover:text-blue-500">
            Home
          </Link>
          <Link href="/about" className="hover:text-blue-500">
            About
          </Link>
          <Link href="/contact" className="hover:text-blue-500">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
