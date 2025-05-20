import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getLeaveBalance, getMyLeaves } from '../services/leaveService';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
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
        toast.error(err.response?.data?.message || 'Failed to fetch dashboard data');
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
    <div className="bg-gray-100 min-h-screen w-full px-4 py-6 sm:px-6 lg:px-8">
      <main className="w-full max-w-7xl mx-auto">
        {/* Leave Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1">Casual Leave</h3>
            <p className="text-xl sm:text-3xl font-bold text-primary-600">{leaveBalance?.casual || 0}</p>
            <p className="text-xs sm:text-sm text-gray-500">days remaining</p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1">Sick Leave</h3>
            <p className="text-xl sm:text-3xl font-bold text-primary-600">{leaveBalance?.sick || 0}</p>
            <p className="text-xs sm:text-sm text-gray-500">days remaining</p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1">Loss of Pay</h3>
            <p className="text-xl sm:text-3xl font-bold text-primary-600">{leaveBalance?.lop || 0}</p>
            <p className="text-xs sm:text-sm text-gray-500">days taken</p>
          </div>
        </div>

        {/* Recent Leaves */}
        <div className="bg-white p-2 sm:p-4 rounded shadow">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">History of Leaves</h2>

        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Leave Type</option>
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="lop">Loss of Pay</option>
            </select>

            <select
              className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="forwarded">Forwarded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => navigate('/leaves')}
            className="btn btn-primary text-white text-sm px-4 py-2 rounded w-full sm:w-auto"
          >
            Apply / Cancel Leave
          </button>
        </div>

        <div className="min-w-40 max-w-[40vw] sm:max-w-[80vw] overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-[12px] sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentLeaves
                .filter((leave) =>
                  (typeFilter === 'all' || leave.type === typeFilter) &&
                  (statusFilter === 'all' || leave.status.toLowerCase() === statusFilter.toLowerCase()))
                .map((leave) => (
                  <tr key={leave.id}>
                    <td className="px-2 py-2 whitespace-nowrap">{leave.type}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className="hidden sm:inline">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </span>
                      <span className="sm:hidden">
                        {new Date(leave.startDate).toLocaleDateString().split('/').slice(0, 2).join('/')} - 
                        {new Date(leave.endDate).toLocaleDateString().split('/').slice(0, 2).join('/')}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`badge ${getStatusBadgeClass(leave.status)}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
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