'use client';

import Link from 'next/link';

export default function MetricCard({ title, value, icon, color, link }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    green: 'bg-green-50 text-green-900 border-green-200',
    red: 'bg-red-50 text-red-900 border-red-200',
    orange: 'bg-orange-50 text-orange-900 border-orange-200',
    yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    orange: 'bg-orange-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
  };

  const content = (
    <div className={`card border-l-4 ${colorClasses[color]} cursor-pointer transform hover:scale-105 transition-transform`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-4xl font-bold">{value}</p>
        </div>
        <div className={`w-12 h-12 ${iconBgClasses[color]} rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-current opacity-20">
        <p className="text-xs font-medium">Click to view details →</p>
      </div>
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }

  return content;
}
