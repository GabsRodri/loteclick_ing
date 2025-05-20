'use client'

import { useState, useEffect, useRef } from 'react'
import { Settings } from 'lucide-react'

export function UserMenu({ signOutAction }: { user: any, signOutAction: any }) {
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 px-4 py-1.5 bg-primary border border-primary-foreground text-primary-foreground dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
            >
                <Settings className="w-4 h-4" />
                Configuración
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-60 bg-background border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <form action={signOutAction}>
                        <button
                            type="submit"
                            className="w-full text-center px-3 py-3 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800 font-semibold tracking-wide transition-colors"
                        >
                            Cerrar sesión
                        </button>
                    </form>
                    <a
                        href="/protected/reset-password"
                        className="w-full block text-center px-10 py-3 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800 font-semibold tracking-wide transition-colors"
                    >
                        Resetear contraseña
                    </a>
                    <a
                        href="/protected/capacitacion"
                        className="w-full block text-center px-13 py-3 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800 font-semibold tracking-wide transition-colors"
                    >
                        Centro de Capacitación
                    </a>
                </div>
            )}
        </div>
    )
}
