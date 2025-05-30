<template>
  <div id="app">
    <h1>ロードマップ</h1> <RoadmapBase /> </div>
</template>

<script>
// インポートするファイル名と、使用するコンポーネント名を 'Roadmapbase' に修正
import RoadmapBase from '../components/RoadmapBase.vue';

export default {
  name: 'RoadmapView',
  components: {
    RoadmapBase 
  }
}
</script>

<style>
/* App.vue のスタイルはそのまま残してもOK */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>