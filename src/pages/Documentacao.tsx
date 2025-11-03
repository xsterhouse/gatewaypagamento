import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Book, 
  Code, 
  Shield, 
  FileText, 
  Zap,
  CreditCard,
  Link as LinkIcon,
  Wallet,
  BarChart3,
  Settings,
  Users,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'

export function Documentacao() {
  const [activeTab, setActiveTab] = useState('inicio')

  const guias = [
    {
      icon: Zap,
      title: 'Guia de Início Rápido',
      description: 'Aprenda a usar a plataforma em poucos minutos',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      content: {
        intro: 'Bem-vindo à DimPay! Este guia vai te ajudar a começar rapidamente.',
        steps: [
          {
            title: '1. Complete seu Cadastro',
            description: 'Acesse Configurações e preencha seus dados pessoais e bancários.'
          },
          {
            title: '2. Configure suas Carteiras',
            description: 'Vá em "Minhas Carteiras" e ative as moedas que deseja operar (BRL, USD, EUR, BTC).'
          },
          {
            title: '3. Faça seu Primeiro Depósito',
            description: 'Clique em "Adicionar Saldo" no Dashboard e gere um PIX para depositar.'
          },
          {
            title: '4. Crie um Link de Pagamento',
            description: 'Acesse "Checkout" e crie seu primeiro link para receber pagamentos.'
          },
          {
            title: '5. Acompanhe suas Transações',
            description: 'Use o Dashboard e Relatórios para monitorar suas vendas e saldo.'
          }
        ]
      }
    },
    {
      icon: Code,
      title: 'API de Integração',
      description: 'Documentação técnica completa para desenvolvedores',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      content: {
        intro: 'Integre a DimPay em seu sistema usando nossa API REST.',
        sections: [
          {
            title: 'Autenticação',
            items: [
              'Endpoint: POST /api/auth/login',
              'Headers: Content-Type: application/json',
              'Body: { "email": "seu@email.com", "password": "senha" }',
              'Retorna: { "token": "jwt_token", "user": {...} }'
            ]
          },
          {
            title: 'Criar Link de Pagamento',
            items: [
              'Endpoint: POST /api/payment-links',
              'Headers: Authorization: Bearer {token}',
              'Body: { "title": "Produto", "amount": 99.90, "price_type": "fixed" }',
              'Retorna: { "id": "uuid", "slug": "produto", "url": "..." }'
            ]
          },
          {
            title: 'Consultar Transações',
            items: [
              'Endpoint: GET /api/transactions',
              'Headers: Authorization: Bearer {token}',
              'Query: ?status=completed&limit=50',
              'Retorna: { "data": [...], "total": 100 }'
            ]
          }
        ]
      }
    },
    {
      icon: FileText,
      title: 'Políticas e Termos',
      description: 'Leia nossos termos de uso e políticas',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
      content: {
        intro: 'Conheça as políticas e termos de uso da plataforma DimPay.',
        sections: [
          {
            title: 'Termos de Uso',
            items: [
              'Ao usar a DimPay, você concorda com nossos termos',
              'É proibido usar a plataforma para atividades ilegais',
              'Você é responsável pela segurança da sua conta',
              'Podemos suspender contas que violem os termos'
            ]
          },
          {
            title: 'Política de Privacidade',
            items: [
              'Seus dados são criptografados e protegidos',
              'Não compartilhamos suas informações com terceiros',
              'Você pode solicitar a exclusão dos seus dados',
              'Usamos cookies para melhorar a experiência'
            ]
          },
          {
            title: 'Taxas e Tarifas',
            items: [
              'PIX: 3,5% por transação (mínimo R$ 0,60)',
              'Saque: Gratuito (1x por mês), R$ 5,00 adicional',
              'Exchange: 1% sobre o valor convertido',
              'Links de Pagamento: Sem taxa adicional'
            ]
          }
        ]
      }
    },
    {
      icon: Shield,
      title: 'Segurança',
      description: 'Saiba como protegemos seus dados e transações',
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900',
      content: {
        intro: 'A segurança é nossa prioridade. Veja como protegemos você.',
        sections: [
          {
            title: 'Criptografia',
            items: [
              'Todas as comunicações usam SSL/TLS',
              'Senhas são criptografadas com bcrypt',
              'Dados sensíveis são criptografados no banco',
              'Certificado SSL de 256 bits'
            ]
          },
          {
            title: 'Autenticação',
            items: [
              'Login seguro com email e senha',
              'Tokens JWT com expiração',
              'Logout automático após inatividade',
              'Verificação de email obrigatória'
            ]
          },
          {
            title: 'Boas Práticas',
            items: [
              'Use senhas fortes (mínimo 8 caracteres)',
              'Não compartilhe suas credenciais',
              'Faça logout em computadores públicos',
              'Ative notificações de transações'
            ]
          },
          {
            title: 'Compliance',
            items: [
              'Conformidade com LGPD',
              'Certificação PCI DSS',
              'Auditoria de segurança regular',
              'Backup diário dos dados'
            ]
          }
        ]
      }
    }
  ]

  const recursos = [
    {
      icon: CreditCard,
      title: 'Pagamentos',
      description: 'Receba pagamentos via PIX, cartão e boleto',
      items: ['PIX instantâneo', 'QR Code dinâmico', 'Links personalizados', 'Checkout seguro']
    },
    {
      icon: LinkIcon,
      title: 'Links de Pagamento',
      description: 'Crie links para suas vendas online',
      items: ['Preço fixo ou variável', 'Quantidade configurável', 'Estatísticas em tempo real', 'Compartilhamento fácil']
    },
    {
      icon: Wallet,
      title: 'Carteiras Digitais',
      description: 'Gerencie múltiplas moedas',
      items: ['BRL, USD, EUR, BTC', 'Conversão automática', 'Saldo em tempo real', 'Histórico completo']
    },
    {
      icon: BarChart3,
      title: 'Relatórios',
      description: 'Acompanhe suas vendas e receitas',
      items: ['Dashboard visual', 'Gráficos interativos', 'Exportação PDF/Excel', 'Filtros avançados']
    },
    {
      icon: Settings,
      title: 'Configurações',
      description: 'Personalize sua conta',
      items: ['Dados pessoais', 'Dados bancários', 'Notificações', 'Tema claro/escuro']
    },
    {
      icon: Users,
      title: 'Gerenciamento',
      description: 'Para gerentes e admins',
      items: ['Gerenciar clientes', 'Aprovar KYC', 'Ver transações', 'Logs de atividade']
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Documentação
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tudo que você precisa saber para usar a plataforma DimPay
        </p>
      </div>

      {/* Guias Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {guias.map((guia, index) => {
          const Icon = guia.icon
          return (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveTab(guia.title.toLowerCase().replace(/\s+/g, '-'))}
            >
              <CardContent className="p-6">
                <div className={`w-12 h-12 ${guia.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={guia.color} size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {guia.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {guia.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Conteúdo Detalhado */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inicio">Início Rápido</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="termos">Termos</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        {/* Guia de Início Rápido */}
        <TabsContent value="inicio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="text-blue-600" />
                Guia de Início Rápido
              </CardTitle>
              <CardDescription>
                {guias[0].content.intro}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {guias[0].content.steps?.map((step, index) => (
                <div key={index} className="border-l-4 border-blue-600 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {step.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="text-purple-600" />
                API de Integração
              </CardTitle>
              <CardDescription>
                {guias[1].content.intro}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {guias[1].content.sections?.map((section, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {section.title}
                  </h4>
                  <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 space-y-2">
                    {section.items.map((item, i) => (
                      <code key={i} className="block text-sm text-green-400">
                        {item}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Termos */}
        <TabsContent value="termos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="text-green-600" />
                Políticas e Termos
              </CardTitle>
              <CardDescription>
                {guias[2].content.intro}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {guias[2].content.sections?.map((section, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {section.title}
                  </h4>
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-green-600 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="seguranca" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="text-red-600" />
                Segurança
              </CardTitle>
              <CardDescription>
                {guias[3].content.intro}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {guias[3].content.sections?.map((section, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-red-600" />
                    {section.title}
                  </h4>
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-red-600 mt-1">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recursos da Plataforma */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Recursos da Plataforma
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recursos.map((recurso, index) => {
            const Icon = recurso.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Icon className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{recurso.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {recurso.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recurso.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Precisa de Ajuda? */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Precisa de Ajuda?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Nossa equipe está pronta para te ajudar
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  📧 gerencia@dimpay.com.br
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  📞 (63) 99294-0044
                </span>
              </div>
            </div>
            <Button>
              Falar com Suporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
