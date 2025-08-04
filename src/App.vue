<template>
  <div id="app" @click="handleUserInteraction" @touchstart="handleUserInteraction">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAudio } from '@/composables/useAudio'

const { unlockAudio, isAudioUnlocked } = useAudio()

let hasUserInteracted = false

const handleUserInteraction = async () => {
  if (hasUserInteracted || isAudioUnlocked.value) return
  
  hasUserInteracted = true
  await unlockAudio()
  console.log('🎯 User interaction detected, audio unlocked')
}

onMounted(() => {
  // Also try to unlock on various events
  const events = ['touchstart', 'touchend', 'click', 'keydown']
  
  const handleAnyInteraction = () => {
    if (!hasUserInteracted) {
      handleUserInteraction()
    }
  }
  
  events.forEach(event => {
    document.addEventListener(event, handleAnyInteraction, { once: true, passive: true })
  })
})
</script>

<style>
#app {
  width: 100%;
  overflow-x: hidden;
  min-height: 100vh;
}
</style>