import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import ChartContainer from './ChartContainer';

const InvestmentsPayoutsBarChart = ({ data = [] }) => {
    const chartData = data && data.length > 0 ? data : [];

    return (
        <ChartContainer title="Investments vs Payouts">
            <div style={{ width: '100%', height: 300 }}>
                {chartData.length > 0 ? (
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                                formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Bar dataKey="investments" name="Investments" fill="#0C8EF4" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="payouts" name="Payouts" fill="#9333ea" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="admin-dashboard__chart-empty">No data available</div>
                )}
            </div>
        </ChartContainer>
    );
};

export default InvestmentsPayoutsBarChart;
