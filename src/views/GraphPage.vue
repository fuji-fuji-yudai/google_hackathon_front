<template>
    <div class="graph-page">
      <h1>ロードマップ</h1>
      <MonthlyBarChart />
    </div>
  </template>
  
  <script>
  import MonthlyBarChart from '@/components/MonthlyBarChart.vue'; // @はsrcのエイリアス
  
  export default {
    name: 'GraphPage',
    components: {
      MonthlyBarChart
    }
  };
  </script>
  
  <style scoped>
  .graph-page {
    text-align: center;
    padding: 20px;
  }
  h2 {
    color: #333;
    margin-bottom: 30px;
  }
  </style>