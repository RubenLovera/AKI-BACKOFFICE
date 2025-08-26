"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RefreshCw, TrendingUp, DollarSign, Calendar, Filter } from "lucide-react"

interface Deposito {
  id: string
  fecha: string
  descripcion: string
  monto: number
}

type DateFilter = "hoy" | "semana" | "30dias" | "personalizado"

export function Zelle() {
  const [depositos, setDepositos] = useState<Deposito[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filtroFecha, setFiltroFecha] = useState<DateFilter>("30dias")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")

  useEffect(() => {
    fetchDeposits()
  }, [])

  const fetchDeposits = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/chase-deposits")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error conectando con Chase")
      }

      const data: Deposito[] = await response.json()
      setDepositos(data)
    } catch (error) {
      console.error("Error fetching deposits:", error)
      setError(error instanceof Error ? error.message : "Error conectando con Chase")
    } finally {
      setIsLoading(false)
    }
  }

  const actualizarDepositos = async () => {
    await fetchDeposits()
  }

  const calcularRangoFecha = (filtro: DateFilter) => {
    const hoy = new Date()
    const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

    switch (filtro) {
      case "hoy":
        return {
          inicio: inicioDelDia,
          fin: new Date(inicioDelDia.getTime() + 24 * 60 * 60 * 1000 - 1),
        }
      case "semana":
        const inicioSemana = new Date(inicioDelDia)
        inicioSemana.setDate(inicioSemana.getDate() - 7)
        return {
          inicio: inicioSemana,
          fin: hoy,
        }
      case "30dias":
        const inicio30Dias = new Date(inicioDelDia)
        inicio30Dias.setDate(inicio30Dias.getDate() - 30)
        return {
          inicio: inicio30Dias,
          fin: hoy,
        }
      case "personalizado":
        return {
          inicio: fechaInicio ? new Date(fechaInicio) : new Date(0),
          fin: fechaFin ? new Date(fechaFin + "T23:59:59") : hoy,
        }
      default:
        return { inicio: new Date(0), fin: hoy }
    }
  }

  const depositosFiltrados = depositos.filter((deposito) => {
    const fechaDeposito = new Date(deposito.fecha)
    const { inicio, fin } = calcularRangoFecha(filtroFecha)
    return fechaDeposito >= inicio && fechaDeposito <= fin
  })

  const totalDepositosMes = depositosFiltrados.reduce((total, deposito) => total + deposito.monto, 0)

  const obtenerEtiquetaFiltro = () => {
    switch (filtroFecha) {
      case "hoy":
        return "hoy"
      case "semana":
        return "últimos 7 días"
      case "30dias":
        return "últimos 30 días"
      case "personalizado":
        return "período personalizado"
      default:
        return "período seleccionado"
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(monto)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-space-grotesk">Zelle - Depósitos Chase</h1>
        <p className="text-muted-foreground">Gestión y seguimiento de depósitos recibidos</p>
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-green-800">Total Depósitos del Mes</CardTitle>
            <CardDescription className="text-green-600">Ingresos de {obtenerEtiquetaFiltro()}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <Button
              onClick={actualizarDepositos}
              disabled={isLoading}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-100 bg-transparent"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Actualizar Depósitos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            <span className="text-4xl font-bold text-green-700">{formatearMonto(totalDepositosMes)}</span>
          </div>
          <p className="text-sm text-green-600 mt-2">{depositosFiltrados.length} depósitos registrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Historial de Depósitos</span>
              </CardTitle>
              <CardDescription>Lista completa de depósitos recibidos via Chase y Zelle</CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={filtroFecha} onValueChange={(value: DateFilter) => setFiltroFecha(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrar por fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoy">Hoy</SelectItem>
                    <SelectItem value="semana">Esta semana</SelectItem>
                    <SelectItem value="30dias">Últimos 30 días</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filtroFecha === "personalizado" && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-36"
                    placeholder="Fecha inicio"
                  />
                  <span className="text-gray-500">-</span>
                  <Input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-36"
                    placeholder="Fecha fin"
                  />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-green-600">Actualizando depósitos...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 font-medium">{error}</p>
                <Button onClick={fetchDeposits} variant="outline" className="mt-4 bg-transparent">
                  Reintentar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-2 border-b border-gray-200 font-semibold text-sm text-gray-600">
                <div>Fecha</div>
                <div className="md:col-span-2">Descripción</div>
                <div className="text-right">Monto</div>
              </div>

              {depositosFiltrados.map((deposito) => (
                <div
                  key={deposito.id}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm text-gray-600">{formatearFecha(deposito.fecha)}</div>
                  <div className="md:col-span-2 text-sm font-medium">{deposito.descripcion}</div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold">
                      {formatearMonto(deposito.monto)}
                    </Badge>
                  </div>
                </div>
              ))}

              {depositosFiltrados.length === 0 && depositos.length > 0 && (
                <div className="text-center py-8 text-gray-500">No hay depósitos en el período seleccionado</div>
              )}

              {depositos.length === 0 && (
                <div className="text-center py-8 text-gray-500">No hay depósitos recientes</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
