"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Calculator, UserPlus, AlertCircle, CheckCircle } from "lucide-react"
import { getClientes, createTransaction, createClient, type Cliente } from "@/lib/database"
import { FileUpload } from "@/components/file-upload"

interface CreateTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateTransactionModal({ isOpen, onClose, onSuccess }: CreateTransactionModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [newTransaction, setNewTransaction] = useState({
    monto: "",
    cliente_id: "",
    referencia_pago: "",
    fecha_pago: "",
  })

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [newClient, setNewClient] = useState({
    nombre_completo: "",
    numero_documento: "",
    foto_documento_url: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadClientes()
    }
  }, [isOpen])

  const loadClientes = async () => {
    try {
      const clientesData = await getClientes()
      setClientes(clientesData)
    } catch (error) {
      console.error("Error loading clients:", error)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!newTransaction.monto || Number.parseFloat(newTransaction.monto) <= 0) {
      errors.monto = "El monto debe ser mayor a 0"
    }

    if (!newTransaction.cliente_id) {
      errors.cliente_id = "Debe seleccionar un cliente"
    }

    if (!newTransaction.referencia_pago.trim()) {
      errors.referencia_pago = "La referencia de pago es requerida"
    }

    if (!newTransaction.fecha_pago) {
      errors.fecha_pago = "La fecha de pago es requerida"
    } else {
      const fechaPago = new Date(newTransaction.fecha_pago)
      const hoy = new Date()
      if (fechaPago > hoy) {
        errors.fecha_pago = "La fecha de pago no puede ser futura"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateTransaction = async () => {
    if (!validateForm()) return
    setShowConfirmDialog(true)
  }

  const confirmCreateTransaction = async () => {
    setIsCreating(true)
    try {
      await createTransaction({
        monto: Number.parseFloat(newTransaction.monto),
        cliente_id: newTransaction.cliente_id,
        referencia_pago: newTransaction.referencia_pago,
        fecha_pago: newTransaction.fecha_pago,
      })

      // Reset form
      setNewTransaction({ monto: "", cliente_id: "", referencia_pago: "", fecha_pago: "" })
      setFormErrors({})
      setShowConfirmDialog(false)
      onClose()

      // Trigger dashboard update
      window.dispatchEvent(new CustomEvent("transactionCreated"))

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error creating transaction:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateNewClient = async () => {
    if (!newClient.nombre_completo.trim() || !newClient.numero_documento.trim()) {
      return
    }

    try {
      const cliente = await createClient({
        nombre_completo: newClient.nombre_completo,
        numero_documento: newClient.numero_documento,
        foto_documento_url: newClient.foto_documento_url,
      })

      setClientes((prev) => [...prev, cliente])
      setNewTransaction((prev) => ({ ...prev, cliente_id: cliente.id.toString() }))
      setShowNewClientDialog(false)
      setNewClient({ nombre_completo: "", numero_documento: "", foto_documento_url: "" })
    } catch (error) {
      console.error("Error creating client:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleClose = () => {
    setNewTransaction({ monto: "", cliente_id: "", referencia_pago: "", fecha_pago: "" })
    setFormErrors({})
    setShowConfirmDialog(false)
    setShowNewClientDialog(false)
    onClose()
  }

  const handleFileUploaded = (url: string) => {
    setNewClient((prev) => ({ ...prev, foto_documento_url: url }))
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Transacción</DialogTitle>
            <DialogDescription>
              Ingresa los datos de la nueva transacción y revisa los cálculos automáticos
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="cliente">Cliente *</Label>
                <div className="flex gap-2">
                  <Select
                    value={newTransaction.cliente_id}
                    onValueChange={(value) => {
                      setNewTransaction((prev) => ({ ...prev, cliente_id: value }))
                      if (formErrors.cliente_id) {
                        setFormErrors((prev) => ({ ...prev, cliente_id: "" }))
                      }
                    }}
                  >
                    <SelectTrigger className={formErrors.cliente_id ? "border-red-500" : ""}>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id.toString()}>
                          {cliente.nombre_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewClientDialog(true)}
                    title="Crear nuevo cliente"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
                {formErrors.cliente_id && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.cliente_id}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="monto">Monto *</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newTransaction.monto}
                  onChange={(e) => {
                    setNewTransaction((prev) => ({ ...prev, monto: e.target.value }))
                    if (formErrors.monto) {
                      setFormErrors((prev) => ({ ...prev, monto: "" }))
                    }
                  }}
                  className={formErrors.monto ? "border-red-500" : ""}
                />
                {formErrors.monto && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.monto}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="referencia">Referencia de Pago *</Label>
                <Input
                  id="referencia"
                  placeholder="Referencia del pago"
                  value={newTransaction.referencia_pago}
                  onChange={(e) => {
                    setNewTransaction((prev) => ({ ...prev, referencia_pago: e.target.value }))
                    if (formErrors.referencia_pago) {
                      setFormErrors((prev) => ({ ...prev, referencia_pago: "" }))
                    }
                  }}
                  className={formErrors.referencia_pago ? "border-red-500" : ""}
                />
                {formErrors.referencia_pago && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.referencia_pago}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="fecha">Fecha de Pago *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={newTransaction.fecha_pago}
                  onChange={(e) => {
                    setNewTransaction((prev) => ({ ...prev, fecha_pago: e.target.value }))
                    if (formErrors.fecha_pago) {
                      setFormErrors((prev) => ({ ...prev, fecha_pago: "" }))
                    }
                  }}
                  className={formErrors.fecha_pago ? "border-red-500" : ""}
                />
                {formErrors.fecha_pago && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.fecha_pago}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <Label className="text-sm font-medium">Cálculos Automáticos</Label>
              </div>

              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monto Original:</span>
                    <span className="font-medium">{formatCurrency(Number.parseFloat(newTransaction.monto) || 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monto a Pagar (93%):</span>
                    <span className="font-medium">
                      {formatCurrency((Number.parseFloat(newTransaction.monto) || 0) * 0.93)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monto - Costo (99%):</span>
                    <span className="font-medium">
                      {formatCurrency((Number.parseFloat(newTransaction.monto) || 0) * 0.99)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Costo Proveedor (1%):</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency((Number.parseFloat(newTransaction.monto) || 0) * 0.01)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenue Bruto:</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency((Number.parseFloat(newTransaction.monto) || 0) * 0.06)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-emerald-700">Revenue Neto:</span>
                    <span className="text-emerald-700">
                      {formatCurrency((Number.parseFloat(newTransaction.monto) || 0) * 0.03)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-amber-700">Liquidación:</span>
                    <span className="text-amber-700">
                      {formatCurrency((Number.parseFloat(newTransaction.monto) || 0) * 0.96)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTransaction}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={
                !newTransaction.monto ||
                !newTransaction.cliente_id ||
                !newTransaction.referencia_pago ||
                !newTransaction.fecha_pago
              }
            >
              Crear Transacción
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
            <DialogDescription>Agrega un nuevo cliente rápidamente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre_completo">Nombre Completo *</Label>
              <Input
                id="nombre_completo"
                placeholder="Nombre completo del cliente"
                value={newClient.nombre_completo}
                onChange={(e) => setNewClient((prev) => ({ ...prev, nombre_completo: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="numero_documento">Número de Documento *</Label>
              <Input
                id="numero_documento"
                placeholder="Cédula o documento de identidad"
                value={newClient.numero_documento}
                onChange={(e) => setNewClient((prev) => ({ ...prev, numero_documento: e.target.value }))}
              />
            </div>
            <FileUpload
              onFileUploaded={handleFileUploaded}
              currentUrl={newClient.foto_documento_url}
              disabled={false}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateNewClient}
                disabled={!newClient.nombre_completo.trim() || !newClient.numero_documento.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Crear Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Confirmar Transacción
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>¿Estás seguro de que deseas crear esta transacción con los siguientes datos?</p>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cliente:</span>
                      <span className="font-medium">
                        {clientes.find((c) => c.id.toString() === newTransaction.cliente_id)?.nombre_completo}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Monto:</span>
                      <span className="font-medium">
                        {formatCurrency(Number.parseFloat(newTransaction.monto) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Referencia:</span>
                      <span className="font-medium">{newTransaction.referencia_pago}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-emerald-700">
                      <span>Revenue Neto:</span>
                      <span>{formatCurrency((Number.parseFloat(newTransaction.monto) || 0) * 0.03)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-amber-700">
                      <span>Liquidación:</span>
                      <span>{formatCurrency((Number.parseFloat(newTransaction.monto) || 0) * 0.96)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCreateTransaction}
              disabled={isCreating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isCreating ? "Creando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
