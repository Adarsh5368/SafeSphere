import React from 'react';

interface Child {
  _id: string;
  name: string;
  email: string;
}

interface ChildDropdownProps {
  children: Child[];
  selectedChildId: string;
  onChildChange: (childId: string) => void;
  loading?: boolean;
}

const ChildDropdown: React.FC<ChildDropdownProps> = ({
  children,
  selectedChildId,
  onChildChange,
  loading = false,
}) => {
  return (
    <div className="bg-surface rounded-xl border border-border-default p-4">
      <label htmlFor="child-select" className="block text-sm font-themeFont font-semibold text-gray-900 mb-3">
        Select Child
      </label>
      
      {loading ? (
        <div className="w-full px-4 py-3 bg-background rounded-lg animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      ) : (
        <select
          id="child-select"
          value={selectedChildId}
          onChange={(e) => onChildChange(e.target.value)}
          className="w-full px-4 py-3 text-sm font-bodyFont border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
        >
          {children.length === 0 ? (
            <option value="">No children found</option>
          ) : (
            children.map((child) => (
              <option key={child._id} value={child._id}>
                {child.name}
              </option>
            ))
          )}
        </select>
      )}
    </div>
  );
};

export default ChildDropdown;
