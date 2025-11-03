import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpCircle, Book, MessageCircle, Mail, Phone, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export function Ajuda() {
  const navigate = useNavigate()
  
  const faqs = [
    {
      question: 'Como criar um link de pagamento?',
      answer: 'Acesse a página de Checkout, clique em "Novo Link", preencha o título e valor, e clique em "Criar Link". Você receberá um link único para compartilhar com seus clientes.'
    },
    {
      question: 'Quanto tempo leva para receber os pagamentos?',
      answer: 'Os pagamentos aprovados são creditados em sua conta em até 1 dia útil. Você pode acompanhar o status na página de Financeiro.'
    },
    {
      question: 'Como solicitar um saque?',
      answer: 'Na página Dashboard, clique em "Solicitar Saque" e informe os dados da sua conta bancária. O saque será processado em até 2 dias úteis.'
    },
    {
      question: 'Quais métodos de pagamento são aceitos?',
      answer: 'Aceitamos PIX, Cartão de Crédito, Cartão de Débito e Boleto Bancário. Todos os métodos são processados de forma segura.'
    },
    {
      question: 'Como funciona o programa de premiações?',
      answer: 'A cada transação aprovada, você acumula pontos que podem ser trocados por recompensas. Acesse a página de Premiações para ver suas recompensas disponíveis.'
    },
    {
      question: 'Como entrar em contato com meu gerente?',
      answer: 'Acesse a página "Fale com seu Gerente" no menu lateral e envie uma mensagem. Seu gerente responderá em até 24 horas.'
    }
  ]

  const contacts = [
    {
      icon: Mail,
      title: 'Email',
      value: 'gerencia@dimpay.com.br',
      action: 'Enviar email',
      onClick: () => window.location.href = 'mailto:gerencia@dimpay.com.br'
    },
    {
      icon: Phone,
      title: 'Telefone Suporte',
      value: '(63) 99294-0044',
      action: 'Ligar agora',
      onClick: () => window.location.href = 'tel:+5563992940044'
    },
    {
      icon: MessageCircle,
      title: 'Chat',
      value: 'Fale com seu Gerente',
      action: 'Iniciar chat',
      onClick: () => navigate('/gerente')
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Central de Ajuda</h1>
        <p className="text-muted-foreground">Encontre respostas para suas dúvidas</p>
      </div>

      {/* Contatos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contacts.map((contact, index) => {
          const Icon = contact.icon
          return (
            <Card key={index} className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Icon className="text-primary" size={24} />
                  </div>
                  <h3 className="text-foreground font-semibold mb-1">{contact.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{contact.value}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={contact.onClick}
                  >
                    {contact.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQs */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileQuestion size={20} />
            Perguntas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-accent/50 rounded-lg p-4 border border-border">
                <h4 className="text-foreground font-semibold mb-2 flex items-start gap-2">
                  <HelpCircle size={18} className="text-primary mt-0.5 flex-shrink-0" />
                  {faq.question}
                </h4>
                <p className="text-muted-foreground text-sm ml-6">{faq.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Link para Documentação */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Book className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Documentação Completa
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Guias, API, termos e muito mais
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/documentacao')}>
              Acessar Documentação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
