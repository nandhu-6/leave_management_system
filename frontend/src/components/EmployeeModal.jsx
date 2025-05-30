import React from 'react';

const EmployeeModal = ({
  isOpen,
  onClose,
  formData,
  handleInputChange,
  handleSubmit,
  managers,
  isEdit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 h-[400px] overflow-y-auto">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {isEdit ? 'Edit Employee' : 'Add Employee'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Employee ID
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                className="input mt-1 h-8"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input mt-1 h-8"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="input mt-1 h-8"
                required
              >
                <option value="" disabled>Select Role</option>
                <option value="intern">Intern</option>
                <option value="developer">Developer</option>
                <option value="manager">Manager</option>
                <option value="director">Director</option>
                <option value="hr">HR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Manager
              </label>
              <select
                name="reportingManagerId"
                value={formData.reportingManagerId}
                onChange={handleInputChange}
                className="input mt-1 h-8"
              >
                <option value="">Select Manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Casual Leave Balance
              </label>
              <input
                type="number"
                name="casualLeaveBalance"
                value={formData.casualLeaveBalance}
                onChange={handleInputChange}
                className="input mt-1 h-8"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sick Leave Balance
              </label>
              <input
                type="number"
                name="sickLeaveBalance"
                value={formData.sickLeaveBalance}
                onChange={handleInputChange}
                className="input mt-1 h-8"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                LOP Count
              </label>
              <input
                type="number"
                name="lopCount"
                value={formData.lopCount}
                onChange={handleInputChange}
                className="input mt-1 h-8"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-danger"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {isEdit ? 'Save Changes' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;