import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface ProfilePayload {
  name?: string
  surname?: string
  username?: string
  phone?: string
  address?: string
  dateOfBirth?: string
}

function normalizeText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLength)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json()) as ProfilePayload
  const name = normalizeText(payload.name, 30)
  const surname = normalizeText(payload.surname, 30)
  const username = normalizeText(payload.username, 30)

  const updates: Record<string, string> = {}
  if (name) updates.name = name
  if (surname) updates.surname = surname
  if (username) updates.username = username

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("auth_id", user.id)

    if (updateError) {
      return NextResponse.json(
        { error: "Unable to update profile" },
        { status: 400 }
      )
    }
  }

  const metadata: Record<string, string> = {}
  const phone = normalizeText(payload.phone, 30)
  const address = normalizeText(payload.address, 200)
  const dateOfBirth = normalizeText(payload.dateOfBirth, 10)

  if (phone) metadata.phone = phone
  if (address) metadata.address = address
  if (dateOfBirth) metadata.dateOfBirth = dateOfBirth

  if (Object.keys(metadata).length > 0) {
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: metadata,
    })

    if (authUpdateError) {
      return NextResponse.json(
        { error: "Unable to update account metadata" },
        { status: 400 }
      )
    }
  }

  return NextResponse.json({ success: true })
}
