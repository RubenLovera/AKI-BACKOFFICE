"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, Download, Plus, Search, Filter, ArrowUpDown, Eye, X } from "lucide-react"
import { getTransactions, getClientes, updateTransactionStatus, type Transaccion, type Cliente } from "@/lib/database"
import { CreateTransactionModal } from "@/components/create-transaction-modal"

interface TransactionFilters {
  search: string
  cliente: string
  fechaInicio: string
  fechaFin: string
  montoMin: string
  montoMax: string
}

interface SortConfig {
  key: keyof Transaccion | "cliente_nombre"
  direction: "asc" | "desc"
}

export function Transactions() {
  const [transacciones, setTransacciones] = useState<(Transaccion & { cliente_nombre: string })[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "created_at", direction: "desc" })
  const [selectedTransaction, setSelectedTransaction] = useState<(Transaccion & { cliente_nombre: string }) | null>(
    null,
  )
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const [filters, setFilters] = useState<TransactionFilters>({
    search: "",
    cliente: "",
    fechaInicio: "",
    fechaFin: "",
    montoMin: "",
    montoMax: "",
  })

  const itemsPerPage = 10

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [transaccionesData, clientesData] = await Promise.all([getTransactions(), getClientes()])

      const transaccionesConClientes = transaccionesData.map((transaccion) => {
        const cliente = clientesData.find((c) => c.id === transaccion.cliente_id)
        return {
          ...transaccion,
          cliente_nombre: cliente?.nombre_completo || "Cliente no encontrado",
        }
      })

      setTransacciones(transaccionesConClientes)
      setClientes(clientesData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (
    transactionId: string,
    newStatus: "CREADA" | "PAGO RECIBIDO" | "COMPLETADA" | "CANCELADA",
  ) => {
    try {
      const updatedTransaction = await updateTransactionStatus(transactionId, newStatus)
      if (updatedTransaction) {
        // Update local state
        setTransacciones((prev) => prev.map((t) => (t.id === transactionId ? { ...t, estado: newStatus } : t)))
      }
    } catch (error) {
      console.error("Error updating transaction status:", error)
    }
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "CREADA":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Creada
          </Badge>
        )
      case "PAGO RECIBIDO":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Pago Recibido
          </Badge>
        )
      case "COMPLETADA":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Completada
          </Badge>
        )
      case "CANCELADA":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Cancelada
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Desconocido
          </Badge>
        )
    }
  }

  const getStatusSelectorClass = (estado: string) => {
    switch (estado) {
      case "CREADA":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "PAGO RECIBIDO":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "COMPLETADA":
        return "bg-green-100 text-green-800 border-green-200"
      case "CANCELADA":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = transacciones.filter((transaccion) => {
      const matchesSearch =
        transaccion.cliente_nombre.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaccion.referencia_pago.toLowerCase().includes(filters.search.toLowerCase())

      const matchesCliente = !filters.cliente || filters.cliente === "all" || transaccion.cliente_id === filters.cliente

      const matchesFecha =
        (!filters.fechaInicio || transaccion.fecha_pago >= filters.fechaInicio) &&
        (!filters.fechaFin || transaccion.fecha_pago <= filters.fechaFin)

      const matchesMonto =
        (!filters.montoMin || transaccion.monto >= Number.parseFloat(filters.montoMin)) &&
        (!filters.montoMax || transaccion.monto <= Number.parseFloat(filters.montoMax))

      return matchesSearch && matchesCliente && matchesFecha && matchesMonto
    })

    // Ordenar
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [transacciones, filters, sortConfig])

  const handleSort = (key: keyof Transaccion | "cliente_nombre") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  const handleTransactionSuccess = () => {
    loadData()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-VE")
  }

  const handleViewDetails = (transaccion: Transaccion & { cliente_nombre: string }) => {
    setSelectedTransaction(transaccion)
    setIsDetailModalOpen(true)
  }

  const [isModalOpen, setIsModalOpen] = useState(false)

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-space-grotesk">Transacciones</h1>
          <p className="text-muted-foreground">Gestión y seguimiento de todas las transacciones</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Transacción
        </Button>
      </div>

      <CreateTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTransactionSuccess}
      />

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Detalles de Transacción
              <Button variant="ghost" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                  <p className="text-sm font-semibold">{selectedTransaction.cliente_nombre}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha</label>
                  <p className="text-sm">{formatDate(selectedTransaction.fecha_pago)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Referencia</label>
                  <p className="text-sm font-mono">{selectedTransaction.referencia_pago}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900">Monto Original</label>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedTransaction.monto)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.estado)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-emerald-600">Monto a Pagar</label>
                  <p className="text-sm font-semibold text-emerald-700">
                    {formatCurrency(selectedTransaction.monto_pagar)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-red-600">Costo Proveedor</label>
                  <p className="text-sm font-semibold text-red-700">
                    {formatCurrency(selectedTransaction.costo_proveedor)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-600">Revenue Neto</label>
                  <p className="text-sm font-semibold text-blue-700">
                    {formatCurrency(selectedTransaction.revenue_neto)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-600">Liquidación</label>
                  <p className="text-lg font-bold text-amber-700">{formatCurrency(selectedTransaction.liquidacion)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros</span>
            </div>
            <Button
              variant="outline"
              onClick={() => window.dispatchEvent(new CustomEvent("transactionCreated"))}
              disabled={filteredAndSortedTransactions.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>

            <Select
              value={filters.cliente}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, cliente: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Fecha inicio"
              value={filters.fechaInicio}
              onChange={(e) => setFilters((prev) => ({ ...prev, fechaInicio: e.target.value }))}
            />

            <Input
              type="date"
              placeholder="Fecha fin"
              value={filters.fechaFin}
              onChange={(e) => setFilters((prev) => ({ ...prev, fechaFin: e.target.value }))}
            />

            <Input
              type="number"
              placeholder="Monto mín."
              value={filters.montoMin}
              onChange={(e) => setFilters((prev) => ({ ...prev, montoMin: e.target.value }))}
            />

            <Input
              type="number"
              placeholder="Monto máx."
              value={filters.montoMax}
              onChange={(e) => setFilters((prev) => ({ ...prev, montoMax: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Transacciones</CardTitle>
          <CardDescription>{filteredAndSortedTransactions.length} transacciones encontradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredAndSortedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <CalendarIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No hay transacciones</h3>
              <p className="text-muted-foreground mb-4">
                {transacciones.length === 0
                  ? "Aún no se han registrado transacciones"
                  : "No se encontraron transacciones con los filtros aplicados"}
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Transacción
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("fecha_pago")}
                          className="h-auto p-0 font-medium"
                        >
                          Fecha
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("cliente_nombre")}
                          className="h-auto p-0 font-medium"
                        >
                          Cliente
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("monto")} className="h-auto p-0 font-medium">
                          Monto
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("revenue_neto")}
                          className="h-auto p-0 font-medium"
                        >
                          Revenue Neto
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaccion) => (
                      <TableRow key={transaccion.id}>
                        <TableCell>{formatDate(transaccion.fecha_pago)}</TableCell>
                        <TableCell className="font-medium">{transaccion.cliente_nombre}</TableCell>
                        <TableCell>{formatCurrency(transaccion.monto)}</TableCell>
                        <TableCell className="font-mono text-sm">{transaccion.referencia_pago}</TableCell>
                        <TableCell className="text-emerald-600 font-medium">
                          {formatCurrency(transaccion.revenue_neto)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={transaccion.estado}
                            onValueChange={(value) =>
                              handleStatusChange(
                                transaccion.id,
                                value as "CREADA" | "PAGO RECIBIDO" | "COMPLETADA" | "CANCELADA",
                              )
                            }
                          >
                            <SelectTrigger className={`w-32 h-8 ${getStatusSelectorClass(transaccion.estado)}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CREADA" className="bg-yellow-50 hover:bg-yellow-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                  Creada
                                </div>
                              </SelectItem>
                              <SelectItem value="PAGO RECIBIDO" className="bg-blue-50 hover:bg-blue-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  Pago Recibido
                                </div>
                              </SelectItem>
                              <SelectItem value="COMPLETADA" className="bg-green-50 hover:bg-green-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  Completada
                                </div>
                              </SelectItem>
                              <SelectItem value="CANCELADA" className="bg-red-50 hover:bg-red-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                  Cancelada
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(transaccion)}
                            className="h-8 px-2"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Ver Detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} de{" "}
                    {filteredAndSortedTransactions.length} transacciones
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
