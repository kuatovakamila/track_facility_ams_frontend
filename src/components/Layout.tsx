import { useState } from 'react';
import type { ReactNode } from 'react';
import { HomeIcon, ExclamationTriangleIcon, VideoCameraIcon, DocumentIcon, UserIcon, Bars3Icon, ArrowRightOnRectangleIcon, BellIcon, ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LayoutProps {
  children: ReactNode;
  title: string;
  breadcrumb?: string;
  hideDefaultBreadcrumbs?: boolean;
}

const Layout = ({ children, title, breadcrumb: _breadcrumb, hideDefaultBreadcrumbs = false }: LayoutProps) => {
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

  const NavItems = ({ onItemClick }: { onItemClick?: () => void }) => (
    <ul className="space-y-1 px-2">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <li key={item.name}>
            <Link
              to={item.href}
              onClick={onItemClick}
              className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium text-sm transition-all duration-200 ${isActive ? 'bg-[#014596] text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              <span className={`mr-2 sm:mr-3 flex items-center justify-center rounded-full transition-all duration-200 ${isActive ? 'bg-white' : 'bg-gray-100'} w-7 h-7 sm:w-8 sm:h-8`}>
                <item.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-[#014596]' : 'text-gray-400'}`} />
              </span>
              <span className="text-sm sm:text-base">{item.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const UserFooter = () => (
    <div className="bg-gray-100 rounded-xl p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{user?.name || user?.email}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="ml-2 h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
          title="Выйти"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Sheet Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-[#F7F9FB] border-r border-[#E5EAF2]">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="text-[#014596] text-2xl font-bold text-left">ams</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 h-[calc(100vh-140px)] mt-2">
            <NavItems onItemClick={() => setIsMobileMenuOpen(false)} />
          </ScrollArea>
          <div className="p-3">
            <UserFooter />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-52 xl:w-64 flex-col bg-[#F7F9FB] h-screen relative border-r border-[#E5EAF2]">
        <div className="p-6 pb-2 flex justify-center">
          <h1 className="text-[#014596] text-3xl font-bold">ams</h1>
        </div>
        <ScrollArea className="flex-1 mt-2">
          <NavItems />
        </ScrollArea>
        <div className="p-3 pb-4">
          <UserFooter />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-3 sm:p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Открыть меню"
            >
              <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </Button>
            <h1 className="text-[#014596] text-lg sm:text-xl font-bold">ams</h1>
            <div className="w-9 sm:w-10" />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 xl:p-8">
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
