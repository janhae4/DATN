// components/layout/Header.tsx
import React from 'react';
import { ProjectTogglerCombobox } from './ProjectTogglerCombobox';
import { SearchBar } from './searchbar';
import { NotificationPopover } from './NotificationPopover';
import { ProfileButton } from './profile-button';
import { SidebarTrigger } from '@/components/ui/sidebar';
const Header = () => {
    return (
        <header className="mx-5 my-2 flex flex-wrap gap-2 justify-between items-center">
            <div className='flex gap-2'>
                <SidebarTrigger className="-ml-1" />
                <div className='text-lg font-semibold'>Welcome back, Alex</div>
            </div>


            <div className='flex gap-2'>
                <ProjectTogglerCombobox />
                <SearchBar />
                <NotificationPopover />
                <ProfileButton />
            </div>
        </header>
    );
};

export default Header;

