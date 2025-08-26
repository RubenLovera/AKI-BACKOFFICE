import { createClient as createSupabaseClient } from "@/lib/supabase/client"

export interface Cliente {
  id: string
  nombre_completo: string
  numero_documento: string
  foto_documento_url?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  monto: number
  cliente_id: string
  referencia_pago: string
  fecha_pago: string
  estado: "CREADA" | "PAGO RECIBIDO" | "COMPLETADA" | "CANCELADA"
  monto_pagar: number
  monto_menos_costo: number
  costo_proveedor: number
  revenue_bruto: number
  revenue_neto: number
  liquidacion: number
  created_at: string
  updated_at: string
  clientes?: Cliente
}

export interface DashboardMetrics {
  totalOrders: number
  totalVolume: number
  totalClients: number
  totalRevenue: number
  totalCosts: number
  totalLiquidacion: number
}

export type Transaccion = Transaction

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createSupabaseClient()

  try {
    console.log("[v0] Fetching dashboard metrics...")

    // Get total transactions count
    const { count: totalOrders } = await supabase.from("transacciones").select("*", { count: "exact", head: true })
    console.log("[v0] Total orders count:", totalOrders)

    // Get total clients count
    const { count: totalClients } = await supabase.from("clientes").select("*", { count: "exact", head: true })
    console.log("[v0] Total clients count:", totalClients)

    // Get financial metrics
    const { data: financialData } = await supabase
      .from("transacciones")
      .select("monto, revenue_neto, costo_proveedor, liquidacion")
    console.log("[v0] Financial data:", financialData)

    const totalVolume = financialData?.reduce((sum, t) => sum + (t.monto || 0), 0) || 0
    const totalRevenue = financialData?.reduce((sum, t) => sum + (t.revenue_neto || 0), 0) || 0
    const totalCosts = financialData?.reduce((sum, t) => sum + (t.costo_proveedor || 0), 0) || 0
    const totalLiquidacion = financialData?.reduce((sum, t) => sum + (t.liquidacion || 0), 0) || 0

    const metrics = {
      totalOrders: totalOrders || 0,
      totalVolume,
      totalClients: totalClients || 0,
      totalRevenue,
      totalCosts,
      totalLiquidacion,
    }

    console.log("[v0] Final metrics:", metrics)
    return metrics
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error)
    return {
      totalOrders: 0,
      totalVolume: 0,
      totalClients: 0,
      totalRevenue: 0,
      totalCosts: 0,
      totalLiquidacion: 0,
    }
  }
}

export async function getRecentTransactions(limit = 10): Promise<Transaction[]> {
  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("transacciones")
      .select(`
        *,
        clientes (
          nombre_completo,
          numero_documento
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching recent transactions:", error)
    return []
  }
}

export async function getAllClients(): Promise<Cliente[]> {
  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase.from("clientes").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching clients:", error)
    return []
  }
}

export async function createClient(
  clientData: Omit<Cliente, "id" | "created_at" | "updated_at">,
): Promise<Cliente | null> {
  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase.from("clientes").insert(clientData).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating client:", error)
    return null
  }
}

export async function updateClient(
  id: string,
  clientData: Partial<Omit<Cliente, "id" | "created_at" | "updated_at">>,
): Promise<Cliente | null> {
  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase.from("clientes").update(clientData).eq("id", id).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating client:", error)
    return null
  }
}

export async function deleteClient(id: string): Promise<boolean> {
  const supabase = createSupabaseClient()

  try {
    const { error } = await supabase.from("clientes").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting client:", error)
    return false
  }
}

export async function getClientById(id: string): Promise<Cliente | null> {
  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase.from("clientes").select("*").eq("id", id).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching client:", error)
    return null
  }
}

export async function createTransaction(
  transactionData: Omit<
    Transaction,
    | "id"
    | "created_at"
    | "updated_at"
    | "monto_pagar"
    | "monto_menos_costo"
    | "costo_proveedor"
    | "revenue_bruto"
    | "revenue_neto"
    | "liquidacion"
    | "estado"
  >,
): Promise<Transaction | null> {
  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("transacciones")
      .insert(transactionData)
      .select(`
        *,
        clientes (
          nombre_completo,
          numero_documento
        )
      `)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating transaction:", error)
    return null
  }
}

export async function updateTransaction(
  id: string,
  transactionData: Partial<
    Omit<
      Transaction,
      | "id"
      | "created_at"
      | "updated_at"
      | "monto_pagar"
      | "monto_menos_costo"
      | "costo_proveedor"
      | "revenue_bruto"
      | "revenue_neto"
      | "liquidacion"
    >
  >,
): Promise<Transaction | null> {
  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("transacciones")
      .update(transactionData)
      .eq("id", id)
      .select(`
        *,
        clientes (
          nombre_completo,
          numero_documento
        )
      `)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating transaction:", error)
    return null
  }
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const supabase = createSupabaseClient()

  try {
    const { error } = await supabase.from("transacciones").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return false
  }
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("transacciones")
      .select(`
        *,
        clientes (
          nombre_completo,
          numero_documento
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return null
  }
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("transacciones")
      .select(`
        *,
        clientes (
          nombre_completo,
          numero_documento
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching all transactions:", error)
    return []
  }
}

export async function searchClientsByDocument(documento: string): Promise<Cliente[]> {
  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .ilike("numero_documento", `%${documento}%`)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error searching clients:", error)
    return []
  }
}

export async function getClientTransactionCount(clientId: string): Promise<number> {
  const supabase = createSupabaseClient()

  try {
    const { count, error } = await supabase
      .from("transacciones")
      .select("*", { count: "exact", head: true })
      .eq("cliente_id", clientId)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error("Error fetching client transaction count:", error)
    return 0
  }
}

export async function updateTransactionStatus(
  id: string,
  estado: "CREADA" | "PAGO RECIBIDO" | "COMPLETADA" | "CANCELADA",
): Promise<Transaction | null> {
  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("transacciones")
      .update({ estado })
      .eq("id", id)
      .select(`
        *,
        clientes (
          nombre_completo,
          numero_documento
        )
      `)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating transaction status:", error)
    return null
  }
}

export { getAllTransactions as getTransactions }
export { getAllClients as getClientes }
