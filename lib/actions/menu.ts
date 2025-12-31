'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

// Toggle item availability - Both admin and barista can do this
export async function updateItemAvailability(itemId: string, available: boolean) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('items')
    .update({ available })
    .eq('id', itemId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/menu')
  revalidatePath('/merchant')
  revalidatePath('/order')

  return { success: true }
}

// Create item - Admin only
export async function createItem(data: {
  category_id: string
  name: string
  description?: string
  base_price: number
  image_url?: string
  available?: boolean
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  const { data: item, error } = await supabase
    .from('items')
    .insert({
      category_id: data.category_id,
      name: data.name,
      description: data.description || null,
      base_price: data.base_price,
      image_url: data.image_url || null,
      available: data.available ?? true,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/menu')
  revalidatePath('/order')

  return { success: true, item }
}

// Update item - Admin only
export async function updateItem(
  itemId: string,
  data: {
    category_id?: string
    name?: string
    description?: string | null
    base_price?: number
    image_url?: string | null
    available?: boolean
  }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('items')
    .update(data)
    .eq('id', itemId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/menu')
  revalidatePath('/order')

  return { success: true }
}

// Delete item - Admin only
export async function deleteItem(itemId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/menu')
  revalidatePath('/order')

  return { success: true }
}

// Create category - Admin only
export async function createCategory(data: {
  name: string
  display_order?: number
  image_url?: string
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  // Get max display_order if not provided
  let displayOrder = data.display_order
  if (displayOrder === undefined) {
    const { data: categories } = await supabase
      .from('categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)

    displayOrder = categories && categories.length > 0 ? categories[0].display_order + 1 : 1
  }

  const { data: category, error } = await supabase
    .from('categories')
    .insert({
      name: data.name,
      display_order: displayOrder,
      image_url: data.image_url || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/menu')
  revalidatePath('/order')

  return { success: true, category }
}

// Update category - Admin only
export async function updateCategory(
  categoryId: string,
  data: {
    name?: string
    display_order?: number
    image_url?: string | null
  }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', categoryId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/menu')
  revalidatePath('/order')

  return { success: true }
}

// Delete category - Admin only
export async function deleteCategory(categoryId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  // Check if category has items
  const { data: items } = await supabase
    .from('items')
    .select('id')
    .eq('category_id', categoryId)
    .limit(1)

  if (items && items.length > 0) {
    return { error: 'Cannot delete category with items. Please move or delete items first.' }
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/menu')
  revalidatePath('/order')

  return { success: true }
}
