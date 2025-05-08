import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8">
      <h2 className="text-2xl font-bold mb-6 text-primary-700">My Profile</h2>
      <div className="space-y-4">
        <div>
          <span className="font-semibold text-gray-700">Employee ID:</span>
          <span className="ml-2 text-gray-900">{user.id}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Name:</span>
          <span className="ml-2 text-gray-900">{user.name}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Role:</span>
          <span className="ml-2 text-gray-900 capitalize">{user.role}</span>
        </div>
        {user.department && (
          <div>
            <span className="font-semibold text-gray-700">Department:</span>
            <span className="ml-2 text-gray-900">{user.department}</span>
          </div>
        )}
        {user.reportingManager && (
          <div>
            <span className="font-semibold text-gray-700">Reporting Manager:</span>
            <span className="ml-2 text-gray-900">{user.reportingManager.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 