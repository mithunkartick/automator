import NavBar from "@/components/global/navbar";
import { GeminiEff } from "@/components/ui/aceternity/ggl-gemini";
import Image from "next/image";

export default function Home() {
  return (
      <main>
        <NavBar/>
        <GeminiEff/>
        <section className="h-screen w-full bg-neutral-950 rounded-md !overflow-visible relative flex flex-col items-center antialiased">
          <div className="max-w-4xl mx-auto p-4 relative z-10 flex items-center justify-center flex-col">
            
          </div>
        </section>
      </main>
  );
}
