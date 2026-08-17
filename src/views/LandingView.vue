<script setup>
import NavBar from '../components/landing/NavBar.vue'
import HeroSection from '../components/landing/HeroSection.vue'
import AboutSection from '../components/landing/AboutSection.vue'
import FocusAreasSection from '../components/landing/FocusAreasSection.vue'
import EventsSection from '../components/landing/EventsSection.vue'
import NewsSection from '../components/landing/NewsSection.vue'
import ContactSection from '../components/landing/ContactSection.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
</script>

<template>
  <div class="min-h-screen bg-paper">
    <NavBar />
    <HeroSection />
    <AboutSection />
    <FocusAreasSection />
    <EventsSection />
    <NewsSection />
    <ContactSection />
    <SiteFooter />
  </div>
</template>
