import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const destination = session ? "/chat" : "/login";

  return (
    <nav className="fixed top-0 inset-x-0 h-[100px] flex items-center justify-between px-12 z-[200] pointer-events-none bg-gradient-to-b from-black/80 to-transparent">
      <a
        href="/"
        className="font-serif italic text-[32px] font-normal text-white no-underline tracking-[0.02em] pointer-events-auto"
      >
        Claero
      </a>
      
      <ul className="flex gap-[64px] list-none pointer-events-auto m-0 p-0">
        {["Platform", "Solutions", "Pricing", "About", "Dealer"].map((l) => (
          <li key={l}>
            <a
              href="#"
              className="text-[13px] font-medium tracking-[0.15em] uppercase text-white/60 hover:text-white transition-colors duration-300"
            >
              {l}
            </a>
          </li>
        ))}
      </ul>
      
      <Link
        href={destination}
        className="flex items-center justify-center px-6 py-2.5 bg-white rounded-full text-[11px] font-bold tracking-[0.1em] text-black uppercase cursor-pointer transition-all duration-300 pointer-events-auto hover:bg-white/90 hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
      >
        {session ? "Go to chat" : "Get started"}
      </Link>
    </nav>
  );
}
