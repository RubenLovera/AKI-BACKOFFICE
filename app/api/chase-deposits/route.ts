import { type NextRequest, NextResponse } from "next/server"
import { AbortSignal } from "abort-controller"

interface TellerTransaction {
  id: string
  date: string
  description: string
  amount: string
  type: string
  status: string
}

interface Deposito {
  id: string
  fecha: string
  descripcion: string
  monto: number
}

export async function GET(request: NextRequest) {
  try {
    const tellerApiKey = process.env.TELLER_API_KEY
    const tellerAccountId = process.env.TELLER_ACCOUNT_ID

    console.log("[v0] Teller API Key exists:", !!tellerApiKey)
    console.log("[v0] Teller Account ID exists:", !!tellerAccountId)
    console.log("[v0] Account ID format:", tellerAccountId?.substring(0, 4) + "...")

    if (!tellerApiKey || !tellerAccountId) {
      return NextResponse.json({ error: "Configuración de Teller.io incompleta" }, { status: 500 })
    }

    const url = `https://api.teller.io/accounts/${tellerAccountId}/transactions`
    const authHeader = `Basic ${Buffer.from(`${tellerApiKey}:`).toString("base64")}`

    console.log("[v0] Request URL:", url)
    console.log("[v0] Auth header format:", authHeader.substring(0, 20) + "...")

    // Llamada a Teller.io API
    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000),
    })

    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Error response body:", errorText)
      throw new Error(`Teller API error: ${response.status}`)
    }

    const transactions: TellerTransaction[] = await response.json()

    // Filtrar solo depósitos (amount > 0) y formatear datos
    const depositos: Deposito[] = transactions
      .filter((transaction) => {
        const amount = Number.parseFloat(transaction.amount)
        return amount > 0 && transaction.status === "posted"
      })
      .map((transaction) => ({
        id: transaction.id,
        fecha: transaction.date, // Ya viene en formato ISO
        descripcion: transaction.description || "Depósito Chase",
        monto: Number.parseFloat(transaction.amount),
      }))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) // Más recientes primero

    return NextResponse.json(depositos)
  } catch (error) {
    console.error("[v0] Detailed error:", error)
    console.error("[v0] Error name:", error instanceof Error ? error.name : "Unknown")
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown")

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Timeout conectando con Chase" }, { status: 408 })
    }

    return NextResponse.json({ error: "Error conectando con Chase" }, { status: 500 })
  }
}
