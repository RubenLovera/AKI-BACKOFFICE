"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, User, FileText, Calendar, Eye } from "lucide-react"
import { getAllClients, createClient, getClientTransactionCount, type Cliente } from "@/lib/database"
import { toast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/file-upload"
import { ImageIcon } from "lucide-react"

interface ClienteWithTransactions extends Cliente {
  transaction_count: number
}

export function Clients() {
  const [clients, setClients] = useState<ClienteWithTransactions[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClienteWithTransactions | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre_completo: "",
    numero_documento: "",
    foto_documento_url: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const clientsData = await getAllClients()

      // Get transaction count for each client
      const clientsWithTransactions = await Promise.all(
        clientsData.map(async (client) => {
          const transactionCount = await getClientTransactionCount(client.id)
          return {
            ...client,
            transaction_count: transactionCount,
          }
        }),
      )

      setClients(clientsWithTransactions)
    } catch (error) {
      console.error("Error loading clients:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.numero_documento.includes(searchTerm),
  )

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.nombre_completo.trim()) {
      errors.nombre_completo = "El nombre completo es requerido"
    }

    if (!formData.numero_documento.trim()) {
      errors.numero_documento = "El número de documento es requerido"
    } else if (clients.some((client) => client.numero_documento === formData.numero_documento)) {
      errors.numero_documento = "Este número de documento ya está registrado"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSubmitting(true)
      await createClient(formData)

      toast({
        title: "Cliente creado",
        description: "El cliente ha sido registrado exitosamente",
      })

      // Reset form and close modal
      setFormData({ nombre_completo: "", numero_documento: "", foto_documento_url: "" })
      setFormErrors({})
      setIsModalOpen(false)

      // Reload clients
      await loadClients()
    } catch (error) {
      console.error("Error creating client:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleFileUploaded = (url: string) => {
    setFormData((prev) => ({ ...prev, foto_documento_url: url }))
  }

  const viewClientDetails = (client: ClienteWithTransactions) => {
    setSelectedClient(client)
    setIsViewModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-space-grotesk">Clientes</h1>
          <p className="text-muted-foreground">Administración de la base de datos de clientes</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
              <DialogDescription>Completa la información del cliente para registrarlo en el sistema</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                <Input
                  id="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={(e) => handleInputChange("nombre_completo", e.target.value)}
                  placeholder="Ingresa el nombre completo"
                  className={formErrors.nombre_completo ? "border-red-500" : ""}
                />
                {formErrors.nombre_completo && <p className="text-sm text-red-500">{formErrors.nombre_completo}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_documento">Número de Documento *</Label>
                <Input
                  id="numero_documento"
                  value={formData.numero_documento}
                  onChange={(e) => handleInputChange("numero_documento", e.target.value)}
                  placeholder="Ingresa el número de documento"
                  className={formErrors.numero_documento ? "border-red-500" : ""}
                />
                {formErrors.numero_documento && <p className="text-sm text-red-500">{formErrors.numero_documento}</p>}
              </div>

              <FileUpload
                onFileUploaded={handleFileUploaded}
                currentUrl={formData.foto_documento_url}
                disabled={submitting}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? "Guardando..." : "Guardar Cliente"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
            <DialogDescription>Información completa del cliente registrado</DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nombre Completo</Label>
                  <p className="text-sm font-medium">{selectedClient.nombre_completo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Documento</Label>
                  <p className="text-sm font-mono">{selectedClient.numero_documento}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha de Registro</Label>
                  <p className="text-sm">
                    {new Date(selectedClient.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Transacciones</Label>
                  <Badge variant={selectedClient.transaction_count > 0 ? "default" : "secondary"}>
                    {selectedClient.transaction_count} transacciones
                  </Badge>
                </div>
              </div>

              {selectedClient.foto_documento_url && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Documento</Label>
                  <div className="mt-2 border rounded-lg p-4 bg-gray-50">
                    {selectedClient.foto_documento_url.includes(".pdf") ? (
                      <div className="flex items-center justify-center h-32">
                        <FileText className="h-16 w-16 text-red-500" />
                        <div className="ml-3">
                          <p className="text-sm font-medium">Documento PDF</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 bg-transparent"
                            onClick={() => window.open(selectedClient.foto_documento_url, "_blank")}
                          >
                            Ver documento
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <img
                          src={selectedClient.foto_documento_url || "/placeholder.svg"}
                          alt="Documento del cliente"
                          className="max-w-full h-48 object-contain mx-auto rounded"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                          onClick={() => window.open(selectedClient.foto_documento_url, "_blank")}
                        >
                          Ver en tamaño completo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Lista de Clientes
          </CardTitle>
          <CardDescription>
            {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""}
            {searchTerm && ` encontrado${filteredClients.length !== 1 ? "s" : ""} para "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Cargando clientes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-2">
              <User className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
              </p>
              {!searchTerm && (
                <Button variant="outline" onClick={() => setIsModalOpen(true)} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar primer cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nombre
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Documento
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Fecha Registro
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center"># Transacciones</TableHead>
                    <TableHead className="font-semibold text-center">Documento</TableHead>
                    <TableHead className="font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{client.nombre_completo}</TableCell>
                      <TableCell className="font-mono text-sm">{client.numero_documento}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(client.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={client.transaction_count > 0 ? "default" : "secondary"}>
                          {client.transaction_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {client.foto_documento_url ? (
                          <div className="flex justify-center">
                            <ImageIcon className="w-4 h-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <span className="text-xs text-muted-foreground">Sin foto</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => viewClientDetails(client)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
