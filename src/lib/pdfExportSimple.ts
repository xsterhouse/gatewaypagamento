// Versão simplificada para teste
import { formatCurrency, formatDate } from './utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Invoice {
  id: string
  invoice_number?: string
  amount: number
  due_date: string
  status: string
  description?: string
  created_at: string
}

export async function exportInvoicesToPDF(invoices: Invoice[]) {
  try {
    console.log('🔵 Iniciando exportação PDF...')
    console.log('📊 Faturas:', invoices.length)
    
    // Criar documento
    console.log('📄 Criando documento PDF...')
    const doc = new jsPDF()
    console.log('✅ Documento criado')
    console.log('✅ autoTable disponível:', typeof autoTable)
    
    // Adicionar título
    doc.setFontSize(20)
    doc.text('Relatório de Faturas', 14, 22)
    
    // Data
    doc.setFontSize(10)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 32)
    
    // Métricas
    const total = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
    doc.setFontSize(12)
    doc.text('Resumo:', 14, 42)
    doc.setFontSize(10)
    doc.text(`Total: ${formatCurrency(total)}`, 14, 48)
    doc.text(`Quantidade: ${invoices.length} faturas`, 14, 54)
    
    // Tabela
    const tableData = invoices.map(inv => [
      inv.invoice_number || inv.id.slice(0, 8),
      formatCurrency(inv.amount),
      formatDate(inv.due_date),
      inv.status
    ])
    
    console.log('📊 Gerando tabela...')
    autoTable(doc, {
      startY: 62,
      head: [['Número', 'Valor', 'Vencimento', 'Status']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 }
    })
    console.log('✅ Tabela gerada')
    
    // Abrir no navegador
    console.log('🌐 Abrindo PDF no navegador...')
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 100)
    
    console.log('✅ PDF aberto com sucesso!')
    return true
  } catch (error: any) {
    console.error('❌ Erro ao gerar PDF:', error)
    console.error('❌ Mensagem:', error.message)
    console.error('❌ Stack:', error.stack)
    throw new Error(`Falha ao gerar PDF: ${error.message}`)
  }
}
