<template>
  <div class="graph-container">
    <Bar
      v-if="chartData.labels.length > 0"
      :options="chartOptions"
      :data="chartData"
    />
    <p v-else>データを読み込み中...</p>
  </div>
</template>

<script>
import { Bar } from 'vue-chart-3';
import { Chart, registerables } from 'chart.js';
import axios from 'axios';

Chart.register(...registerables);

export default {
  name: 'MonthlyGraph', 
  components: { Bar },
  data() {
    return {
      chartData: {
        labels: [],
        datasets: [
          {
            label: 'データ',
            backgroundColor: '#42A5F5',
            data: [],
          },
        ],
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: -100,
            max: 100,
            title: {
              display: true,
              text: '値 (%)'
            },
            ticks: {
              stepSize: 20
            },
            grid: {
                display: true,
                drawOnChartArea: true,
                drawTicks: true,
                color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            title: {
              display: true,
              text: '月'
            },
            grid: {
                display: true,
                drawOnChartArea: true,
                drawTicks: true,
                color: 'rgba(0,0,0,0.1)'
            }
          }
        },
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null && context.parsed.y !== 0) {
                  label += context.parsed.y + '%';
                } else if (context.parsed.y === 0) {
                  label += '0%';
                }
                return label;
              }
            }
          }
        }
      },
    };
  },
  async mounted() {
    await this.fetchGraphData();
  },
  methods: {
    async fetchGraphData() {
      try {
        // ★Spring BootのAPIエンドポイントパスを正確に指定
        const response = await axios.get('http://localhost:8081/api/monthly-data/graph');
        const data = response.data;

        this.chartData.labels = data.map(item => item.label);
        this.chartData.datasets[0].data = data.map(item => item.value !== null ? item.value : 0);

      } catch (error) {
        console.error('グラフデータの取得中にエラーが発生しました:', error);
        this.chartData.labels = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
        this.chartData.datasets[0].data = Array(12).fill(0);
      }
    },
  },
};
</script>

<style scoped>
.graph-container {
  width: 80%;
  max-width: 900px;
  height: 500px;
  margin: 0 auto;
  border: 1px solid #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
  background-color: white;
}
</style>