"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { mbRibbonApi } from "@/lib/api/mbRibbonApi";
import { ApiError } from "@/lib/api/types";
import { toast } from "sonner";
import { format } from "date-fns";

interface DailyCount {
  date: string;
  day: string;
  count: number;
}

const chartConfig = {
  count: {
    label: "MB Ribbons",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function MbRibbonsChartWidget() {
  const [chartData, setChartData] = useState<DailyCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);
  const [currentMonth, setCurrentMonth] = useState("");

  useEffect(() => {
    const fetchMbRibbonData = async () => {
      try {
        setIsLoading(true);

        const response = await mbRibbonApi.getMbRibbonChart();

        if (response.success && response.data) {
          const { daily_counts, total_count, month, year } = response.data;

          // Set month display
          setCurrentMonth(`${month} ${year}`);
          setTotalCount(total_count);

          // If no daily counts, set empty array
          if (!daily_counts || daily_counts.length === 0) {
            setChartData([]);
            setPercentageChange(0);
            return;
          }

          // Transform data for chart
          const transformedData: DailyCount[] = daily_counts.map((item) => ({
            date: item.date,
            day: format(new Date(item.date), "MMM dd"),
            count: item.count,
          }));

          setChartData(transformedData);

          // Calculate percentage change (compare recent 7 days with average)
          if (transformedData.length > 0) {
            const avgDaily = total_count / transformedData.length;
            const recentData = transformedData.slice(-7);
            const recentAvg =
              recentData.reduce((sum, d) => sum + d.count, 0) / recentData.length;
            const change =
              avgDaily > 0 ? ((recentAvg - avgDaily) / avgDaily) * 100 : 0;
            setPercentageChange(change);
          }
        }
      } catch (error) {
        console.error("Error fetching MB Ribbon chart data:", error);

        // Silent fail for empty data
        if (error instanceof ApiError) {
          if (
            error.message?.toLowerCase().includes("not found") ||
            error.status === 404
          ) {
            setChartData([]);
            setCurrentMonth(format(new Date(), "MMMM yyyy"));
            return;
          }
        }

        toast.error("Failed to load MB Ribbon statistics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMbRibbonData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MB Ribbons - Current Month</CardTitle>
          <CardDescription>
            Daily MB Ribbon processing statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[250px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0 || totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MB Ribbons - Current Month</CardTitle>
          <CardDescription>
            Daily MB Ribbon processing statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[250px]">
          <p className="text-sm text-muted-foreground">
            No MB Ribbon data available for this month
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>MB Ribbons - Current Month</CardTitle>
        <CardDescription>
          Showing total MB Ribbons processed in {currentMonth}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 6)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="count"
              type="natural"
              fill="var(--color-count)"
              fillOpacity={0.4}
              stroke="var(--color-count)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {percentageChange >= 0 ? (
                <>
                  Trending up by {Math.abs(percentageChange).toFixed(1)}% this
                  week <TrendingUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Trending down by {Math.abs(percentageChange).toFixed(1)}% this
                  week
                </>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Total: {totalCount} MB Ribbons in {currentMonth}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
