import {React, useState, useEffect} from 'react';
import { useAuth } from '../context/AuthContext';
import { getTeam } from '../services/employeeService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ONLY_HR, MANAGER_DIRECTOR_HR } from '../constants/constant';

const Profile = () => {
  const { user } = useAuth();
  // console.log("user",user);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        // Only fetch team members if user is a manager, director, or HR
        if (MANAGER_DIRECTOR_HR.includes(user.role)) {
          const data = await getTeam();
          setTeamMembers(data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch team members');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [user.role]);
  console.log("user", user);
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
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

       {/* Team Members Section */}
       {MANAGER_DIRECTOR_HR.includes(user.role) && (
        <div className="">
          <h2 className="text-2xl font-bold mt-4 mb-6 text-primary-700">My Team</h2>
          {loading ? (
            <div className="text-center py-4">Loading team members...</div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No team members found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full ${member.role == 'hr' ? `bg-red-300 text-red-600` : member.role == 'director' ? `bg-green-200 text-green-700` : member.role=='manager' ? 'bg-purple-300 text-purple-700' : member.role=='developer' ? 'bg-primary-300 text-primary-700' : `bg-slate-300 text-slate-800
                        `} flex items-center justify-center`}>
                        <span className="font-semibold">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                      <p className="text-xs text-gray-400">ID: {member.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
       )}
       </div>
  );
};

export default Profile; 