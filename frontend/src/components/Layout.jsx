
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ONLY_HR, MANAGER_DIRECTOR_HR, ALL_ROLES} from '../constants/constant';

import {
  HomeIcon,
  UserIcon,
  CalendarDaysIcon,
  InboxIcon,
  UsersIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <HomeIcon className="h-6 w-6" />,
    roles: ALL_ROLES,
  },
  {
    label: 'My Profile',
    to: '/profile',
    icon: <UserIcon className="h-6 w-6" />,
    roles: ALL_ROLES,
  },
  {
    label: 'Apply/Cancel Leave',
    to: '/leaves',
    icon: <CalendarDaysIcon className="h-6 w-6" />,
    roles: ALL_ROLES,
  },
  {
    label: 'Pending Approvals',
    to: '/pending-approvals',
    icon: <InboxIcon className="h-6 w-6" />,
    roles: MANAGER_DIRECTOR_HR,
  },
  {
    label: 'Manage Employees',
    to: '/employees',
    icon: <UsersIcon className="h-6 w-6" />,
    roles: ONLY_HR,
  },
  {
    label: 'Calendar',
    to: '/calendar',
    icon: <CalendarIcon className="h-6 w-6" />,
    roles: MANAGER_DIRECTOR_HR,
  },
];

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/profile': 'Profile',
  '/leaves': 'Apply/Cancel Leave',
  '/pending-approvals': 'Pending Approvals',
  '/employees': 'Manage Employees',
  '/calendar': 'Team Calendar',
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const pageTitle = pageTitles[currentPath] || 'Dashboard';

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <div className="flex min-h-screen bg-gray-100 pl-[235px]">
      {/* Sidebar */}
      <aside className="w-[235px] bg-[#0B1D2D] shadow fixed top-0 left-0 h-full z-30 flex flex-col">
        <div>
          <img className='w-20 mx-auto my-3 ' id="image-1023-32" alt="Lumel" src="https://lumel.com/wp-content/uploads/lumel-orange.svg" />
        </div>

        <nav className="flex-1 py-1">
          <ul className="space-y-2 ">
            {filteredNav.map((item) => (
              <li key={item.to}>
                <button
                  className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-150 ${currentPath === item.to
                    ? 'bg-[#122E44] text-white font-semibold'
                    : 'text-gray-400 hover:bg-[#122E44]'
                    }`}
                  onClick={() => navigate(item.to)}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full btn bg-slate-100 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-[#5141a1] shadow flex justify-between items-center px-8 sticky top-0 z-10">

          <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
          <span className="flex items-center font-semibold text-white space-x-1">
            <UserIcon className="w-4 h-4" />
            <span>{user.name}</span>
          </span></header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout; 