'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: string; // Make icon optional for backward compatibility
  description?: string;
}

export default function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-center transition-all duration-300 hover:bg-white/10">
      <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">{title}</h3>
      <div className="flex items-baseline justify-center space-x-1">
        <p className="text-xl font-bold text-white">{value}</p>
        {description && (
          <p className="text-sm text-forest-300 font-medium">{description}</p>
        )}
      </div>
    </div>
  );
}
