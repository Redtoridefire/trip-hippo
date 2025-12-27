"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: "start" | "center" | "end"
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  destructive?: boolean
}

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({ open: false, setOpen: () => {} })

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-dropdown]")) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("click", handleClickOutside)
    }

    return () => document.removeEventListener("click", handleClickOutside)
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block" data-dropdown>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        setOpen(!open)
        ;(children as React.ReactElement<any>).props.onClick?.(e)
      },
    })
  }

  return (
    <button onClick={() => setOpen(!open)} type="button">
      {children}
    </button>
  )
}

function DropdownMenuContent({
  children,
  align = "end",
  className,
}: DropdownMenuContentProps) {
  const { open } = React.useContext(DropdownMenuContext)

  if (!open) return null

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
    >
      {children}
    </div>
  )
}

function DropdownMenuItem({
  children,
  onClick,
  className,
  destructive,
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext)

  return (
    <button
      className={cn(
        "flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100",
        destructive && "text-red-600 hover:bg-red-50",
        className
      )}
      onClick={() => {
        onClick?.()
        setOpen(false)
      }}
      type="button"
    >
      {children}
    </button>
  )
}

function DropdownMenuSeparator() {
  return <div className="-mx-1 my-1 h-px bg-gray-200" />
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
