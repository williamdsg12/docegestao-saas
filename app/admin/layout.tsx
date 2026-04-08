"use client"

import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AuthGuard } from "@/components/auth/AuthGuard"

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
        </AuthGuard>
    )
}
