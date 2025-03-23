// src/components/analytics/StatCard.js
import React from 'react';
import { Card } from 'react-bootstrap';


/**
 * A reusable stat card component for dashboards
 * 
 * @param {string} title - The title of the stat
 * @param {string|number} value - The value to display
 * @param {React.ComponentType} icon - The icon component to display
 * @param {string} color - The color theme of the card (primary, success, warning, danger)
 * @param {number} percentage - Optional percentage change to display
 * @param {string} footer - Optional footer text
 */
const StatCard = ({ title, value, icon: Icon, color = "primary", percentage, footer }) => {
    return (
        <Card className="stats-card h-100 mb-4">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h6 className="stats-card-title text-muted">{title}</h6>
                        <h2 className="stats-card-value">{value}</h2>
                    </div>
                    <div className={`stats-card-icon bg-${color}`}>
                        <Icon />
                    </div>
                </div>
                {percentage !== undefined && (
                    <div className="stats-card-percentage">
                        <span className={percentage >= 0 ? "text-success" : "text-danger"}>
                            {percentage >= 0 ? `+${percentage}%` : `${percentage}%`}
                        </span>
                        <span className="text-muted ms-2">from last month</span>
                    </div>
                )}
                {footer && (
                    <div className="stats-card-footer text-muted mt-2 pt-2 border-top">
                        {footer}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default StatCard;