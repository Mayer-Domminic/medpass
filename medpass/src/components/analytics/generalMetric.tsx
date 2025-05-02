import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";

interface GeneralMetricProps {
    title: string;
    value: string;
    trend?: number;
    color: string;
    data: Array<{ date: string; value: number }> | [];
    description?: string;
    onClick?: () => void;
    inverse?: boolean; // indicates if lower values are better
}

const GeneralMetric: React.FC<GeneralMetricProps> = ({
    title,
    value,
    trend,
    color,
    data,
    description,
    onClick,
    inverse = false // Default to false (higher is better)
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Parse the numeric value from the string (removing any % sign)
    const numericValue = parseFloat(value.replace('%', ''));

    // Define status color mapping (both for Tailwind classes and hexadecimal values)
    const statusColors = {
        red: { class: "bg-red-500", hex: "#ef4444" },
        yellow: { class: "bg-yellow-500", hex: "#eab308" },
        green: { class: "bg-green-500", hex: "#22c55e" }
    };

    // Determine which color to use based on the value thresholds
    let statusColorKey: keyof typeof statusColors = "red"; // Default to red

    if (!inverse) {
        // Normal case - higher values are better
        if (numericValue > 75) {
            statusColorKey = "green"; // > 75% is green
        } else if (numericValue >= 60) {
            statusColorKey = "yellow"; // 60-75% is yellow
        }
    } else {
        // Inverse case - lower values are better
        if (numericValue < 60) {
            statusColorKey = "green"; // < 60% is green
        } else if (numericValue <= 75) {
            statusColorKey = "yellow"; // 60-75% is yellow
        }
    }

    // Get the specific color values to use
    const statusColorClass = statusColors[statusColorKey].class;
    const statusColorHex = statusColors[statusColorKey].hex;

    return (
        <div className="relative">
            <Card
                className={`bg-gray-800/50 border-gray-700 transition-all duration-200
            ${isHovered ? `shadow-md shadow-${color}/20 border-${color}/30 scale-[1.01]` : ''}
            ${onClick ? 'cursor-pointer' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={onClick}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                        <CardTitle className="text-sm font-semibold text-gray-300">
                            {title}
                        </CardTitle>
                        {description && (
                            <span
                                className="text-gray-400 cursor-help"
                                onMouseEnter={() => setShowTooltip(true)}
                                onMouseLeave={() => setShowTooltip(false)}
                            >
                                <InfoIcon className="h-4 w-4" />
                            </span>
                        )}
                    </div>
                    {/* Status dot based on value */}
                    <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${statusColorClass}`}></div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col">
                        <div className="text-2xl font-bold text-white">{value}</div>
                        {/* Progress bar that matches status indicator color */}
                        <div
                            className="w-full h-1 mt-4 rounded-full bg-gray-700 overflow-hidden"
                            style={{ opacity: 0.5 }}
                        >
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${numericValue}%`,
                                    backgroundColor: statusColorHex // Using the same color as the status indicator
                                }}
                            ></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Description Tooltip */}
            {description && showTooltip && (
                <div className="absolute z-20 bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg text-sm text-white w-64 top-full left-1/2 transform -translate-x-1/2 mt-1">
                    {description}
                </div>
            )}
        </div>
    );
};

export default GeneralMetric;