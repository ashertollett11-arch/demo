import { supabase } from "./supabase"

// 🔑 Google login
export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:3000/student",
    },
  })
}

// 🔑 Email/password signup
export const signUpWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
  })
}

// 🔑 Email/password login
export const signInWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

// 🔑 get user
export const getUser = async () => {
  return await supabase.auth.getUser()
}