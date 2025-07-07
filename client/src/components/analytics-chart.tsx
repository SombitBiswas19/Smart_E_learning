import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ChartData {
  name?: string;
  date?: string;
  value?: number;
  activeUsers?: number;
  color?: string;
}

interface AnalyticsChartProps {
  data: ChartData[];
  type: "line" | "doughnut" | "bar";
  dataKey: string;
  xAxisKey?: string;
  title?: string;
  height?: number;
}

export default function AnalyticsChart({ 
  data, 
  type, 
  dataKey, 
  xAxisKey, 
  title,
  height = 300 
}: AnalyticsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;

    // Dynamically import Chart.js to avoid SSR issues
    import('chart.js/auto').then(({ default: Chart }) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      let chartConfig: any = {
        type,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: type === 'doughnut',
              position: 'bottom' as const,
              labels: {
                usePointStyle: true,
                padding: 20,
              },
            },
            title: {
              display: !!title,
              text: title,
            },
          },
        },
      };

      if (type === 'line') {
        chartConfig.data = {
          labels: data.map(item => item[xAxisKey || 'date'] || ''),
          datasets: [{
            label: 'Active Users',
            data: data.map(item => item[dataKey]),
            borderColor: 'hsl(207, 90%, 54%)',
            backgroundColor: 'hsla(207, 90%, 54%, 0.1)',
            tension: 0.4,
            fill: true,
          }],
        };
        chartConfig.options.scales = {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
          },
        };
      } else if (type === 'doughnut') {
        chartConfig.data = {
          labels: data.map(item => item.name || ''),
          datasets: [{
            data: data.map(item => item[dataKey]),
            backgroundColor: data.map(item => item.color || '#2563EB'),
            borderWidth: 0,
          }],
        };
      } else if (type === 'bar') {
        chartConfig.data = {
          labels: data.map(item => item[xAxisKey || 'name'] || ''),
          datasets: [{
            label: dataKey,
            data: data.map(item => item[dataKey]),
            backgroundColor: 'hsla(207, 90%, 54%, 0.8)',
            borderColor: 'hsl(207, 90%, 54%)',
            borderWidth: 1,
          }],
        };
        chartConfig.options.scales = {
          y: {
            beginAtZero: true,
          },
        };
      }

      chartRef.current = new Chart(ctx, chartConfig);
    }).catch(error => {
      console.error('Failed to load Chart.js:', error);
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, type, dataKey, xAxisKey, title]);

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500 dark:text-gray-400"
        style={{ height: `${height}px` }}
      >
        No data available
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }} className="relative">
      <canvas
        ref={canvasRef}
        style={{ maxHeight: `${height}px` }}
        className="w-full h-full"
      />
    </div>
  );
}
