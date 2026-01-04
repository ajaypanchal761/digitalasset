import React from 'react';

const ChartContainer = ({ title, children, className = '' }) => {
    return (
        <div className={`admin-dashboard__chart-card ${className}`}>
            <div className="admin-dashboard__chart-header">
                <h3 className="admin-dashboard__chart-title">{title}</h3>
            </div>
            <div className="admin-dashboard__chart-body">
                {children}
            </div>
        </div>
    );
};

export default ChartContainer;
