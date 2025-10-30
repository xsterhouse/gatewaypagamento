import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface BankingAction {
  id: string
  action_type: string
  title: string
  description: string
  amount: number
  scheduled_date: string
  status: string
  category?: string
}

export async function exportBankingCalendarToPDF() {
  try {
    toast.info('Gerando relatório em PDF...')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast.error('Você precisa estar logado')
      return
    }

    // Buscar todas as ações do usuário
    const { data: actions, error } = await supabase
      .from('banking_calendar')
      .select('*')
      .eq('user_id', session.user.id)
      .order('scheduled_date', { ascending: true })

    if (error) throw error

    // Gerar HTML para impressão
    const htmlContent = generateHTMLReport(actions || [])

    // Criar uma janela temporária para impressão
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Bloqueador de pop-up ativo. Permita pop-ups para exportar.')
      return
    }

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Aguardar carregar e imprimir
    setTimeout(() => {
      printWindow.print()
      toast.success('Relatório gerado! Use "Salvar como PDF" na impressão.')
    }, 500)

  } catch (error: any) {
    console.error('Erro ao exportar:', error)
    toast.error('Erro ao gerar relatório')
  }
}

function generateHTMLReport(actions: BankingAction[]): string {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      payment: 'Pagamento',
      deposit: 'Depósito',
      recurring: 'Recorrente',
      deadline: 'Vencimento',
      report: 'Relatório/Lembrete'
    }
    return labels[type] || type
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Pendente',
      scheduled: 'Agendado',
      urgent: 'Urgente',
      executed: 'Executado',
      cancelled: 'Cancelado'
    }
    return labels[status] || status
  }

  // Agrupar por status
  const pending = actions.filter(a => ['pending', 'scheduled', 'urgent'].includes(a.status))
  const executed = actions.filter(a => a.status === 'executed')
  const cancelled = actions.filter(a => a.status === 'cancelled')

  // Calcular totais
  const totalPending = pending.reduce((sum, a) => sum + Number(a.amount), 0)
  const totalExecuted = executed.reduce((sum, a) => sum + Number(a.amount), 0)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Agenda Bancária</title>
      <style>
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          color: #333;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #0A84EC;
          padding-bottom: 20px;
        }
        
        .header h1 {
          color: #0A84EC;
          font-size: 28px;
          margin-bottom: 5px;
        }
        
        .header p {
          color: #666;
          font-size: 14px;
        }
        
        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .summary-card {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #0A84EC;
        }
        
        .summary-card h3 {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        
        .summary-card p {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section h2 {
          color: #0A84EC;
          font-size: 18px;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e0e0e0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        thead {
          background: #0A84EC;
          color: white;
        }
        
        th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
        }
        
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 13px;
        }
        
        tbody tr:hover {
          background: #f9f9f9;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        
        .badge-pending { background: #FEF3C7; color: #92400E; }
        .badge-scheduled { background: #DBEAFE; color: #1E40AF; }
        .badge-urgent { background: #FEE2E2; color: #991B1B; }
        .badge-executed { background: #D1FAE5; color: #065F46; }
        .badge-cancelled { background: #F3F4F6; color: #4B5563; }
        
        .type-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        
        .type-payment { background: #DBEAFE; color: #1E40AF; }
        .type-deposit { background: #D1FAE5; color: #065F46; }
        .type-recurring { background: #E9D5FF; color: #6B21A8; }
        .type-deadline { background: #FEE2E2; color: #991B1B; }
        .type-report { background: #FEF3C7; color: #92400E; }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        
        .no-data {
          text-align: center;
          padding: 40px;
          color: #999;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📅 Relatório de Agenda Bancária</h1>
        <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Ações Pendentes</h3>
          <p>${pending.length}</p>
        </div>
        <div class="summary-card">
          <h3>Total Agendado</h3>
          <p>${formatCurrency(totalPending)}</p>
        </div>
        <div class="summary-card">
          <h3>Total Executado</h3>
          <p>${formatCurrency(totalExecuted)}</p>
        </div>
      </div>

      ${pending.length > 0 ? `
        <div class="section">
          <h2>📌 Ações Pendentes (${pending.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${pending.map(action => `
                <tr>
                  <td>${formatDate(action.scheduled_date)}</td>
                  <td>
                    <strong>${action.title}</strong>
                    ${action.description ? `<br><small style="color: #666;">${action.description}</small>` : ''}
                  </td>
                  <td>
                    <span class="type-badge type-${action.action_type}">
                      ${getTypeLabel(action.action_type)}
                    </span>
                  </td>
                  <td><strong>${action.amount > 0 ? formatCurrency(action.amount) : '-'}</strong></td>
                  <td>
                    <span class="badge badge-${action.status}">
                      ${getStatusLabel(action.status)}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="no-data">Nenhuma ação pendente</div>'}

      ${executed.length > 0 ? `
        <div class="section">
          <h2>✅ Ações Executadas (${executed.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${executed.map(action => `
                <tr>
                  <td>${formatDate(action.scheduled_date)}</td>
                  <td><strong>${action.title}</strong></td>
                  <td>
                    <span class="type-badge type-${action.action_type}">
                      ${getTypeLabel(action.action_type)}
                    </span>
                  </td>
                  <td><strong>${action.amount > 0 ? formatCurrency(action.amount) : '-'}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${cancelled.length > 0 ? `
        <div class="section">
          <h2>❌ Ações Canceladas (${cancelled.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${cancelled.map(action => `
                <tr>
                  <td>${formatDate(action.scheduled_date)}</td>
                  <td><strong>${action.title}</strong></td>
                  <td>
                    <span class="type-badge type-${action.action_type}">
                      ${getTypeLabel(action.action_type)}
                    </span>
                  </td>
                  <td><strong>${action.amount > 0 ? formatCurrency(action.amount) : '-'}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        <p><strong>DiMPay</strong> - Sistema de Gestão Bancária</p>
        <p>Este relatório contém informações confidenciais</p>
      </div>
    </body>
    </html>
  `
}
