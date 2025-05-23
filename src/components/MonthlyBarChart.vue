<template>
    <div class="chart-container">
      <canvas ref="barChart"></canvas>
    </div>
  </template>
  
  <script>
  import Chart from 'chart.js/auto'; // 'chart.js/auto' を使用すると必要なコンポーネントが自動的に含まれます
  import axios from 'axios'; // API呼び出しのためにaxiosをインストールします
  
  export default {
    name: 'MonthlyBarChart',
    data() {
      return {
        chart: null,
        monthlyData: []
      };
    },
    async mounted() {
      await this.fetchMonthlyData(); //情報を集める
      this.renderChart();　
    },
    methods: {
      async fetchMonthlyData() {
        try {
          const response = await axios.get('http://localhost:8080/api/monthly-data'); // Spring BootのAPIエンドポイント
          this.monthlyData = response.data;
          console.log('Fetched data:', this.monthlyData); // デバッグ用にデータをコンソール出力
        } catch (error) {
          console.error('Error fetching monthly data:', error);
        }
      },
      renderChart() {
        const ctx = this.$refs.barChart.getContext('2d');
  
        // データからラベル（月）と値を取得
        const labels = this.monthlyData.map(item => item.month);
        const values = this.monthlyData.map(item => item.value);
  
        this.chart = new Chart(ctx, {
          type: 'bar', // 棒グラフ
          data: {
            labels: labels, // 横軸のラベル（月）
            datasets: [{
              label: 'データ', // 凡例のタイトル
              data: values, // グラフのデータ
              backgroundColor: 'rgba(75, 192, 192, 0.6)', // 棒の色
              borderColor: 'rgba(75, 192, 192, 1)', // 棒の枠線の色
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false, // コンテナのサイズに合わせて調整
            scales: {
              x: {
                title: {
                  display: true,
                  text: '月' // 横軸のタイトル
                }
              },
              y: {
                beginAtZero: true, // 縦軸の開始点を0にする
                title: {
                  display: false, // 縦軸のタイトルを非表示
                  text: '' // 縦軸のタイトル（空白）
                },
                ticks: {
                  display: false // 縦軸の目盛り値を非表示
                },
                grid: {
                  display: false // 縦軸のグリッド線を非表示
                }
              }
            },
            plugins: {
              legend: {
                display: true // 凡例を表示
              }
            }
          }
        });
      }
    }
  };
  </script>
  
  <style scoped>
  .chart-container {
    width: 80%; /* グラフの幅を調整 */
    height: 400px; /* グラフの高さを調整 */
    margin: 50px auto; /* 中央寄せ */
  }
  </style>