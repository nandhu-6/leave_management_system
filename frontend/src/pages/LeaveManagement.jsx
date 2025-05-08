import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getMyLeaves, getLeaveBalance, applyLeave, cancelLeave } from '../services/leaveService';

const LeaveManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'casual',
    reason: ''
  });
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLeaves();
    fetchLeaveBalance();
  }, []);

  const fetchLeaves = async () => {
    try {
      const data = await getMyLeaves();
      let filteredLeaves = data.filter(leave => ['pending', 'forwarded','approved'].includes(leave.status.toLowerCase()));
      //filter this filteredLeaves based on start date which should not be greater than current date and can be 2 days before today
      const currentDate = new Date();
      console.log("currentDate", currentDate);
      
      const twoDaysBeforeToday = new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000);
      console.log("twoDaysBeforeToday", twoDaysBeforeToday);

      // filteredLeaves = filteredLeaves.filter(leave => leave.startDate >= twoDaysBeforeToday);
      filteredLeaves = filteredLeaves.filter(leave => {
        const leaveDate = new Date(leave.startDate);
        return leaveDate >= twoDaysBeforeToday;
      });
      
      // //sort this filteredLeaves based on start date in ascending order
      filteredLeaves.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      
      // setLeaves(response.data);
      setLeaves(filteredLeaves);
      console.log(filteredLeaves);
      
      // setLeaves(response.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const data = await getLeaveBalance();
      setLeaveBalance(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch leave balance');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await applyLeave(formData);
      toast.success('Leave applied successfully');
      setShowApplyForm(false);
      setFormData({
        startDate: '',
        endDate: '',
        type: 'casual',
        reason: ''
      });
      fetchLeaves();
      fetchLeaveBalance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply for leave');
      setShowApplyForm(false);
      setFormData({
        startDate: '',
        endDate: '',
        type: 'casual',
        reason: ''
      });
    }
  };

  const handleCancel = async (leaveId) => {
    try {
      await cancelLeave(leaveId);
      toast.success('Leave cancelled successfully');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel leave');
    }
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

  const filteredLeaves = leaves.filter(leave => filter === 'all' || leave.status.toLowerCase() === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-100">
      <div className="max-w-7xl mx-auto ">
        <div className="px-4 py-4 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input max-w-fit px-1 h-10"
            >
              <option value="all">status</option>
              <option value="pending">Pending</option>
              <option value="forwarded">Forwarded</option>
            </select>
            <button onClick={() => setShowApplyForm(true)} className="btn btn-primary">
              Apply for Leave
            </button>


          </div>



          {/* Leave List */}
          {
            filteredLeaves.length > 0 ? (
              <div className="bg-white shadow max-h-[75vh] overflow-y-auto sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredLeaves.map((leave) => (
                <li key={leave.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-primary-600 truncate">
                          {leave.type} Leave
                        </p>
                        <span className={`ml-2 badge ${getStatusBadgeClass(leave.status)}`}>
                          {leave.status}
                        </span>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <button onClick={() => handleCancel(leave.id)} className="btn btn-danger text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>Applied on {new Date(leave.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Reason: {leave.reason}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
            ) : (<p className='text-center'>No leaves found to cancel</p>)
          }
          
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Apply for Leave</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="input mt-1" required>
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="lop">Loss of Pay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="input mt-1" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="input mt-1" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <textarea name="reason" value={formData.reason} onChange={handleInputChange} className="input mt-1" rows="3" required />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowApplyForm(false)} className="btn btn-danger">Cancel</button>
                <button type="submit" className="btn btn-primary">Apply</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
