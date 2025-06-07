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
    type: '',
    reason: ''
  });
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [dayCount, setDayCount] = useState({ totalDays: 0, workingDays: 0 });


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
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);

    if (updatedForm.startDate && updatedForm.endDate) {
      const { totalDays, workingDays } = calculateDays(updatedForm.startDate, updatedForm.endDate);
      setDayCount({ totalDays, workingDays });
    }
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

  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let totalDays = 0;
    let workingDays = 0;

    while (startDate <= endDate) {
      totalDays++;
      const day = startDate.getDay();
      if (day !== 0 && day !== 6) {
        workingDays++;
      }
      startDate.setDate(startDate.getDate() + 1);
    }
    return { totalDays, workingDays };
  }
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
    <div className="bg-gray-100 min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto">
        <div className="px-2 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input w-full sm:w-auto px-2 py-1 h-10 text-sm"
              style={{ maxWidth: '100%' }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="forwarded">Forwarded</option>
            </select>
            <button
              onClick={() => setShowApplyForm(true)}
              className="btn btn-primary w-full sm:w-auto text-sm py-1 px-3"
            >
              Apply for Leave
            </button>
          </div>



          {/* Leave List */}
          {
            filteredLeaves.length > 0 ? (
              <div className="bg-white shadow max-h-[75vh] overflow-y-auto rounded-md w-full">
                <ul className="divide-y divide-gray-200 w-full">
                  {filteredLeaves.map((leave) => (
                    <li key={leave.id} className="w-full">
                      <div className="px-3 py-3 sm:px-4 sm:py-4 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs sm:text-sm font-medium text-primary-600">
                              {leave.type} Leave
                            </p>
                            <span className={`badge ${getStatusBadgeClass(leave.status)}`}>
                              {leave.status}
                            </span>
                          </div>
                          <div className="flex-shrink-0 mt-2 sm:mt-0">
                            <button
                              onClick={() => handleCancel(leave.id)}
                              className="btn btn-danger text-xs px-2 py-1"
                              disabled={!['pending', 'forwarded', 'approved'].includes(leave.status.toLowerCase())}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-col sm:flex-row sm:justify-between gap-1">
                          <p className="text-xs text-gray-500">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Applied: {new Date(leave.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="mt-2 flex justify-between items-start">
                          <p className="text-xs text-gray-500 pr-2" style={{ maxWidth: 'calc(100% - 30px)' }}>
                            <span className="font-medium">Reason:</span> {leave.reason}
                          </p>
                          <button
                            onClick={() => openModal(leave)}
                            className="flex-shrink-0 mt-1"
                            aria-label="View approval history"
                          >
                            <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-white p-4 sm:p-8 rounded-md shadow text-center w-full">
                <p className="text-gray-500 text-sm">No leaves found</p>
              </div>
            )
          }

        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-3 sm:p-6 mx-2">
            <h2 className="text-base sm:text-lg font-medium text-primary-600 mb-3">Apply for Leave</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Leave Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="input mt-1 w-full text-xs sm:text-sm py-1"
                    required
                    style={{ height: '36px' }}
                  >
                    <option value="" disabled hidden > Select a leave type</option>
                    <option value="casual">
                      {formData.type === 'casual'
                        ? 'Casual Leave'
                        : `Casual Leave - ${leaveBalance.casual} days available`}
                    </option>
                    <option value="sick">
                      {formData.type === 'sick'
                        ? 'Sick Leave'
                        : `Sick Leave - ${leaveBalance.sick} days available`}
                    </option>
                    <option value="lop">
                      {formData.type === 'lop'
                        ? 'Loss of Pay'
                        : `Loss of Pay - ${leaveBalance.lop} days taken`}
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      min={getDateDaysAgo(3)}
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="input mt-1 w-full text-xs sm:text-sm"
                      required
                      style={{ height: '36px' }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      min={formData.startDate}
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="input mt-1 w-full text-xs sm:text-sm"
                      required
                      style={{ height: '36px' }}
                    />
                  </div>
                </div>
                {formData.startDate && formData.endDate && (
                  <div className="text-xs sm:text-sm text-gray-600 flex justify-between">
                    <p>Total Days Selected: {dayCount.totalDays}</p>
                    <p>Actual Leave Days: {dayCount.workingDays}</p>
                  </div>
                )}


                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Reason</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="input mt-1 w-full text-xs sm:text-sm"
                    rows="3"
                    required
                  />
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplyForm(false)}
                  className="btn btn-danger w-full sm:w-auto order-2 sm:order-1 text-xs sm:text-sm py-1 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary w-full sm:w-auto order-1 sm:order-2 text-xs sm:text-sm py-1 px-3"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval History Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2">
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 w-[50vw] overflow-y-auto mx-2" >
            <h2 className="text-base sm:text-lg text-primary-600 font-semibold mb-3">Approval History</h2>
            {selectedHistory.length === 0 ? (
              <div className="py-3 text-center text-gray-500">
                <p className="text-xs sm:text-sm">No approval history available.</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                {selectedHistory.map((entry, idx) => (
                  <li key={idx} className="border-b pb-2 text-xs sm:text-sm">
                    <div className="flex flex-wrap justify-between items-start gap-1">
                      <p className="font-medium text-primary-600">{entry.action}</p>
                      <p className="text-xs text-gray-500" style={{ fontSize: '0.65rem' }}>
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-1"><span className="font-medium">By:</span> {entry.employeeName || entry.by}</p>
                    {entry.comment && (
                      <p className="mt-1 text-gray-700">
                        <span className="font-medium">Comment:</span> {entry.comment}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex justify-center">
              <button
                className="btn btn-primary w-full text-xs sm:text-sm py-1 px-3"
                onClick={closeModal}
                style={{ maxWidth: '200px' }}
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
