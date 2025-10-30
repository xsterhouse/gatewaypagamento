import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function MigrateUsers() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const users = [
    {
      email: 'projetoxster@gmail.com',
      password: 'Admin@123',
      name: 'Admin Master',
      role: 'admin'
    },
    {
      email: 'admin@gateway.com',
      password: 'Gateway@123',
      name: 'Kza4',
      role: 'user'
    },
    {
      email: 'agenciaxster@gmail.com',
      password: 'Agencia@123',
      name: 'Rosely P Francisco',
      role: 'user'
    }
  ]

  const migrateUsers = async () => {
    setLoading(true)
    setResults([])
    const newResults: string[] = []

    for (const user of users) {
      try {
        // Verificar se usuário já existe no Auth
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers?.users.find(u => u.email === user.email)

        let authUserId: string

        if (existingUser) {
          // Usuário já existe no Auth
          authUserId = existingUser.id
          newResults.push(`ℹ️ ${user.email}: Já existe no Auth, apenas sincronizando...`)
        } else {
          // Criar usuário no Supabase Auth
          const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
              data: {
                name: user.name,
                role: user.role,
              },
              emailRedirectTo: undefined,
            }
          })

          if (error) {
            newResults.push(`❌ ${user.email}: ${error.message}`)
            continue
          }

          if (!data.user) {
            newResults.push(`❌ ${user.email}: Erro ao criar usuário`)
            continue
          }

          authUserId = data.user.id
        }

        // Atualizar ID na tabela users
        const { error: updateError } = await supabase
          .from('users')
          .update({ id: authUserId })
          .eq('email', user.email)

        if (updateError) {
          newResults.push(`⚠️ ${user.email}: Erro ao atualizar tabela: ${updateError.message}`)
        } else {
          newResults.push(`✅ ${user.email}: Migrado com sucesso! Senha: ${user.password}`)
        }

        // Aguardar um pouco entre criações
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error: any) {
        newResults.push(`❌ ${user.email}: ${error.message}`)
      }
    }

    setResults(newResults)
    setLoading(false)
    toast.success('Migração concluída!')
  }

  return (
    <div className="min-h-screen bg-[#0a0e13] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-[#1a1f2e] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-2xl">
            🔄 Migração de Usuários para Supabase Auth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-200 text-sm">
              ⚠️ Esta página vai criar os usuários no Supabase Auth com as seguintes senhas:
            </p>
          </div>

          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.email} className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-gray-400 text-sm">{user.email}</p>
                <p className="text-primary text-sm">Senha: {user.password}</p>
                <p className="text-gray-500 text-xs">Role: {user.role}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={migrateUsers}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Migrando...' : 'Migrar Usuários'}
          </Button>

          {results.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
              <p className="text-white font-medium mb-3">Resultados:</p>
              {results.map((result, index) => (
                <p key={index} className="text-sm font-mono text-gray-300">
                  {result}
                </p>
              ))}
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              💡 Após a migração, você pode fazer login com qualquer um dos emails acima usando as senhas mostradas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
