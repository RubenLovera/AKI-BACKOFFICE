"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Dashboard } from "@/components/pages/dashboard"
import { Transactions } from "@/components/pages/transactions"
import { Clients } from "@/components/pages/clients"
import { Zelle } from "@/components/pages/zelle"

type Page = "dashboard" | "transactions" | "clients" | "zelle"

export function AppLayout() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "transactions":
        return <Transactions />
      case "clients":
        return <Clients />
      case "zelle":
        return <Zelle />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>
      </div>
    </div>
  )
}
