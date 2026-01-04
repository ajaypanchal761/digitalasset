import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import ChartContainer from './ChartContainer';

const COLORS = ['#0C8EF4', '#94a3b8', '#10b981', '#f59e0b', '#ef4444'];

const PropertyStatusDonutChart = ({ data = [] }) => {
    const chartData = data && data.length > 0 ? data : [];

    return (
        <ChartContainer title="Property Status Distribution">
            <div style={{ width: '100%', height: 300 }}>
                {chartData.length > 0 ? (
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="admin-dashboard__chart-empty">No data available</div>
                )}
            </div>
        </ChartContainer>
    );
};

export default PropertyStatusDonutChart;
