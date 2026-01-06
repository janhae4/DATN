"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { ProjectTogglerCombobox } from './ProjectTogglerCombobox';
import { SearchBar } from './searchbar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import NotificationPopover from './NotificationPopover';

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
        <header className="mx-5 my-2 flex flex-wrap gap-2 justify-between items-center">
            <div className='flex gap-2'>
                <SidebarTrigger className='block md:hidden' />
                <div className='text-sm font-semibold'>
                    Welcome back, <span className="inline-flex items-center">
                        <span className=" text-lg animate-pulse">{user?.name || '...'}</span>
                    </span>
                </div>
            </div>

            <div className='flex gap-2 items-center'>
                <ProjectTogglerCombobox />
                <SearchBar />
                <NotificationPopover />
                <ProfileButton />
            </div>
        </header>
    );
};

export default Header;

