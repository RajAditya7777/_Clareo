import React from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  const fullName = session?.user?.name || "Naveen";
  const firstName = fullName.split(" ")[0];

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <AppSidebar userName={fullName} />
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        <ChatInterface firstName={firstName} />
      </main>
    </div>
  );
}
