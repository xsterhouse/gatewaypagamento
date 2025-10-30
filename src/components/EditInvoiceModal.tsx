import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface EditInvoiceModalProps {
  isOpen: boolean
  invoice: any
  onClose: () => void
  onSuccess: () => void
}

export function EditInvoiceModal({ isOpen, invoice, onClose, onSuccess }: EditInvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    due_date: '',
    status: '',
    description: ''
  })

  useEffect(() => {
    if (invoice) {
      setFormData({
        amount: invoice.amount?.toString() || '',
        due_date: invoice.due_date || '',
        status: invoice.status || 'pending',
        description: invoice.description || ''
      })
    }
  }, [invoice])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoice) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          status: formData.status,
          description: formData.description,
          paid_date: formData.status === 'paid' ? new Date().toISOString() : null
        })
        .eq('id', invoice.id)

      if (error) throw error

      toast.success('Fatura atualizada com sucesso!')
      onSuccess()
    } catch (error: any) {
      console.error('Erro ao atualizar fatura:', error)
      toast.error(error.message || 'Erro ao atualizar fatura')
    } finally {
      setLoading(false)
    }
  }

  if (!invoice) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Fatura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Número da Fatura</Label>
            <Input value={invoice.invoice_number} disabled className="bg-muted" />
          </div>

          <div>
            <Label>Cliente</Label>
            <Input value={invoice.user_name} disabled className="bg-muted" />
          </div>

          <div>
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="due_date">Data de Vencimento</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
              className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencido</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
