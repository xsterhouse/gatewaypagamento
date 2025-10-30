import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function CreateAdmin() {
  const [email, setEmail] = useState('projetoxster@gmail.com')
  const [password, setPassword] = useState('Admin@123!')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const createAdmin = async () => {
    setLoading(true)
    setResult('')

    try {
      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: 'Admin Master',
            role: 'admin',
          }
        }
      })

      if (error) {
        setResult(`❌ Erro: ${error.message}`)
        toast.error(error.message)
        return
      }

      if (!data.user) {
        setResult('❌ Erro ao criar usuário')
        return
      }

      setResult(`✅ Admin criado com sucesso!
      
ID: ${data.user.id}
Email: ${email}
Senha: ${password}

Agora execute este SQL:

UPDATE users 
SET id = '${data.user.id}',
    role = 'admin',
    kyc_status = 'approved'
WHERE email = '${email}';
`)
      
      toast.success('Admin criado! Execute o SQL mostrado.')
    } catch (error: any) {
      setResult(`❌ Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e13] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-[#1a1f2e] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-2xl">
            👑 Criar Admin Master
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm mb-2 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">Senha</label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <Button
            onClick={createAdmin}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Criando...' : 'Criar Admin'}
          </Button>

          {result && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              💡 Esta página cria um novo admin no Supabase Auth e mostra o SQL para sincronizar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
