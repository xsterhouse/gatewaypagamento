import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Gift, Star, Trophy, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface Reward {
  id: string
  title: string
  description: string | null
  points: number
  status: string
  created_at: string
}

export function Premiacoes() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [totalPoints, setTotalPoints] = useState(0)

  useEffect(() => {
    loadRewards()
  }, [])

  const loadRewards = async () => {
    const { data } = await supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setRewards(data)
      const total = data
        .filter(r => r.status === 'active')
        .reduce((sum, r) => sum + r.points, 0)
      setTotalPoints(total)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Ativo</Badge>
      case 'redeemed':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Resgatado</Badge>
      case 'expired':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Expirado</Badge>
      default:
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Premiações</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">Acompanhe seus pontos e recompensas</p>
      </div>

      {/* Pontos Totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-purple-300 text-sm mb-1">Pontos Disponíveis</p>
                <h3 className="text-3xl font-bold text-foreground">{totalPoints}</h3>
                <p className="text-xs text-purple-300 mt-1">Pontos acumulados</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Star className="text-purple-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-yellow-300 text-sm mb-1">Recompensas Ativas</p>
                <h3 className="text-3xl font-bold text-foreground">{rewards.filter(r => r.status === 'active').length}</h3>
                <p className="text-xs text-yellow-300 mt-1">Disponíveis para resgate</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Trophy className="text-yellow-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-300 text-sm mb-1">Recompensas Resgatadas</p>
                <h3 className="text-3xl font-bold text-foreground">{rewards.filter(r => r.status === 'redeemed').length}</h3>
                <p className="text-xs text-blue-300 mt-1">Total de resgates</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Award className="text-blue-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recompensas Disponíveis */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Gift size={20} />
            Suas Recompensas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="text-center py-12">
              <Gift size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma recompensa disponível no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <Card key={reward.id} className="bg-accent/50 border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Gift className="text-primary" size={20} />
                      </div>
                      {getStatusBadge(reward.status)}
                    </div>
                    <h4 className="text-foreground font-semibold mb-2">{reward.title}</h4>
                    {reward.description && (
                      <p className="text-muted-foreground text-sm mb-3">{reward.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-400" size={16} />
                        <span className="text-foreground font-medium">{reward.points} pts</span>
                      </div>
                      <span className="text-muted-foreground text-xs">{formatDate(reward.created_at)}</span>
                    </div>
                    {reward.status === 'active' && (
                      <Button className="w-full mt-3" size="sm">
                        Resgatar
                      </Button>
                    )}
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
