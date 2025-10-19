
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import styles from './layout.module.css';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className={styles.mainLayout}>
                    <main className={styles.content}>
                        <Header />
                        <div className={styles.pageWrapper}>
                            {children}
                        </div>
                    </main>
                </div></SidebarInset>
        </SidebarProvider>);
}

