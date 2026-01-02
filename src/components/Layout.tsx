import { useState } from 'react';
import type { ReactNode } from 'react';
import { HomeIcon, ExclamationTriangleIcon, VideoCameraIcon, DocumentIcon, UserIcon, QuestionMarkCircleIcon, Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon, BellIcon, ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  title: string;
  breadcrumb?: string;
  hideDefaultBreadcrumbs?: boolean;
}

const Layout = ({ children, title, breadcrumb, hideDefaultBreadcrumbs = false }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const menuItems = [
    { name: 'Дэшборд', icon: HomeIcon, href: '/dashboard' },
    { name: 'Инциденты', icon: ExclamationTriangleIcon, href: '/incidents' },
    { name: 'События', icon: BellIcon, href: '/events' },
    { name: 'Камеры', icon: VideoCameraIcon, href: '/cameras' },
    { name: 'Файлообменник', icon: DocumentIcon, href: '/files' },
    { name: 'Пользователи', icon: UserIcon, href: '/users' },
    { name: 'Роли', icon: ShieldCheckIcon, href: '/roles' },
    { name: 'Разрешения', icon: KeyIcon, href: '/permissions' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-64 sm:w-72 h-full bg-[#F7F9FB] border-r border-[#E5EAF2]">
            {/* Mobile Sidebar Content */}
            <div className="flex flex-col h-full">
              {/* Logo and Close Button */}
              <div className="p-4 sm:p-6 pb-2 flex justify-between items-center">
                <h1 className="text-[#014596] text-2xl sm:text-3xl font-bold">ams</h1>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Закрыть меню"
                >
                  <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                </button>
              </div>
              {/* Navigation */}
              <nav className="mt-2 flex-1 overflow-y-auto">
                <ul className="space-y-1 px-2 sm:px-3">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium text-sm transition-all duration-200
                            ${isActive
                              ? 'bg-[#014596] text-white shadow-lg'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                          <span className={`mr-2 sm:mr-3 flex items-center justify-center rounded-full transition-all duration-200
                            ${isActive ? 'bg-white' : 'bg-gray-100'}
                            w-7 h-7 sm:w-8 sm:h-8`}>
                            <item.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4
                              ${isActive ? 'text-[#014596]' : 'text-gray-400'}`} />
                          </span>
                          <span className="text-sm sm:text-base">{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              {/* User Info and Logout */}
              <div className="p-2 sm:p-3 pb-4 sm:pb-6">
                <div className="bg-gray-100 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name || user?.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Выйти"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-52 xl:w-64 flex-col bg-[#F7F9FB] h-screen relative border-r border-[#E5EAF2]">
        {/* Logo */}
        <div className="p-6 pb-2 flex justify-center">
          <h1 className="text-[#014596] text-3xl font-bold">ams</h1>
        </div>
        {/* Navigation */}
        <nav className="mt-2 flex-1 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200
                      ${isActive
                        ? 'bg-[#014596] text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                  >
                    <span className={`mr-2 flex items-center justify-center rounded-full transition-all duration-200
                      ${isActive ? 'bg-white' : 'bg-gray-100'}
                      w-7 h-7`}>
                      <item.icon className={`w-4 h-4
                        ${isActive ? 'text-[#014596]' : 'text-gray-400'}`} />
                    </span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* User Info and Logout */}
        <div className="p-3">
          <div className="bg-gray-100 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Выйти"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-3 sm:p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Открыть меню"
            >
              <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </button>
            <h1 className="text-[#014596] text-lg sm:text-xl font-bold">ams</h1>
            <div className="w-9 sm:w-10"></div> {/* Spacer for center alignment */}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 xl:p-8">
          {/* Хлебные крошки и заголовок */}
          {!hideDefaultBreadcrumbs && (
            <div className="mb-6">
              <div className="text-gray-500 text-sm mb-2">Страницы /</div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
