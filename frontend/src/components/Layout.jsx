
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ONLY_HR, MANAGER_DIRECTOR_HR, ALL_ROLES } from '../constants/constant';

import {
  HomeIcon,
  UserIcon,
  CalendarDaysIcon,
  InboxIcon,
  UsersIcon,
  CalendarIcon,
  Bars3Icon,
  PowerIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <HomeIcon className="h-6 w-6" />,
    roles: ALL_ROLES,
  },
  // {
  //   label: 'My Profile',
  //   to: '/profile',
  //   icon: <UserIcon className="h-6 w-6" />,
  //   roles: ALL_ROLES,
  // },
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
    roles: ALL_ROLES,
  },
];

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/profile': 'Profile',
  '/leaves': 'Apply Leave',
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
  const [collapsed, setCollapsed] = useState(false);
  const [show, setShow] = useState(false);

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleShow = () => {
    setShow(!show);
  }

  const sidebarWidth = collapsed ? 'w-[70px]' : 'w-[235px]';
  const mainContentPadding = collapsed ? 'pl-[70px]' : 'pl-[235px]';
  const dropdownRef = useRef(null);

  useEffect (() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current &&!dropdownRef.current.contains(event.target)) {
        setShow(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  })

  return (
    <div className={`flex min-h-screen bg-gray-100 ${mainContentPadding} transition-all duration-300`}>
      {/* Sidebar */}
      <aside className={`${sidebarWidth} bg-[#0B1D2D] shadow fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300`}>
        <div className="flex justify-center items-center py-3 relative h-16">
          <div className={`transition-opacity duration-300 ${collapsed ? 'opacity-0 absolute' : 'opacity-100'}`}>
            <img className='w-20 mx-auto' id="image-1023-32" alt="Lumel" src="https://lumel.com/wp-content/uploads/lumel-orange.svg" />
          </div>
          {/* hamburger menu btn */}
          <button
            onClick={toggleSidebar}
            className={`absolute ${collapsed ? 'right-1/2 transform translate-x-1/2' : 'right-2'} top-3 bg-[#122E44] p-2 rounded-full text-white hover:bg-[#1a3f5e] transition-all duration-300`}
          >
            {collapsed ?
              <Bars3Icon className="h-5 w-5" /> :
              <XMarkIcon className="h-5 w-5" />
            }
          </button>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-2">
            {filteredNav.map((item) => (
              <li key={item.to}>
                <button
                  className={`flex items-center w-full ${collapsed ? 'justify-center' : 'justify-start'} px-4 py-3 text-left rounded-lg transition-all duration-300 ${currentPath === item.to
                    ? 'bg-[#122E44] text-white font-semibold'
                    : 'text-gray-400 hover:bg-[#122E44]'
                    }`}
                  onClick={() => navigate(item.to)}
                  title={collapsed ? item.label : ''}
                >
                  <div className="flex-shrink-0 w-6">
                    {item.icon}
                  </div>
                  <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {/* <div className={`${collapsed ? 'p-2' : 'p-6'} border-t border-gray-200`}>
          <button
            onClick={logout}
            className={`w-full btn bg-slate-100 hover:bg-slate-50 ${collapsed ? 'p-2' : ''}`}
            title={collapsed ? "Logout" : ""}
          >
            {collapsed ? <UserIcon className="h-5 w-5 mx-auto" /> : "Logout"}
          </button>
        </div> */}
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="min-h-12 sm:min-h-16 bg-[#5141a1] shadow flex flex-wrap justify-between items-center px-4 sm:px-8 sticky top-0 z-10 relative">
        {/* <header className="h-8 sm:h-16  bg-[#5141a1] shadow flex justify-between items-center px-8 sticky top-0 z-10 relative"> */}
          <h1 className="text-sm sm:text-2xl font-bold text-white">{pageTitle}</h1>
          <div ref={dropdownRef}>
            <button className='relative' onClick={handleShow}>
              <span className="flex items-center font-semibold text-white space-x-1 text-sm sm:text-2xl">
                <UserIcon className="w-4 h-4" />
                <span>{user.name}</span>
              </span>
            </button>
            {show && (
              <div className="flex flex-col gap-y-4 absolute right-2 top-12 w-30 bg-white p-4 rounded-sm shadow-lg z-10 text-[14px]">
                <button onClick={() => navigate('/profile')}>
                  <div className='flex items-center'>
                    <UserIcon className="text-gray-500 h-4 w-6" />
                    <p>My Profile</p>
                  </div>
                </button>
                <button onClick={logout}>
                  <div className='flex items-center'>
                    <PowerIcon className="text-gray-500  h-4 w-6" />
                    <p>Logout</p>
                  </div>
                </button>

              </div>
            )}
          </div>


        </header>
        <main className="flex-1 p-2 sm:p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout; 