import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import Featured from "@/components/Featured";
import HowItWorks from "@/components/HowItWorks";
import BusinessCTA from "@/components/BusinessCTA";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <Categories />
      <Featured />
      <HowItWorks />
      <BusinessCTA />
      <Footer />
    </main>
  );
}
