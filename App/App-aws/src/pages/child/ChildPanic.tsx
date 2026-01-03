import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';

const ChildPanic: React.FC = () => {
  const [isEmergency, setIsEmergency] = useState(false);

  const handleEmergencyAlert = () => {
    setIsEmergency(true);
    // TODO: Implement emergency alert API call
    setTimeout(() => {
      setIsEmergency(false);
    }, 3000);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Emergency Alert</h1>
          <p className="text-gray-600">Use this in case of emergency to immediately notify your parents</p>
        </div>

        {/* Emergency Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center space-y-6">
            {!isEmergency ? (
              <>
                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 border-4 border-red-200">
                  <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Emergency Alert</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Press the button below to send an immediate alert to your parents with your current location.
                  </p>
                </div>

                <button
                  onClick={handleEmergencyAlert}
                  className="inline-flex items-center px-8 py-4 bg-red-600 text-white text-lg font-medium rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-200 shadow-lg"
                >
                  <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  SEND EMERGENCY ALERT
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 border-4 border-green-200">
                  <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold text-green-900 mb-2">Alert Sent!</h2>
                  <p className="text-green-700 max-w-md mx-auto">
                    Your emergency alert has been sent to your parents. Help is on the way!
                  </p>
                </div>

                <div className="animate-pulse">
                  <div className="h-2 bg-green-200 rounded-full"></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contacts</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">M</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Mom</p>
                  <p className="text-xs text-gray-500">Primary Contact</p>
                </div>
              </div>
              <button 
                className="text-blue-600 hover:text-blue-700 p-2"
                title="Call Mom"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-700">D</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Dad</p>
                  <p className="text-xs text-gray-500">Secondary Contact</p>
                </div>
              </div>
              <button 
                className="text-blue-600 hover:text-blue-700 p-2"
                title="Call Dad"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Safety Tips */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Safety Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
              <span>Only use the emergency button in real emergencies</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
              <span>Make sure your location sharing is always enabled</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
              <span>Keep your device charged when going out</span>
            </li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default ChildPanic;