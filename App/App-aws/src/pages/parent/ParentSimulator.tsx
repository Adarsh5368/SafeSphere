import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import SimulatorControl from '../../components/dashboard/SimulatorControl';
import { SparklesIcon } from '@heroicons/react/24/outline';

const ParentSimulator: React.FC = () => {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-6 text-on-primary shadow-md">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-6 w-6" />
            <div>
              <h1 className="text-2xl font-bold">Demo Simulator</h1>
              <p className="text-on-primary/80 text-sm mt-1">
                Test features with realistic scenarios
              </p>
            </div>
          </div>
        </div>



        {/* Simulator Control */}
        <SimulatorControl />
      </div>
    </MainLayout>
  );
};

export default ParentSimulator;
