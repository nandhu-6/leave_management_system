import React, { useState, useEffect } from 'react';
import { submitLeaveAction, PendingApprovalsService } from '../services/leaveService';
import { useAuth } from '../context/AuthContext';
import { usePendingApprovals } from '../context/PendingApprovalsContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const PendingApprovals = () => {
  const { user } = useAuth();
  const { fetchPendingCount } = usePendingApprovals();
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionComment, setActionComment] = useState('');
  const [action, setAction] = useState('');

  useEffect(() => {
    fetchTeamLeaves();
  }, []);

  const fetchTeamLeaves = async () => {
    try {
      const data = await PendingApprovalsService();
      setTeamLeaves(data);
      // Update the pending count in the context
      fetchPendingCount();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch teamleaves');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (leaveId, action) => {
    setSelectedLeave(leaveId);
    setAction(action);
    setShowActionModal(true);
  };

  const submitAction = async () => {
    try {
      await submitLeaveAction(selectedLeave, action, actionComment);
      setShowActionModal(false);
      setActionComment('');
      fetchTeamLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process leave request');
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
      <div className="max-w-7xl mx-auto py-3">
        <div className="px-4 py-4 sm:px-0">

          {teamLeaves.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {/* Leave List */}
              <ul className="divide-y divide-gray-200">
                {teamLeaves.map((leave) => (
                  <li key={leave.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-primary-600 truncate">
                            {leave.employee.name} - {leave.type} Leave
                          </p>
                          <span className={`ml-2 badge ${getStatusBadgeClass(leave.status)}`}>
                            {leave.status}
                          </span>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          {(
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAction(leave.id, 'approve')}
                                className="btn btn-success text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(leave.id, 'reject')}
                                className="btn btn-danger text-sm"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Applied on {new Date(leave.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Reason: {leave.reason}
                        </p>
                      </div>
                      {leave.comment && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Comment: {leave.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (<p className='text-center'>No pending leave requests found.</p>)
          }

        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add Comment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Comment
                </label>
                <textarea
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  className="input mt-1"
                  rows="3"
                  required
                  placeholder="Enter your comment for the leave request..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowActionModal(false);
                  setActionComment('');
                }}
                className="btn btn-danger"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAction}
                className="btn btn-primary"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals; 