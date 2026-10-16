import React from 'react';

export function StatusBadge({ status }) {
  const styles = {
    OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    RESOLVED: 'bg-blue-50 text-blue-700 border-blue-200',
    CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const labels = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };

  const styleClass = styles[status] || 'bg-gray-50 text-gray-600 border-gray-200';
  const label = labels[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styleClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    CRITICAL: 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const styleClass = styles[priority] || 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs border ${styleClass}`}
    >
      {priority}
    </span>
  );
}

export function CategoryBadge({ category }) {
  const formatCategory = (cat) => {
    if (!cat) return 'General';
    const mapping = {
      ROYALTY_AND_PAYMENTS: 'Royalty & Payments',
      ISBN_AND_METADATA_ISSUES: 'ISBN & Metadata',
      PRINTING_AND_QUALITY: 'Printing & Quality',
      DISTRIBUTION_AND_AVAILABILITY: 'Distribution',
      BOOK_STATUS_AND_PRODUCTION_UPDATES: 'Production Status',
      GENERAL_INQUIRY: 'General Inquiry',
    };
    return mapping[cat] || cat;
  };

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {formatCategory(category)}
    </span>
  );
}

export default {
  StatusBadge,
  PriorityBadge,
  CategoryBadge,
};
