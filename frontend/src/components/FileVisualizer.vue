<template>
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-6">
    <h2 class="text-lg font-medium mb-4">File Analytics</h2>
    
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-google-blue"></div>
    </div>
    
    <div v-else-if="!hasData" class="text-center py-12">
      <p class="text-gray-500 dark:text-gray-400">No file data available for visualization.</p>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 class="text-sm font-medium mb-2">File Types</h3>
        <div class="h-64">
          <Doughnut 
            :chart-data="chartData"
            :chart-options="chartOptions" 
          />
        </div>
      </div>
      
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 class="text-sm font-medium mb-2">Modified Timeline</h3>
        <div class="h-64">
          <Line 
            :chart-data="lineData"
            :chart-options="chartOptions" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'vue-chartjs';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

export default {
  components: {
    Doughnut,
    Line
  },
  props: {
    files: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      loading: false,
      colors: [
        '#4285f4', // Google blue
        '#ea4335', // Google red
        '#fbbc05', // Google yellow
        '#34a853', // Google green
        '#9c27b0', // Purple
        '#3f51b5', // Indigo
      ],
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
      }
    }
  },
  computed: {
    hasData() {
      return this.files && this.files.length > 0;
    },
    chartData() {
      if (!this.hasData) return { labels: [], datasets: [{ data: [] }] };
      
      const typeCounts = {};
      
      this.files.forEach(file => {
        let type = 'Unknown';
        if (file.mimeType) {
          type = file.mimeType.split('/')[1] || file.mimeType.split('/')[0];
          // Prettify some common types
          if (type === 'vnd.google-apps.folder') type = 'Folder';
          if (type === 'vnd.google-apps.document') type = 'Document';
          if (type === 'vnd.google-apps.spreadsheet') type = 'Spreadsheet';
        }
        
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      const labels = Object.keys(typeCounts);
      const data = labels.map(label => typeCounts[label]);
      
      return {
        labels,
        datasets: [{
          data,
          backgroundColor: this.colors.slice(0, labels.length),
          borderWidth: 0
        }]
      };
    },
    lineData() {
      if (!this.hasData) return { labels: [], datasets: [{ data: [] }] };
      
      // Group files by month
      const monthCounts = {};
      
      this.files.forEach(file => {
        if (file.modifiedTime) {
          const date = new Date(file.modifiedTime);
          const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
          monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
        }
      });
      
      // Sort chronologically
      const sortedMonths = Object.keys(monthCounts).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
      });
      
      return {
        labels: sortedMonths,
        datasets: [{
          label: 'Files Modified',
          data: sortedMonths.map(month => monthCounts[month]),
          borderColor: this.colors[0],
          backgroundColor: `${this.colors[0]}33`,
          fill: true,
          tension: 0.2
        }]
      };
    }
  }
}
</script>
