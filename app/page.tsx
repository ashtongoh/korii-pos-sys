import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to order page (customer iPad interface)
  redirect('/order')
}
