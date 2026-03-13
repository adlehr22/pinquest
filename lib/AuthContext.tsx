'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabase'
import { Profile, RoundResult } from '@/types'
import { trackSignupCompleted } from '@/utils/analytics'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    username: string,
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  saveGameToDb: (
    dateStr: string,
    totalScore: number,
    results: RoundResult[],
    streak: number,
    longestStreak: number,
  ) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const supabase = getSupabaseClient()
      if (!supabase) return { error: 'Supabase not configured' }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message ?? null }
    },
    [],
  )

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      username: string,
    ): Promise<{ error: string | null }> => {
      const supabase = getSupabaseClient()
      if (!supabase) return { error: 'Supabase not configured' }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      })
      if (!error && data.user) {
        trackSignupCompleted(data.user.id, new Date().toISOString().split('T')[0])
      }
      return { error: error?.message ?? null }
    },
    [],
  )

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const saveGameToDb = useCallback(
    async (
      dateStr: string,
      totalScore: number,
      results: RoundResult[],
      streak: number,
      longestStreak: number,
    ) => {
      const supabase = getSupabaseClient()
      if (!supabase || !user) return
      try {
        await supabase.from('games').upsert({
          user_id: user.id,
          played_date: dateStr,
          total_score: totalScore,
          round_results: results,
        })
        await supabase
          .from('profiles')
          .update({ current_streak: streak, longest_streak: longestStreak })
          .eq('id', user.id)
        await fetchProfile(user.id)
      } catch {
        // Degrade gracefully
      }
    },
    [user, fetchProfile],
  )

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        saveGameToDb,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
