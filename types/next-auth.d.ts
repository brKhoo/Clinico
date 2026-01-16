import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: "PATIENT" | "PROVIDER"
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: "PATIENT" | "PROVIDER" | "ADMIN"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "PATIENT" | "PROVIDER" | "ADMIN"
  }
}
