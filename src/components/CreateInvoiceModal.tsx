import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface User {
  id: string
  name: string
  email: string
}

export function CreateInvoiceModal({ isOpen, onClose, onSuccess }: CreateInvoiceModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    due_date: '',
    description: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'user')
        .order('name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Converter data para formato correto (mantém o dia selecionado)
      // Adiciona horário meio-dia para evitar problemas de timezone
      const dueDate = new Date(formData.due_date + 'T12:00:00')
      
      const { error } = await supabase
        .from('invoices')
        .insert({
          user_id: formData.user_id,
          amount: parseFloat(formData.amount),
          due_date: dueDate.toISOString(),
          description: formData.description,
          status: 'pending'
        })

      if (error) throw error

      toast.success('Fatura criada com sucesso!')
      setFormData({ user_id: '', amount: '', due_date: '', description: '' })
      onSuccess()
    } catch (error: any) {
      console.error('Erro ao criar fatura:', error)
      toast.error(error.message || 'Erro ao criar fatura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Fatura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user_id">Cliente</Label>
            <select
              id="user_id"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              required
              className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione um cliente</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
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
              placeholder="0.00"
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
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Descrição da fatura..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Fatura'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
