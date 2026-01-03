import React from 'react';
import MainLayout from '../../components/layout/MainLayout';

const ChildLocation: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Location Sharing</h1>
          <p className="text-gray-600">Manage your location sharing settings</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500">Location management interface will be implemented here.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default ChildLocation;