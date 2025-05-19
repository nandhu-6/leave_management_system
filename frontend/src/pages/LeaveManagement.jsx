import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getMyLeaves, getLeaveBalance, applyLeave, cancelLeave } from '../services/leaveService';
import { getUserById } from '../services/employeeService';
import {
  InformationCircleIcon
} from '@heroicons/react/24/outline';



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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  

  const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchLeaves();
    fetchLeaveBalance();
  }, []);

  const fetchLeaves = async () => {
    try {
      const data = await getMyLeaves();
      let filteredLeaves = data.filter(leave => ['pending', 'forwarded', 'approved'].includes(leave.status.toLowerCase()));
      //filter this filteredLeaves based on start date which should not be greater than current date and can be 2 days before today
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // to include today's date
      // console.log("currentDate", currentDate);
      filteredLeaves = filteredLeaves.filter(leave => {
        const leaveDate = new Date(leave.startDate);
        return leaveDate >= currentDate;
      });

      filteredLeaves.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      // setLeaves(response.data);
      setLeaves(filteredLeaves);
      // console.log(filteredLeaves);

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

  const openModal = async (leaveInfo) => {
    try {
      const parsedLeaveInfo = JSON.parse(leaveInfo.approvalHistory);
      
      const historyWithNames = [...parsedLeaveInfo];
      
      setSelectedHistory(historyWithNames);
      setIsModalOpen(true);
      
      const updatedHistory = await Promise.all(
        historyWithNames.map(async (entry) => {
          try {
            // console.log(`Fetching data for employee ID: ${entry.by}`);
            const userName = await getUserById(entry.by);
            // console.log(`Received user data:`, userName);
            
            return {
              ...entry,
              employeeName: userName && userName ? userName : entry.by
            };
          } catch (err) {
            console.error(`Error fetching employee ${entry.by}:`, err);
            return entry;
          }
        })
      );
      
      // Update the history with employee names
      setSelectedHistory(updatedHistory);
      console.log("modal data with names", updatedHistory);
      
    } catch (error) {
      console.log(error.message);
      toast.error("Error parsing approval leave history");
    }
  }
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedHistory([]);
  }

  const filteredLeaves = leaves.filter(leave => filter === 'all' || leave.status.toLowerCase() === filter);
  // console.log("leaves", filteredLeaves);

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
                        <div className="mt-2 flex justify-between">
                          <p className="text-sm text-gray-500">
                            Reason: {leave.reason}
                          </p>
                          <button onClick={() => openModal(leave)}>
                            <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
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
                  <input type="date" name="startDate" min={getDateDaysAgo(3)} value={formData.startDate} onChange={handleInputChange} className="input mt-1 h-8" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input type="date" name="endDate" min={formData.startDate} value={formData.endDate} onChange={handleInputChange} className="input mt-1 h-8" required />
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

      {/* leaveInfo modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg text-primary-600 font-semibold mb-4">Approval History</h2>
            {selectedHistory.length === 0 ? (
              <p>No approval history available.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {selectedHistory.map((entry, idx) => (
                  <li key={idx} className="border-b pb-2">
                    <p><strong>Action:</strong> {entry.action}</p>
                    <p><strong>By:</strong> {entry.employeeName || entry.by}</p>
                    {entry.comment && <p><strong>Comment:</strong> {entry.comment}</p>}
                    <p><strong>Time:</strong> {new Date(entry.timestamp).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 text-right">
              <button
                className="px-4 py-2 btn btn-primary text-white rounded "
                onClick={closeModal}
                
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeaveManagement;
