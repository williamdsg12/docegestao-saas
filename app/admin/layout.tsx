import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { AdminCommandMenu } from "@/components/admin/AdminCommandMenu"

export default function AdminLayout({ 
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard requireAdmin>
            <AdminSidebar>
                {children}
            </AdminSidebar>
            <AdminCommandMenu />
        </AuthGuard>
    )
}

