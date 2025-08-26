import { type NextRequest, NextResponse } from "next/server"
import https from "https"
import { URL } from "url"

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

    let decodedCert: string
    let decodedKey: string

    if (tellerCert.startsWith("-----BEGIN")) {
      // Already in PEM format
      decodedCert = tellerCert
    } else {
      // Decode from base64
      decodedCert = Buffer.from(tellerCert, "base64").toString("utf-8")
    }

    if (tellerPrivateKey.startsWith("-----BEGIN")) {
      // Already in PEM format
      decodedKey = tellerPrivateKey
    } else {
      // Decode from base64
      decodedKey = Buffer.from(tellerPrivateKey, "base64").toString("utf-8")
    }

    console.log("[v0] Cert format check - starts with BEGIN:", decodedCert.startsWith("-----BEGIN"))
    console.log("[v0] Key format check - starts with BEGIN:", decodedKey.startsWith("-----BEGIN"))
    console.log("[v0] Cert starts with:", decodedCert.substring(0, 30) + "...")
    console.log("[v0] Key starts with:", decodedKey.substring(0, 30) + "...")

    const url = `https://api.teller.io/accounts/${tellerAccountId}/transactions`
    const authHeader = `Basic ${Buffer.from(`${tellerApiKey}:`).toString("base64")}`

    console.log("[v0] Request URL:", url)
    console.log("[v0] Auth header format:", authHeader.substring(0, 20) + "...")

    const urlObj = new URL(url)

    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cert: decodedCert,
      key: decodedKey,
      rejectUnauthorized: true,
      timeout: 10000,
    }

    console.log("[v0] HTTPS options configured with certificates")

    const response = await new Promise<{ status: number; headers: any; body: string }>((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = ""

        res.on("data", (chunk) => {
          body += chunk
        })

        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: body,
          })
        })
      })

      req.on("error", (error) => {
        console.error("[v0] HTTPS request error:", error)
        reject(error)
      })

      req.on("timeout", () => {
        req.destroy()
        reject(new Error("Request timeout"))
      })

      req.end()
    })

    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response headers:", response.headers)

    if (response.status !== 200) {
      console.log("[v0] Error response body:", response.body)
      throw new Error(`Teller API error: ${response.status}`)
    }

    const transactions: TellerTransaction[] = JSON.parse(response.body)

    const depositos: Deposito[] = transactions
      .filter((transaction) => {
        const amount = Number.parseFloat(transaction.amount)
        return amount > 0 && (transaction.status === "posted" || transaction.status === "pending")
      })
      .map((transaction) => ({
        id: transaction.id,
        fecha: transaction.date,
        descripcion: transaction.description || "Depósito Chase",
        monto: Number.parseFloat(transaction.amount),
      }))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

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
