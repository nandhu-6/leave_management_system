import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';


const Register = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [employeeIdError, setEmployeeIdError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);

  const navigate = useNavigate();

  const handleEmployeeIdChange = (e) => {
    const value = e.target.value;
    setEmployeeId(value);
    const empIdPattern = /^LMT\d+$/;
    setEmployeeIdError(
      empIdPattern.test(value) ? '' : 'Format must be LMT followed by digits (e.g: LMT100)'
    );
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    const passwordPattern =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    setPasswordError(
      passwordPattern.test(value)
        ? ''
        : 'At least 8 characters with uppercase, lowercase and number'
    );
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmPasswordError(value === password ? '' : 'Passwords do not match');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(employeeId, password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" bg-gray-100 flex flex-col justify-center py-8 ">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Register with given employee ID
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-2" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                Employee ID
              </label>
              <div className="mt-1">
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => {
                    handleEmployeeIdChange(e)
                    setEmployeeId(e.target.value)
                  }}
                  className="input h-8"
                />


                <p className={`text-[10px] mt-1 min-h-[14px] ${employeeIdError ? 'text-red-500' : 'text-transparent'}`}>
                  {employeeIdError || ''}
                </p>

              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[16px] font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    handlePasswordChange(e)
                    setPassword(e.target.value)
                  }}
                  className="input h-8"
                />
                <p className={`text-[10px] mt-1 min-h-[16px] ${passwordError ? 'text-red-500' : 'text-transparent'}`}>
                  {passwordError || ''}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    handleConfirmPasswordChange(e)
                    setConfirmPassword(e.target.value)
                  }}
                  className="input h-8"
                />
                 <p className={`text-[10px] mt-1 min-h-[16px] ${confirmPasswordError ? 'text-red-500' : 'text-transparent'}`}>
                  {confirmPasswordError || ''}
                </p>
                 </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn  bg-[#0B1D2D] text-white"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                    Sign in
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 