import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { Customer, Invoice } from '@/types/invoice'

interface InvoicePDFProps {
  customer: Customer
  invoice: Invoice
}

export async function generateInvoicePDF({ customer, invoice }: InvoicePDFProps) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Configurações de estilo
  const margin = 20
  const lineHeight = 7
  let yPosition = margin
  
  // Função auxiliar para adicionar texto
  const addText = (text: string, x: number, y: number, fontSize = 12, isBold = false) => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.text(text, x, y)
  }
  
  // Cabeçalho
  addText('FATURA', pageWidth / 2, yPosition, 20, true)
  yPosition += 15
  
  // Número da fatura
  addText(`Nº Fatura: ${invoice.id.slice(0, 8).toUpperCase()}`, margin, yPosition)
  yPosition += lineHeight
  
  // Data de emissão e vencimento
  addText(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition)
  yPosition += lineHeight
  addText(`Data de Vencimento: ${new Date(invoice.due_date).toLocaleDateString('pt-BR')}`, margin, yPosition)
  yPosition += 15
  
  // Dados do cliente
  addText('Dados do Cliente', margin, yPosition, 14, true)
  yPosition += 10
  
  addText(`Nome: ${customer.name}`, margin, yPosition)
  yPosition += lineHeight
  addText(`CPF: ${customer.cpf}`, margin, yPosition)
  yPosition += lineHeight
  addText(`Email: ${customer.email}`, margin, yPosition)
  yPosition += lineHeight
  addText(`Telefone: ${customer.phone}`, margin, yPosition)
  yPosition += lineHeight
  addText(`Endereço: ${customer.address}`, margin, yPosition)
  yPosition += lineHeight
  addText(`CEP: ${customer.cep}`, margin, yPosition)
  yPosition += 15
  
  // Linha separadora
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10
  
  // Descrição da cobrança
  addText('Descrição da Cobrança', margin, yPosition, 14, true)
  yPosition += 10
  
  // Quebrar texto longo em múltiplas linhas
  const splitDescription = doc.splitTextToSize(invoice.description, pageWidth - 2 * margin)
  splitDescription.forEach((line: string) => {
    addText(line, margin, yPosition)
    yPosition += lineHeight
  })
  yPosition += 10
  
  // Valor
  addText('Valor da Fatura', margin, yPosition, 14, true)
  yPosition += 10
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(invoice.amount))
  addText(formattedAmount, margin, yPosition, 16, true)
  yPosition += 15
  
  // Informações de juros (se aplicável)
  if (invoice.has_interest && invoice.interest_rate > 0) {
    addText(`Taxa de Juros por Atraso: ${invoice.interest_rate}%`, margin, yPosition)
    yPosition += lineHeight
    yPosition += 5
  }
  
  // Linha separadora
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 15
  
  // QR Code
  addText('QR Code para Pagamento PIX', margin, yPosition, 12, true)
  yPosition += 10
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(invoice.qr_code_data || '', {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    doc.addImage(qrCodeDataURL, 'PNG', margin, yPosition, 50, 50)
    yPosition += 60
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error)
    addText('QR Code não disponível', margin, yPosition)
    yPosition += 20
  }
  
  // Código de barras
  addText('Código de Barras', margin, yPosition, 12, true)
  yPosition += 10
  
  // Linha digitável (se existir)
  if (invoice.linha_digitavel) {
    addText('Linha Digitável:', margin, yPosition, 10, true)
    yPosition += 7
    addText(invoice.linha_digitavel, margin, yPosition, 9)
    yPosition += 15
  }
  
  // Nosso número (se existir)
  if (invoice.nosso_numero) {
    addText(`Nosso Número: ${invoice.nosso_numero}`, margin, yPosition, 10, true)
    yPosition += 12
  }
  
  // Código de barras visual
  if (invoice.barcode) {
    const barcodeX = margin
    const barcodeY = yPosition
    const barcodeHeight = 30
    const barcodeWidth = pageWidth - 2 * margin
    const barWidth = barcodeWidth / (invoice.barcode?.length || 44)
    
    for (let i = 0; i < (invoice.barcode?.length || 44); i++) {
      const char = invoice.barcode?.[i] || '0'
      const charNum = parseInt(char, 10)
      if (!isNaN(charNum) && charNum % 2 === 0) {
        doc.rect(barcodeX + (i * barWidth), barcodeY, barWidth, barcodeHeight, 'F')
      }
    }
    
    yPosition += barcodeHeight + 10
    addText(invoice.barcode || '', pageWidth / 2, yPosition, 8, true)
    yPosition += 15
  }
  
  // Status da fatura
  const statusText = {
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Vencido',
    cancelled: 'Cancelado'
  }[invoice.status] || invoice.status
  
  const statusColor = {
    pending: [255, 165, 0],    // Laranja
    paid: [0, 128, 0],        // Verde
    overdue: [255, 0, 0],     // Vermelho
    cancelled: [128, 128, 128] // Cinza
  }[invoice.status] || [0, 0, 0]
  
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
  addText(`Status: ${statusText}`, pageWidth - margin - 40, pageHeight - margin, 12, true)
  doc.setTextColor(0, 0, 0)
  
  // Rodapé
  const footerY = pageHeight - 30
  doc.setFontSize(10)
  doc.text('Esta é uma fatura gerada automaticamente.', pageWidth / 2, footerY, { align: 'center' })
  doc.text('Qualquer dúvida, entre em contato com o emitente.', pageWidth / 2, footerY + 5, { align: 'center' })
  
  // Salvar o PDF
  const fileName = `fatura-${invoice.id.slice(0, 8)}-${customer.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
  doc.save(fileName)
  
  // Retornar o blob para possível upload
  return new Blob([doc.output('blob')], { type: 'application/pdf' })
}

// Função para gerar código de barras mais realista
export function generateBarcodeNumber() {
  // Formato: 00000 00000 00000 00000 00000 00000 00000 00000 00000
  const numbers = '0123456789'
  let barcode = ''
  
  for (let i = 0; i < 44; i++) {
    barcode += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  // Calcular dígito verificador (simplificado)
  let sum = 0
  for (let i = 0; i < barcode.length; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 2 : 1)
  }
  const checkDigit = (10 - (sum % 10)) % 10
  barcode += checkDigit
  
  return barcode
}

// Função para gerar dados do QR Code PIX
export function generatePIXData(invoice: Invoice, _customer: Customer) {
  const payload = {
    chave: 'cpf_do_cobrador', // Você precisa configurar a chave PIX
    nome: 'Nome do Cobrador', // Você precisa configurar o nome
    cidade: 'Sua Cidade', // Você precisa configurar a cidade
    txid: invoice.id.slice(0, 25),
    valor: Number(invoice.amount).toFixed(2),
    descricao: invoice.description.slice(0, 100)
  }
  
  // Formatar payload para o padrão do Banco Central
  const formatField = (id: string, value: string) => {
    return `${id}${String(value.length).padStart(2, '0')}${value}`
  }
  
  let pixData = formatField('00', 'br.gov.bcb.pix') // Payload format indicator
  pixData += formatField('26', formatField('00', payload.chave) + formatField('01', payload.nome) + formatField('02', payload.cidade))
  pixData += formatField('01', payload.txid)
  pixData += formatField('04', payload.valor)
  if (payload.descricao) {
    pixData += formatField('02', payload.descricao)
  }
  
  // Adicionar CRC16
  const crc16 = calculateCRC16(pixData + '6304')
  pixData += formatField('63', '04' + crc16)
  
  return pixData
}

// Função para calcular CRC16 (simplificada)
function calculateCRC16(data: string): string {
  let crc = 0xFFFF
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
      crc &= 0xFFFF
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0')
}
