<script setup>
import NavBar from '../components/landing/NavBar.vue'
import HeroSection from '../components/landing/HeroSection.vue'
import AboutSection from '../components/landing/AboutSection.vue'
import FocusAreasSection from '../components/landing/FocusAreasSection.vue'
import EventsSection from '../components/landing/EventsSection.vue'
import CalendarioOficialSection from '../components/landing/CalendarioOficialSection.vue'
import ReservaPublicaSection from '../components/landing/ReservaPublicaSection.vue'
import RankingSection from '../components/landing/RankingSection.vue'
import EstadisticasMedallistasSection from '../components/landing/EstadisticasMedallistasSection.vue'
import BuscadorDeportistasSection from '../components/landing/BuscadorDeportistasSection.vue'
import NewsSection from '../components/landing/NewsSection.vue'
import ContactSection from '../components/landing/ContactSection.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
</script>

<template>
  <div class="min-h-screen bg-paper">
    <NavBar />
    <HeroSection />
    <ReservaPublicaSection />
    <EventsSection />
    <CalendarioOficialSection />
    <RankingSection />
    <EstadisticasMedallistasSection />
    <BuscadorDeportistasSection />
    <AboutSection />
    <FocusAreasSection />
    <NewsSection />
    <ContactSection />
    <SiteFooter />
  </div>
</template>
