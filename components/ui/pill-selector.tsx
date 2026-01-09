'use client'

import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cn } from '@/lib/utils'

interface PillOption {
  value: string
  label: string
  sublabel?: string // For price modifiers like "+$0.50"
}

interface PillSelectorProps {
  value: string
  onValueChange: (value: string) => void
  options: PillOption[]
  className?: string
  /** Orientation of the pills */
  orientation?: 'horizontal' | 'vertical'
  /** Allow wrapping for many options */
  wrap?: boolean
}

/**
 * PillSelector - Touch-optimized segmented control
 *
 * Designed for kiosk/iPad use with 44px minimum touch targets.
 * Follows Japanese tea house minimalism aesthetic.
 */
export function PillSelector({
  value,
  onValueChange,
  options,
  className,
  orientation = 'horizontal',
  wrap = true,
}: PillSelectorProps) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(newValue) => {
        // Radix returns empty string when deselecting - prevent this for required fields
        if (newValue) {
          onValueChange(newValue)
        }
      }}
      className={cn(
        'inline-flex gap-2',
        orientation === 'horizontal' && wrap && 'flex-wrap',
        orientation === 'vertical' && 'flex-col',
        className
      )}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            // Base styles
            'group relative inline-flex items-center justify-center',
            'rounded-lg px-4 py-2.5',
            'text-sm font-medium',
            'transition-all duration-200 ease-out',

            // Touch target - 44px minimum height
            'min-h-[44px]',

            // Default (unselected) state
            'bg-muted text-muted-foreground',
            'border border-transparent',

            // Hover state (unselected)
            'hover:bg-muted/80 hover:text-foreground',

            // Selected state - primary green
            'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
            'data-[state=on]:shadow-zen',

            // Focus visible
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',

            // Disabled
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          <span className="relative z-10">{option.label}</span>

          {option.sublabel && (
            <span
              className={cn(
                'ml-1.5 text-xs',
                'transition-colors duration-200',
                // Muted in default state, slightly visible when selected
                'text-muted-foreground/70',
                'group-data-[state=on]:text-primary-foreground/70'
              )}
            >
              {option.sublabel}
            </span>
          )}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}

/**
 * Multi-select variant using checkboxes styled as pills
 */
interface MultiPillSelectorProps {
  values: string[]
  onValuesChange: (values: string[]) => void
  options: PillOption[]
  className?: string
  wrap?: boolean
}

export function MultiPillSelector({
  values,
  onValuesChange,
  options,
  className,
  wrap = true,
}: MultiPillSelectorProps) {
  return (
    <ToggleGroupPrimitive.Root
      type="multiple"
      value={values}
      onValueChange={onValuesChange}
      className={cn(
        'inline-flex gap-2',
        wrap && 'flex-wrap',
        className
      )}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            // Base styles
            'group relative inline-flex items-center justify-center',
            'rounded-lg px-4 py-2.5',
            'text-sm font-medium',
            'transition-all duration-200 ease-out',

            // Touch target
            'min-h-[44px]',

            // Default state
            'bg-muted text-muted-foreground',
            'border border-transparent',

            // Hover
            'hover:bg-muted/80 hover:text-foreground',

            // Selected - accent gold for multi-select to differentiate
            'data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
            'data-[state=on]:shadow-zen',

            // Focus
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',

            // Disabled
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          <span className="relative z-10">{option.label}</span>

          {option.sublabel && (
            <span
              className={cn(
                'ml-1.5 text-xs',
                'transition-colors duration-200',
                'text-muted-foreground/70',
                'group-data-[state=on]:text-accent-foreground/70'
              )}
            >
              {option.sublabel}
            </span>
          )}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
