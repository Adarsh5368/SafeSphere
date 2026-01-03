import React, { useState } from 'react';

export type DateRangeType = 'today' | 'week' | 'custom';

interface DateFilterProps {
  onDateRangeChange: (type: DateRangeType, from?: Date, to?: Date) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ onDateRangeChange }) => {
  const [selectedRange, setSelectedRange] = useState<DateRangeType>('today');
  const [showCustom, setShowCustom] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleRangeChange = (type: DateRangeType) => {
    setSelectedRange(type);
    
    if (type === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      const now = new Date();
      const from = new Date();
      
      if (type === 'today') {
        from.setHours(0, 0, 0, 0);
      } else if (type === 'week') {
        from.setDate(now.getDate() - 7);
        from.setHours(0, 0, 0, 0);
      }
      
      onDateRangeChange(type, from, now);
    }
  };

  const handleCustomApply = () => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      onDateRangeChange('custom', from, to);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border-default p-4">
      <h3 className="text-sm font-themeFont font-semibold text-gray-900 mb-3">Date Range</h3>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => handleRangeChange('today')}
          className={`px-3 py-2 text-sm font-bodyFont rounded-lg transition-colors ${
            selectedRange === 'today'
              ? 'bg-primary text-white'
              : 'bg-background text-gray-700 hover:bg-gray-100'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => handleRangeChange('week')}
          className={`px-3 py-2 text-sm font-bodyFont rounded-lg transition-colors ${
            selectedRange === 'week'
              ? 'bg-primary text-white'
              : 'bg-background text-gray-700 hover:bg-gray-100'
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => handleRangeChange('custom')}
          className={`px-3 py-2 text-sm font-bodyFont rounded-lg transition-colors ${
            selectedRange === 'custom'
              ? 'bg-primary text-white'
              : 'bg-background text-gray-700 hover:bg-gray-100'
          }`}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="space-y-3 pt-3 border-t border-border-default">
          <div>
            <label className="block text-xs font-bodyFont text-muted mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="Select start date"
              className="w-full px-3 py-2 text-sm font-bodyFont border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bodyFont text-muted mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="Select end date"
              className="w-full px-3 py-2 text-sm font-bodyFont border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={handleCustomApply}
            disabled={!fromDate || !toDate}
            className="w-full px-3 py-2 text-sm font-bodyFont font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

export default DateFilter;
