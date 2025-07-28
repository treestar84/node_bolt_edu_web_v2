<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style>
#app {
  width: 100%;
  overflow-x: hidden;
  min-height: 100vh;
}
</style>