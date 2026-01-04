import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import ChartContainer from './ChartContainer';

const UserGrowthAreaChart = ({ data = [] }) => {
    const chartData = data && data.length > 0 ? data : [];

    return (
        <ChartContainer title="User Growth Over Time">
            <div style={{ width: '100%', height: 300 }}>
                {chartData.length > 0 ? (
                    <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0C8EF4" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#0C8EF4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="users"
                                name="New Users"
                                stroke="#0C8EF4"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="admin-dashboard__chart-empty">No data available</div>
                )}
            </div>
        </ChartContainer>
    );
};

export default UserGrowthAreaChart;
