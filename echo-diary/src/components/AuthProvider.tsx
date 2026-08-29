"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthChange, type User } from "@/lib/firebase/auth"
import { ensureProfile } from "@/lib/firebase/db"
import type { UserProfile } from "@/lib/types"

interface AuthValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthValue>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthChange(async (u) => {
      setUser(u)
      if (u) {
        try {
          setProfile(await ensureProfile(u))
        } catch (err) {
          console.error("프로필을 불러오지 못했습니다:", err)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  const refreshProfile = async () => {
    if (!user) return
    setProfile(await ensureProfile(user))
  }

  return (
    <Ctx.Provider value={{ user, profile, loading, refreshProfile }}>{children}</Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
