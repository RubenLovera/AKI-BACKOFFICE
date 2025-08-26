import { type NextRequest, NextResponse } from "next/server"

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

    if (!tellerApiKey || !tellerAccountId) {
      return NextResponse.json({ error: "Configuración de Teller.io incompleta" }, { status: 500 })
    }

    // Llamada a Teller.io API
    const response = await fetch(`https://api.teller.io/accounts/${tellerAccountId}/transactions`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${tellerApiKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
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
    console.error("Error fetching Chase deposits:", error)

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Timeout conectando con Chase" }, { status: 408 })
    }

    return NextResponse.json({ error: "Error conectando con Chase" }, { status: 500 })
  }
}
