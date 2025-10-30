import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Plus, Copy, ExternalLink, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'

interface CheckoutLink {
  id: string
  title: string
  amount: number
  link_code: string
  status: string
  expires_at: string | null
  created_at: string
}

export function Checkout() {
  const [links, setLinks] = useState<CheckoutLink[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLinks()
  }, [])

  const loadLinks = async () => {
    const { data } = await supabase
      .from('checkout_links')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setLinks(data)
    }
  }

  const generateLinkCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@gateway.com')
      .single()

    if (userData) {
      const linkCode = generateLinkCode()
      await supabase.from('checkout_links').insert({
        user_id: userData.id,
        title,
        amount: parseFloat(amount),
        link_code: linkCode,
        status: 'active'
      })

      setTitle('')
      setAmount('')
      setShowForm(false)
      loadLinks()
    }

    setLoading(false)
  }

  const copyLink = (linkCode: string) => {
    const url = `${window.location.origin}/pay/${linkCode}`
    navigator.clipboard.writeText(url)
    alert('Link copiado para a área de transferência!')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Ativo</Badge>
      case 'inactive':
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Inativo</Badge>
      case 'expired':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Expirado</Badge>
      default:
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Checkout</h1>
          <p className="text-muted-foreground">Crie e gerencie links de pagamento</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus size={16} />
          Novo Link
        </Button>
      </div>

      {/* Formulário de Novo Link */}
      {showForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Criar Novo Link de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Título</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Produto Premium"
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  Criar Link
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Links */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <ShoppingCart size={20} />
            Links de Pagamento ({links.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum link de pagamento criado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <Card key={link.id} className="bg-accent/50 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-foreground font-semibold">{link.title}</h4>
                          {getStatusBadge(link.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-medium text-primary">{formatCurrency(link.amount)}</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(link.created_at)}
                          </span>
                          <code className="bg-accent px-2 py-1 rounded text-xs">{link.link_code}</code>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyLink(link.link_code)}
                        >
                          <Copy size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/pay/${link.link_code}`, '_blank')}
                        >
                          <ExternalLink size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
