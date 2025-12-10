import { AppSidebar } from "@/components/sidebar/app-sidebar";
import styles from "./layout.module.css";
import Header from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TeamProvider } from "@/contexts/TeamContext";
import { TeamGuard } from "@/providers/team-guard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <TeamProvider>
      <TeamGuard>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className=" h-screen w-screen overflow-x-hidden">
            <div className={styles.mainLayout}>
              <main className={styles.content}>
                <Header />
                <div className={styles.pageWrapper}>{children}</div>
              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TeamGuard>
    </TeamProvider>
  );
}
