import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { AdminLayoutWrapper } from '@/components/admin/admin-layout-wrapper'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    redirect('/login')
  }

  return <AdminLayoutWrapper user={user}>{children}</AdminLayoutWrapper>
}
