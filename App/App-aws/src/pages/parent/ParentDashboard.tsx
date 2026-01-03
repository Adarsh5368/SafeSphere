import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserGroupIcon, 
  MapIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { API_ENDPOINTS, type AlertType } from '../../utils/constants';
import MainLayout from '../../components/layout/MainLayout';
import DashboardStat from '../../components/dashboard/DashboardStat';
import ChildCard from '../../components/dashboard/ChildCard';
import AlertItem from '../../components/dashboard/AlertItem';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import { Button } from '../../components/ui';

interface DashboardData {
  totalChildren: number;
  activeGeofences: number;
  unreadAlerts: number;
  lastActivity: string;
}

interface FamilyMember {
  _id: string;
  name: string;
  email: string;
  userType: string;
  age?: number;
  isActive: boolean;
  lastLogin: string;
}

interface ChildLocation {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

interface Alert {
  _id: string;
  type: AlertType;
  message?: string;
  timestamp: string;
  isRead: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  userId: {
    _id: string;
    name: string;
  };
}

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [childrenLocations, setChildrenLocations] = useState<ChildLocation[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD);
      console.log('Dashboard API response:', response.data);
      setDashboardData(response.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      throw err; // Re-throw to be caught by Promise.all
    }
  };

  // Fetch family members
  const fetchFamilyMembers = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.FAMILY);
      console.log('Family API response:', response.data);
      const members = response.data.data?.familyMembers || response.data.data || [];
      const children = members.filter((member: FamilyMember) => member.userType === 'CHILD');
      console.log('Children found:', children);
      setFamilyMembers(children);
    } catch (err) {
      console.error('Failed to fetch family members:', err);
      throw err; // Re-throw to be caught by Promise.all
    }
  };

  // Fetch recent alerts
  const fetchRecentAlerts = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.RECENT_ALERTS);
      console.log('Alerts API response:', response.data);
      // API returns { status, data: { alerts: [...] } }
      const alerts = response.data.data?.alerts || [];
      console.log('Parsed alerts:', alerts);
      setRecentAlerts(alerts.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch recent alerts:', err);
      throw err; // Re-throw to be caught by Promise.all
    }
  };

  // Load all data
  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchFamilyMembers(),
        fetchRecentAlerts()
      ]);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      console.log('ParentDashboard: Starting to load data...');
      setIsLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchFamilyMembers(),
          fetchRecentAlerts()
        ]);
        console.log('ParentDashboard: All data loaded successfully');
      } catch (err) {
        console.error('ParentDashboard: Error loading data', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        console.log('ParentDashboard: Setting isLoading to false');
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Load children locations after family members are loaded and poll every 10 seconds
  useEffect(() => {
    const getChildrenLocations = async () => {
      try {
        const childIds = familyMembers.map(child => child._id);
        if (childIds.length > 0) {
          console.log('Fetching locations for children:', childIds);
          const response = await api.post(API_ENDPOINTS.CHILDREN_LOCATIONS, {
            childIds
          });
          console.log('Children locations response:', response.data);
          const locations = response.data.data.locations || [];
          const mappedLocations = locations.map((loc: { userId: string | { _id: string }, latitude: number, longitude: number, accuracy?: number, timestamp: string }) => {
            // Handle both populated and non-populated userId
            const userId = typeof loc.userId === 'object' ? loc.userId._id : loc.userId;
            console.log('Mapping location for userId:', userId, 'location:', loc);
            return {
              userId: userId,
              latitude: loc.latitude,
              longitude: loc.longitude,
              accuracy: loc.accuracy,
              timestamp: loc.timestamp
            };
          });
          console.log('Mapped locations:', mappedLocations);
          setChildrenLocations(mappedLocations);
        }
      } catch (err) {
        console.error('Failed to fetch children locations:', err);
      }
    };

    if (familyMembers.length > 0) {
      getChildrenLocations();
      // Poll every 10 seconds
      const interval = setInterval(getChildrenLocations, 10000);
      return () => clearInterval(interval);
    }
  }, [familyMembers]);

  // Check if child is online (within last 10 minutes)
  const isChildOnline = (child: FamilyMember) => {
    const lastLoginTime = new Date(child.lastLogin).getTime();
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    return lastLoginTime > tenMinutesAgo && child.isActive;
  };

  // Get location for child
  const getChildLocation = (childId: string) => {
    return childrenLocations.find(loc => loc.userId === childId);
  };

  // Navigation handlers
  const handleAddChild = () => navigate('/parent/children');
  const handleViewAlerts = () => navigate('/parent/alerts');
  const handleAlertClick = (alertId: string) => navigate(`/parent/alerts?alert=${alertId}`);

  if (isLoading) {
    return (
      <MainLayout>
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-16 h-16 text-error mx-auto mb-4" />
          <h3 className="text-xl font-themeFont font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h3>
          <p className="text-base font-bodyFont text-muted mb-6">{error}</p>
          <Button onClick={loadDashboardData} variant="primary">
            Try Again
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header Section */}
        <div className="bg-surface rounded-xl border border-border-default p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-themeFont font-semibold text-gray-900">
                Welcome back, {user?.name}
              </h1>
              <p className="text-sm font-bodyFont text-muted mt-1">
                Here's what's happening with your family
              </p>
            </div>
            <div>
              <div className="bg-primary/10 px-3 py-2 rounded-xl">
                <p className="text-xs font-bodyFont font-medium text-primary">
                  Family Code: <span className="font-mono">{user?.familyCode}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStat
            title="Total Children"
            value={dashboardData?.totalChildren || familyMembers.length}
            icon={<UserGroupIcon className="w-6 h-6" />}
            description="Family members"
          />
          <DashboardStat
            title="Active Geofences"
            value={dashboardData?.activeGeofences || 0}
            icon={<ShieldCheckIcon className="w-6 h-6" />}
            description="Safety zones"
          />
          <DashboardStat
            title="Unread Alerts"
            value={dashboardData?.unreadAlerts || recentAlerts.filter(alert => !alert.isRead).length}
            icon={<ExclamationTriangleIcon className="w-6 h-6" />}
            description="Requires attention"
            trend={
              recentAlerts.length > 0 ? {
                value: `${recentAlerts.filter(alert => !alert.isRead).length} new`,
                isPositive: false
              } : undefined
            }
          />
          <DashboardStat
            title="Online Children"
            value={familyMembers.filter(isChildOnline).length}
            icon={<MapIcon className="w-6 h-6" />}
            description="Currently active"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Children Overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-themeFont font-semibold text-gray-900">Children Overview</h2>
              <Button
                onClick={handleAddChild}
                variant="primary"
                size="sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Child
              </Button>
            </div>

            {familyMembers.length === 0 ? (
              <div className="bg-surface rounded-xl border border-border-default p-8 text-center">
                <UserGroupIcon className="w-16 h-16 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-themeFont font-semibold text-gray-900 mb-2">No children added yet</h3>
                <p className="text-base font-bodyFont text-muted mb-6">
                  Start by adding your first child to begin monitoring their safety
                </p>
                <Button onClick={handleAddChild} variant="primary">
                  Add Your First Child
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {familyMembers.map((child) => (
                  <ChildCard
                    key={child._id}
                    child={child}
                    location={getChildLocation(child._id)}
                    isOnline={isChildOnline(child)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Alerts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-themeFont font-semibold text-gray-900">Recent Alerts</h2>
              <Button
                onClick={handleViewAlerts}
                variant="ghost"
                size="sm"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>

            {recentAlerts.length === 0 ? (
              <div className="bg-surface rounded-xl border border-border-default p-8 text-center">
                <ExclamationTriangleIcon className="w-16 h-16 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-themeFont font-semibold text-gray-900 mb-2">No recent alerts</h3>
                <p className="text-base font-bodyFont text-muted">
                  All quiet! Your family is safe and secure.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentAlerts.map((alert) => (
                  <AlertItem
                    key={alert._id}
                    alert={alert}
                    onClick={() => handleAlertClick(alert._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ParentDashboard;