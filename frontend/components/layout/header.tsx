"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BellIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectTogglerCombobox } from './ProjectTogglerCombobox';
import { SearchBar } from './searchbar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import NotificationPopover from './NotificationPopover';
import { TaskApprovalModal } from '@/components/features/backlogs/task/TaskApprovalModal';
import { TaskRequestModal } from '@/components/features/backlogs/task/TaskRequestModal';

// Dynamically import components that use client-side features
const ProfileButton = dynamic(
    () => import('./profile-button').then((mod) => mod.ProfileButton),
    { ssr: false }
);

// const NotificationPopover = dynamic(
//   () => import('./notification-popover').then((mod) => mod.NotificationPopover),
//   { ssr: false }
// );

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="mx-2 md:mx-5 my-2 flex flex-wrap md:flex-nowrap gap-2 justify-between items-center">
            <div className='flex items-center gap-2 shrink-0'>
                <SidebarTrigger className='md:hidden' />
                <div className='text-xs md:text-sm font-semibold truncate max-w-[150px] md:max-w-none'>
                    Welcome back, <span className="inline-flex items-center font-bold">
                        {user?.name || '...'}
                    </span>
                </div>
            </div>

            <div className='flex gap-1 md:gap-2 items-center flex-wrap md:flex-nowrap justify-end flex-1 min-w-0'>
                <div className="hidden sm:block shrink-0">
                    <ProjectTogglerCombobox />
                </div>
                <div className="flex-1 min-w-[150px] max-w-md mx-1">
                    <SearchBar />
                </div>
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                    <TaskApprovalModal />
                    <TaskRequestModal />
                    <Suspense fallback={<Button variant="outline" size="icon" className="h-8 w-8"><BellIcon className="h-4 w-4 opacity-50" /></Button>}>
                        <NotificationPopover />
                    </Suspense>
                    <ProfileButton />
                </div>
            </div>
        </header>
    );
};

export default Header;

