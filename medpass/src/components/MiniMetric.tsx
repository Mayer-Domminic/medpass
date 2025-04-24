import React, { useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, YAxis, Tooltip } from "recharts";

interface MiniMetricProps {
  title: string;
  value: string;
  trend: number;
  color: string;
  data: Array<{ date: string; value: number }>;
  onClick?: () => void;
}

const MiniMetric: React.FC<MiniMetricProps> = ({
  title,
  value,
  trend,
  color,
  data,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format the trend as a percentage with a sign
  const formattedTrend = trend >= 0 
    ? `+${trend.toFixed(1)}%` 
    : `${trend.toFixed(1)}%`;
  
  // Determine styling based on trend direction
  const trendColor = trend >= 0 ? "text-green-500" : "text-red-500";
  const TrendIcon = trend >= 0 ? ArrowUpIcon : ArrowDownIcon;
  
  // Optimize data points for visualization
  const optimizedData = useMemo(() => {
    // If we have a small dataset, use all points
    if (data.length <= 15) return data;
    
    // For larger datasets, identify and keep only significant points
    const simplified = [];
    const threshold = 0.1; // Adjust threshold for sensitivity to peaks/valleys
    
    // Always include first and last points
    simplified.push(data[0]);
    
    // Find local maxima and minima
    for (let i = 1; i < data.length - 1; i++) {
      const prev = data[i-1].value;
      const curr = data[i].value;
      const next = data[i+1].value;
      
      // Check if current point is a peak or valley
      const isPeak = curr > prev && curr > next;
      const isValley = curr < prev && curr < next;
      
      // Check if the change is significant enough
      const diffPrev = Math.abs(curr - prev);
      const diffNext = Math.abs(curr - next);
      const isSignificant = diffPrev > threshold || diffNext > threshold;
      
      // Keep the point if it's a significant peak or valley
      if ((isPeak || isValley) && isSignificant) {
        simplified.push(data[i]);
      }
      
      // Also include some points periodically to maintain shape
      if (i % Math.ceil(data.length / 10) === 0) {
        simplified.push(data[i]);
      }
    }
    
    simplified.push(data[data.length - 1]);
    
    // Remove duplicates that might have been added
    return simplified.filter((item, index, self) => 
      index === self.findIndex(t => t.date === item.date)
    );
  }, [data]);

  // Calculate domain range for Y axis to enhance visual variations
  const enhanceDomain = useMemo(() => {
    if (data.length === 0) return [0, 1]; // Default fallback
    
    // Find min and max values
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate the range and center
    const range = max - min;
    const center = (max + min) / 2;
    
    // Make the visual range narrower to amplify changes
    // Adjust amplification factor (1.5 means 50% narrower range)
    const amplificationFactor = 2.5;
    const visualRange = range / amplificationFactor;
    
    // Create a domain centered on the data's center, but with amplified variations
    return [
      Math.max(0, center - visualRange), // Don't go below 0 for most metrics
      center + visualRange
    ];
  }, [data]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-2 rounded shadow-lg text-xs">
          <p className="text-white font-medium">{payload[0].payload.date}</p>
          <p className="text-white">
            Value: <span style={{ color }}>{payload[0].value.toFixed(2)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      className={`bg-gray-800/50 border-gray-700 transition-all duration-200 ${
        isHovered ? 'shadow-md shadow-' + color.replace('#', '') + '/30 border-' + color.replace('#', '') + '/40 scale-[1.02]' : ''
      } ${onClick ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-300">{title}</p>
            <div className="flex items-center gap-1">
              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>
                {formattedTrend}
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={optimizedData}>
                <YAxis 
                  domain={enhanceDomain}
                  hide={true}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: color, strokeWidth: 1, strokeOpacity: 0.3 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2}
                  dot={{ 
                    r: isHovered ? 2 : 1.5, 
                    fill: color, 
                    stroke: color 
                  }}
                  activeDot={{ 
                    r: isHovered ? 4 : 3, 
                    fill: color, 
                    stroke: "white", 
                    strokeWidth: 1.5 
                  }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MiniMetric;