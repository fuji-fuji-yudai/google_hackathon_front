<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <img src="https://www.myinstants.com/media/instants_images/nakayama-kinnikun-power.jpg" alt="kinniku logo">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'HomeView',
  components: {
    HelloWorld
  }
}
</script>
