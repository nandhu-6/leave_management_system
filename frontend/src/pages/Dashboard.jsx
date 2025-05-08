import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getLeaveBalance, getMyLeaves } from '../services/leaveService';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceData, leavesData] = await Promise.all([
          getLeaveBalance(),
          getMyLeaves()
        ]);
      const sortedLeaves = leavesData.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        // console.log("balanceData",balanceData);
        // console.log("leavedata", leavesData);


        setLeaveBalance(balanceData);
        setRecentLeaves(sortedLeaves); // Get last 5 leaves
      } catch (err) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'rejected':
        return 'badge-danger';
      case 'forwarded':
        return 'badge-forwarded';
      case 'cancelled':
        return 'badge-cancelled';
      default:
        return 'badge-warning';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-100">

      <main className="max-w-7xl mx-auto ">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Casual Leave</h3>
            <p className="text-3xl font-bold text-primary-600">{leaveBalance?.casual || 0}</p>
            <p className="text-sm text-gray-500">days remaining</p>
          </div>

          <div className="card bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sick Leave</h3>
            <p className="text-3xl font-bold text-primary-600">{leaveBalance?.sick || 0}</p>
            <p className="text-sm text-gray-500">days remaining</p>
          </div>

          <div className="card bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loss of Pay</h3>
            <p className="text-3xl font-bold text-primary-600">{leaveBalance?.lop || 0}</p>
            <p className="text-sm text-gray-500">days taken</p>
          </div>
        </div>

        {/* Recent Leaves */}
        <div className="card">
          <div className="flex flex-wrap justify-between items-center mb-4 ">
            <h2 className="text-xl font-semibold text-gray-900">History of Leaves</h2>

            <div className='flex gap-6 items-center'>
              <div className='space-x-4'>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">leave type</option>
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="lop">Loss of Pay</option>
                </select>

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="forwarded">Forwarded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button
                onClick={() => navigate('/leaves')}
                className="btn btn-primary"
              >
                Apply / Cancel Leave
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[50dvh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied On
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentLeaves
                  .filter((leave) =>
                    (typeFilter === 'all' || leave.type === typeFilter) &&
                    (statusFilter === 'all' || leave.status.toLowerCase() === statusFilter.toLowerCase()))
                  .map((leave) => (
                    <tr key={leave.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {leave.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${getStatusBadgeClass(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(leave.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
