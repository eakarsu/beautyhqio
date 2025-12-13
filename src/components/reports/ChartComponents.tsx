"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Simple bar chart component (no external dependencies)
interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarChartData[];
  title: string;
  maxValue?: number;
  showValues?: boolean;
  horizontal?: boolean;
}

export function SimpleBarChart({
  data,
  title,
  maxValue,
  showValues = true,
  horizontal = false,
}: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  if (horizontal) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  {showValues && (
                    <span className="font-medium">{item.value.toLocaleString()}</span>
                  )}
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(item.value / max) * 100}%`,
                      backgroundColor: item.color || "#E91E63",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-48 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="relative w-full flex items-end justify-center h-40">
                <div
                  className="w-8 rounded-t transition-all"
                  style={{
                    height: `${(item.value / max) * 100}%`,
                    backgroundColor: item.color || "#E91E63",
                  }}
                />
                {showValues && (
                  <span className="absolute -top-5 text-xs font-medium">
                    {item.value}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-2 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Donut/Pie chart component
interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  title: string;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, title, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* SVG Donut */}
          <div className="relative w-40 h-40">
            <svg viewBox="-1 -1 2 2" className="transform -rotate-90">
              {data.map((item, index) => {
                const percent = item.value / total;
                const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                cumulativePercent += percent;
                const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                const largeArcFlag = percent > 0.5 ? 1 : 0;

                const pathData = [
                  `M ${startX} ${startY}`,
                  `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                  `L 0 0`,
                ].join(" ");

                return (
                  <path
                    key={index}
                    d={pathData}
                    fill={item.color}
                    stroke="white"
                    strokeWidth="0.02"
                  />
                );
              })}
            </svg>
            {/* Center hole */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center">
                {centerValue && (
                  <span className="text-xl font-bold">{centerValue}</span>
                )}
                {centerLabel && (
                  <span className="text-xs text-muted-foreground">{centerLabel}</span>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.value}</span>
                  <Badge variant="secondary" className="text-xs">
                    {((item.value / total) * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Line/Area trend chart
interface TrendData {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: TrendData[];
  title: string;
  color?: string;
  showArea?: boolean;
}

export function TrendChart({
  data,
  title,
  color = "#E91E63",
  showArea = true,
}: TrendChartProps) {
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;

  const points = data.map((item, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - ((item.value - min) / range) * 80 - 10,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-40 relative">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="0.5"
              />
            ))}

            {/* Area fill */}
            {showArea && (
              <path d={areaPath} fill={color} fillOpacity="0.1" />
            )}

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />

            {/* Points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="1.5"
                fill={color}
                stroke="white"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            {data.filter((_, i) => i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0).map((item, i) => (
              <span key={i}>{item.label}</span>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="flex justify-between mt-4 pt-4 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Min: </span>
            <span className="font-medium">{min.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Max: </span>
            <span className="font-medium">{max.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg: </span>
            <span className="font-medium">
              {Math.round(data.reduce((s, d) => s + d.value, 0) / data.length).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Comparison bar chart
interface ComparisonData {
  label: string;
  current: number;
  previous: number;
}

interface ComparisonChartProps {
  data: ComparisonData[];
  title: string;
  currentLabel?: string;
  previousLabel?: string;
}

export function ComparisonChart({
  data,
  title,
  currentLabel = "Current",
  previousLabel = "Previous",
}: ComparisonChartProps) {
  const max = Math.max(...data.flatMap((d) => [d.current, d.previous]));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-rose-500" />
              {currentLabel}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-300" />
              {previousLabel}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.label}</span>
                <span className="font-medium">
                  {item.current.toLocaleString()}
                  <span className="text-muted-foreground ml-1">
                    ({item.previous.toLocaleString()})
                  </span>
                </span>
              </div>
              <div className="flex gap-1">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-300 rounded-full"
                    style={{ width: `${(item.previous / max) * 100}%` }}
                  />
                </div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(item.current / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
