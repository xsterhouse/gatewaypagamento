// Biblioteca para exportação de faturas em PDF
// Usando jsPDF para geração de PDFs

import { formatCurrency, formatDate } from './utils'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Invoice {
  id: string
  invoice_number?: string
  amount: number
  due_date: string
  status: string
  description?: string
  created_at: string
  user_name?: string
  user_email?: string
}

export async function exportInvoicesToPDF(
  invoices: Invoice[],
  userName?: string,
  userEmail?: string
) {
  try {
    // Criar documento PDF

    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.text('Relatório de Faturas', 14, 22)
    
    // Informações do cliente (se fornecidas)
    if (userName || userEmail) {
      doc.setFontSize(10)
      doc.text(`Cliente: ${userName || ''}`, 14, 32)
      if (userEmail) {
        doc.text(`Email: ${userEmail}`, 14, 38)
      }
    }
    
    // Data de geração
    doc.setFontSize(10)
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, userName ? 44 : 32)
    
    // Métricas
    const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
    const totalPending = invoices
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + Number(i.amount), 0)
    const totalPaid = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.amount), 0)
    const totalOverdue = invoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + Number(i.amount), 0)
    
    const startY = userName ? 52 : 40
    
    doc.setFontSize(12)
    doc.text('Resumo:', 14, startY)
    doc.setFontSize(10)
    doc.text(`Total: ${formatCurrency(totalAmount)}`, 14, startY + 6)
    doc.text(`Pago: ${formatCurrency(totalPaid)}`, 14, startY + 12)
    doc.text(`Pendente: ${formatCurrency(totalPending)}`, 14, startY + 18)
    doc.text(`Vencido: ${formatCurrency(totalOverdue)}`, 14, startY + 24)
    
    // Tabela de faturas
    const tableData = invoices.map(inv => [
      inv.invoice_number || inv.id.slice(0, 8),
      formatCurrency(inv.amount),
      formatDate(inv.due_date),
      getStatusLabel(inv.status),
      inv.description || '-'
    ])
    
    ;(doc as any).autoTable({
      startY: startY + 32,
      head: [['Número', 'Valor', 'Vencimento', 'Status', 'Descrição']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 'auto' }
      }
    })
    
    // Abrir PDF no navegador em vez de fazer download
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    
    // Abrir em nova aba
    window.open(pdfUrl, '_blank')
    
    // Liberar URL após um tempo
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 100)
    
    return true
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    throw error
  }
}

// Função alternativa para fazer download direto
export async function downloadInvoicesPDF(
  invoices: Invoice[],
  userName?: string,
  userEmail?: string
) {
  try {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.text('Relatório de Faturas', 14, 22)
    
    // Informações do cliente (se fornecidas)
    if (userName || userEmail) {
      doc.setFontSize(10)
      doc.text(`Cliente: ${userName || ''}`, 14, 32)
      if (userEmail) {
        doc.text(`Email: ${userEmail}`, 14, 38)
      }
    }
    
    // Data de geração
    doc.setFontSize(10)
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, userName ? 44 : 32)
    
    // Métricas
    const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
    const totalPending = invoices
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + Number(i.amount), 0)
    const totalPaid = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.amount), 0)
    const totalOverdue = invoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + Number(i.amount), 0)
    
    const startY = userName ? 52 : 40
    
    doc.setFontSize(12)
    doc.text('Resumo:', 14, startY)
    doc.setFontSize(10)
    doc.text(`Total: ${formatCurrency(totalAmount)}`, 14, startY + 6)
    doc.text(`Pago: ${formatCurrency(totalPaid)}`, 14, startY + 12)
    doc.text(`Pendente: ${formatCurrency(totalPending)}`, 14, startY + 18)
    doc.text(`Vencido: ${formatCurrency(totalOverdue)}`, 14, startY + 24)
    
    // Tabela de faturas
    const tableData = invoices.map(inv => [
      inv.invoice_number || inv.id.slice(0, 8),
      formatCurrency(inv.amount),
      formatDate(inv.due_date),
      getStatusLabel(inv.status),
      inv.description || '-'
    ])
    
    ;(doc as any).autoTable({
      startY: startY + 32,
      head: [['Número', 'Valor', 'Vencimento', 'Status', 'Descrição']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 'auto' }
      }
    })
    
    // Fazer download
    const fileName = `faturas_${new Date().getTime()}.pdf`
    doc.save(fileName)
    
    return true
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    throw error
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'paid':
      return 'Pago'
    case 'pending':
      return 'Pendente'
    case 'overdue':
      return 'Vencido'
    case 'cancelled':
      return 'Cancelado'
    default:
      return status
  }
}
