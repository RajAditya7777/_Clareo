import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MatchSection from "@/components/MatchSection";
import DeploySection from "@/components/DeploySection";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <MatchSection />
        <DeploySection />
        <Footer />
      </main>
    </>
  );
}
