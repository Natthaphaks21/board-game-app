import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentAppUserId } from "@/lib/backend/party-data"

interface ChatMessageRow {
  id: number
  party_id: number
  sender_id: number
  sender_name: string
  message: string
  created_at: string
}

async function canAccessPartyChat(
  supabase: any,
  partyId: number,
  currentAppUserId: number
): Promise<boolean> {
  const { data: party, error: partyError } = await supabase
    .from("parties")
    .select("host_id")
    .eq("pid", partyId)
    .maybeSingle()

  if (partyError || !party) return false
  if (party.host_id === currentAppUserId) return true

  const { data: join, error: joinError } = await supabase
    .from("party_joins")
    .select("status")
    .eq("party_id", partyId)
    .eq("user_id", currentAppUserId)
    .maybeSingle()

  if (joinError || !join) return false
  return join.status === "pending" || join.status === "accepted"
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const partyId = Number(params.id)

  if (!Number.isFinite(partyId)) {
    return NextResponse.json({ error: "Invalid party id." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentAppUserId = await getCurrentAppUserId(supabase, user.id)
  if (!currentAppUserId) {
    return NextResponse.json({ error: "Profile not found." }, { status: 400 })
  }

  const allowed = await canAccessPartyChat(supabase, partyId, currentAppUserId)
  if (!allowed) {
    return NextResponse.json({ error: "You cannot access this chat." }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const requestedLimit = Number(searchParams.get("limit") ?? 60)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 120)
    : 60

  const { data: rows, error } = await supabase
    .from("party_messages")
    .select("id,party_id,sender_id,sender_name,message,created_at")
    .eq("party_id", partyId)
    .order("created_at", { ascending: true })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: "Unable to load chat messages." }, { status: 500 })
  }

  const messages = (rows ?? []) as ChatMessageRow[]

  return NextResponse.json({
    messages: messages.map((message) => {
      return {
        id: message.id,
        partyId: message.party_id,
        senderId: message.sender_id,
        senderName: message.sender_name || "Player",
        senderUsername: null,
        message: message.message,
        createdAt: message.created_at,
        isMine: message.sender_id === currentAppUserId,
      }
    }),
  })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const partyId = Number(params.id)

  if (!Number.isFinite(partyId)) {
    return NextResponse.json({ error: "Invalid party id." }, { status: 400 })
  }

  const payload = (await request.json().catch(() => null)) as
    | { message?: string }
    | null

  const message = typeof payload?.message === "string" ? payload.message.trim() : ""
  if (message.length < 1) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 })
  }

  if (message.length > 500) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentAppUserId = await getCurrentAppUserId(supabase, user.id)
  if (!currentAppUserId) {
    return NextResponse.json({ error: "Profile not found." }, { status: 400 })
  }

  const allowed = await canAccessPartyChat(supabase, partyId, currentAppUserId)
  if (!allowed) {
    return NextResponse.json({ error: "You cannot access this chat." }, { status: 403 })
  }

  const { data: senderProfile } = await supabase
    .from("users")
    .select("name,surname,username")
    .eq("uid", currentAppUserId)
    .maybeSingle()

  const senderName =
    typeof senderProfile?.username === "string" && senderProfile.username.trim().length > 0
      ? senderProfile.username.trim()
      : `${senderProfile?.name ?? ""} ${senderProfile?.surname ?? ""}`.trim() || "Player"

  const { data: inserted, error: insertError } = await supabase
    .from("party_messages")
    .insert({
      party_id: partyId,
      sender_id: currentAppUserId,
      sender_name: senderName,
      message,
    })
    .select("id,party_id,sender_id,sender_name,message,created_at")
    .single()

  if (insertError) {
    return NextResponse.json({ error: "Unable to send message." }, { status: 400 })
  }

  const typedInserted = inserted as ChatMessageRow

  return NextResponse.json({
    success: true,
    message: {
      id: typedInserted.id,
      partyId: typedInserted.party_id,
      senderId: typedInserted.sender_id,
      senderName: typedInserted.sender_name || senderName,
      senderUsername: null,
      message: typedInserted.message,
      createdAt: typedInserted.created_at,
      isMine: true,
    },
  })
}
