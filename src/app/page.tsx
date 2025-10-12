import NavBar from "@/components/global/navbar";
import { GeminiEff } from "@/components/ui/aceternity/ggl-gemini";
import { GlowingEffectDemo } from "@/components/ui/aceternity/glow";
import { FeaturesSectionDemo } from "@/components/ui/aceternity/bento-grid";
import Image from "next/image";

export default function Home() {
  return (
      <main>
        <NavBar/>
        <GeminiEff/>
        <FeaturesSectionDemo/>
      </main>
  );
}
