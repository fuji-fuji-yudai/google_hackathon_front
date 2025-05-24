<template>
  <div id="app">
    <h1>ロードマップグラフ</h1>
    <MonthlyGraph />
  </div>
</template>

<script>
import MonthlyGraph from './components/Monthlydata.vue'; //コンポーネント名

export default {
  name: 'App',
  components: {
    MonthlyGraph 
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>