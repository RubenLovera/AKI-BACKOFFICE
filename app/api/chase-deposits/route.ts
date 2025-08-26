import { type NextRequest, NextResponse } from "next/server"
import https from "https"

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
    const tellerCert = process.env.TELLER_CERT
    const tellerPrivateKey = process.env.TELLER_PRIVATE_KEY

    console.log("[v0] Teller API Key exists:", !!tellerApiKey)
    console.log("[v0] Teller Account ID exists:", !!tellerAccountId)
    console.log("[v0] Teller Cert exists:", !!tellerCert)
    console.log("[v0] Teller Private Key exists:", !!tellerPrivateKey)
    console.log("[v0] Account ID format:", tellerAccountId?.substring(0, 4) + "...")

    if (!tellerApiKey || !tellerAccountId || !tellerCert || !tellerPrivateKey) {
      return NextResponse.json({ error: "Configuración de Teller.io incompleta" }, { status: 500 })
    }

    const url = `https://api.teller.io/accounts/${tellerAccountId}/transactions`
    const authHeader = `Basic ${Buffer.from(`${tellerApiKey}:`).toString("base64")}`

    console.log("[v0] Request URL:", url)
    console.log("[v0] Auth header format:", authHeader.substring(0, 20) + "...")

    const httpsAgent = new https.Agent({
      cert: tellerCert,
      key: tellerPrivateKey,
      rejectUnauthorized: true,
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        // @ts-ignore - Node.js fetch supports agent option
        agent: httpsAgent,
      })

      clearTimeout(timeoutId)

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Error response body:", errorText)
        throw new Error(`Teller API error: ${response.status}`)
      }

      const transactions: TellerTransaction[] = await response.json()

      const depositos: Deposito[] = transactions
        .filter((transaction) => {
          const amount = Number.parseFloat(transaction.amount)
          return amount > 0 && transaction.status === "posted"
        })
        .map((transaction) => ({
          id: transaction.id,
          fecha: transaction.date,
          descripcion: transaction.description || "Depósito Chase",
          monto: Number.parseFloat(transaction.amount),
        }))
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

      return NextResponse.json(depositos)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
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
