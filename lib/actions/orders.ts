'use server'

import { createServiceClient } from '@/lib/supabase/server'

interface UpdateStatusResult {
  success: boolean
  error?: string
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: 'preparing' | 'completed'
): Promise<UpdateStatusResult> {
  try {
    const supabase = createServiceClient()

    // Validate status transition
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (fetchError) {
      return { success: false, error: 'Order not found' }
    }

    // Check valid transitions
    const validTransitions: Record<string, string[]> = {
      paid: ['preparing'],
      preparing: ['completed'],
    }

    if (!validTransitions[order.status]?.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${order.status} to ${newStatus}`,
      }
    }

    // Update order status
    const updateData: { status: string; completed_at?: string } = {
      status: newStatus,
    }

    // Set completed_at timestamp when completing order
    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return { success: false, error: 'Failed to update order status' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateOrderStatus:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
