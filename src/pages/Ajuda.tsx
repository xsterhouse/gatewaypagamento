import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpCircle, Book, MessageCircle, Mail, Phone, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Ajuda() {
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
      value: 'suporte@gateway.com',
      action: 'Enviar email'
    },
    {
      icon: Phone,
      title: 'Telefone',
      value: '(11) 9999-9999',
      action: 'Ligar agora'
    },
    {
      icon: MessageCircle,
      title: 'Chat',
      value: 'Disponível 24/7',
      action: 'Iniciar chat'
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
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Icon className="text-primary" size={24} />
                  </div>
                  <h3 className="text-foreground font-semibold mb-1">{contact.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{contact.value}</p>
                  <Button size="sm" variant="outline" className="w-full">
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

      {/* Documentação */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Book size={20} />
            Documentação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-semibold mb-1">Guia de Início Rápido</p>
                <p className="text-xs text-muted-foreground">Aprenda a usar a plataforma</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-semibold mb-1">API de Integração</p>
                <p className="text-xs text-muted-foreground">Documentação técnica completa</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-semibold mb-1">Políticas e Termos</p>
                <p className="text-xs text-muted-foreground">Leia nossos termos de uso</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-semibold mb-1">Segurança</p>
                <p className="text-xs text-muted-foreground">Saiba como protegemos seus dados</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
