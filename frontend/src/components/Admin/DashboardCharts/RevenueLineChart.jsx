import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import ChartContainer from './ChartContainer';

const RevenueLineChart = ({ data = [] }) => {
    // Use real data if available, otherwise show empty state
    const chartData = data && data.length > 0 ? data : [];

    return (
        <ChartContainer title="Monthly Revenue Growth">
            <div style={{ width: '100%', height: 300 }}>
                {chartData.length > 0 ? (
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value) => `₹${value / 100000}L`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#0C8EF4"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#0C8EF4', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="admin-dashboard__chart-empty">No data available</div>
                )}
            </div>
        </ChartContainer>
    );
};

export default RevenueLineChart;
