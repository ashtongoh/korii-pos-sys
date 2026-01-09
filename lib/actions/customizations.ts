'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

// ============== CUSTOMIZATION GROUPS ==============

// Create customization group - Admin only
export async function createCustomizationGroup(data: {
  name: string
  type: 'single' | 'multiple'
  required: boolean
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  const { data: group, error } = await supabase
    .from('customization_groups')
    .insert({
      name: data.name,
      type: data.type,
      required: data.required,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/customizations')
  revalidatePath('/order')

  return { success: true, group }
}

// Update customization group - Admin only
export async function updateCustomizationGroup(
  groupId: string,
  data: {
    name?: string
    type?: 'single' | 'multiple'
    required?: boolean
  }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('customization_groups')
    .update(data)
    .eq('id', groupId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/customizations')
  revalidatePath('/order')

  return { success: true }
}

// Delete customization group - Admin only
export async function deleteCustomizationGroup(groupId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  // Check if group has linked items
  const { data: linkages } = await supabase
    .from('item_customization_groups')
    .select('item_id')
    .eq('group_id', groupId)
    .limit(1)

  if (linkages && linkages.length > 0) {
    return { error: 'Cannot delete group that is linked to items. Please unlink all items first.' }
  }

  // Delete options first (if not using CASCADE)
  await supabase
    .from('customization_options')
    .delete()
    .eq('group_id', groupId)

  // Delete the group
  const { error } = await supabase
    .from('customization_groups')
    .delete()
    .eq('id', groupId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/customizations')
  revalidatePath('/order')

  return { success: true }
}

// ============== CUSTOMIZATION OPTIONS ==============

// Create customization option - Admin only
export async function createCustomizationOption(data: {
  group_id: string
  name: string
  price_modifier: number
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  const { data: option, error } = await supabase
    .from('customization_options')
    .insert({
      group_id: data.group_id,
      name: data.name,
      price_modifier: data.price_modifier,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/customizations')
  revalidatePath('/order')

  return { success: true, option }
}

// Update customization option - Admin only
export async function updateCustomizationOption(
  optionId: string,
  data: {
    name?: string
    price_modifier?: number
  }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('customization_options')
    .update(data)
    .eq('id', optionId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/customizations')
  revalidatePath('/order')

  return { success: true }
}

// Delete customization option - Admin only
export async function deleteCustomizationOption(optionId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('customization_options')
    .delete()
    .eq('id', optionId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/customizations')
  revalidatePath('/order')

  return { success: true }
}

// ============== ITEM-GROUP LINKAGES ==============

// Link customization group to item - Admin only
export async function linkCustomizationToItem(itemId: string, groupId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('item_customization_groups')
    .insert({ item_id: itemId, group_id: groupId })

  if (error) {
    if (error.code === '23505') {
      return { error: 'This customization is already linked to this item' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/customizations')
  revalidatePath('/admin/menu')
  revalidatePath('/order')

  return { success: true }
}

// Unlink customization group from item - Admin only
export async function unlinkCustomizationFromItem(itemId: string, groupId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('item_customization_groups')
    .delete()
    .eq('item_id', itemId)
    .eq('group_id', groupId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/customizations')
  revalidatePath('/admin/menu')
  revalidatePath('/order')

  return { success: true }
}

// Bulk link customization group to multiple items - Admin only
export async function bulkLinkCustomizationToItems(groupId: string, itemIds: string[]) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  if (itemIds.length === 0) {
    return { success: true }
  }

  const supabase = createServiceClient()

  const linkages = itemIds.map((itemId) => ({
    item_id: itemId,
    group_id: groupId,
  }))

  // Use upsert to handle existing linkages gracefully
  const { error } = await supabase
    .from('item_customization_groups')
    .upsert(linkages, { onConflict: 'item_id,group_id', ignoreDuplicates: true })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/customizations')
  revalidatePath('/admin/menu')
  revalidatePath('/order')

  return { success: true }
}

// Bulk unlink customization group from multiple items - Admin only
export async function bulkUnlinkCustomizationFromItems(groupId: string, itemIds: string[]) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  if (itemIds.length === 0) {
    return { success: true }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('item_customization_groups')
    .delete()
    .eq('group_id', groupId)
    .in('item_id', itemIds)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/customizations')
  revalidatePath('/admin/menu')
  revalidatePath('/order')

  return { success: true }
}

// Get all customization data for admin page - Admin only
export async function getCustomizationData() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const supabase = createServiceClient()

  const [groupsResult, itemsResult, linkagesResult] = await Promise.all([
    supabase
      .from('customization_groups')
      .select('*, options:customization_options(*)')
      .order('name'),
    supabase
      .from('items')
      .select('id, name, category:categories(name)')
      .order('name'),
    supabase
      .from('item_customization_groups')
      .select('*'),
  ])

  if (groupsResult.error) {
    return { error: groupsResult.error.message }
  }

  return {
    success: true,
    groups: groupsResult.data || [],
    items: itemsResult.data || [],
    linkages: linkagesResult.data || [],
  }
}
