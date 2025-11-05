import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText } from 'lucide-react'

interface TermsOfServiceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsOfService({ open, onOpenChange }: TermsOfServiceProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="text-primary" size={24} />
            Termos de Serviço
          </DialogTitle>
          <DialogDescription>
            Última atualização: 04 de Novembro de 2025
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* 1. Aceitação dos Termos */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">1. Aceitação dos Termos</h3>
              <p className="text-gray-300 leading-relaxed">
                Ao acessar e usar a plataforma Dimpay ("Serviço"), você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não poderá acessar o Serviço.
              </p>
            </section>

            {/* 2. Descrição do Serviço */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">2. Descrição do Serviço</h3>
              <p className="text-gray-300 leading-relaxed mb-2">
                O Dimpay é uma plataforma de gerenciamento de pagamentos digitais que oferece:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Processamento de pagamentos via PIX, cartão de crédito e boleto</li>
                <li>Gestão de carteiras digitais em múltiplas moedas</li>
                <li>Sistema de checkout e links de pagamento</li>
                <li>Câmbio e conversão de moedas</li>
                <li>Solicitações de saque (MED)</li>
                <li>Relatórios e análises financeiras</li>
              </ul>
            </section>

            {/* 3. Cadastro e Conta */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">3. Cadastro e Conta</h3>
              <div className="space-y-2 text-gray-300">
                <p><strong className="text-white">3.1.</strong> Para usar o Serviço, você deve criar uma conta fornecendo informações precisas e completas.</p>
                <p><strong className="text-white">3.2.</strong> Você é responsável por manter a confidencialidade de sua senha e conta.</p>
                <p><strong className="text-white">3.3.</strong> Você deve ter pelo menos 18 anos para criar uma conta.</p>
                <p><strong className="text-white">3.4.</strong> É proibido criar múltiplas contas para o mesmo usuário.</p>
                <p><strong className="text-white">3.5.</strong> Reservamo-nos o direito de recusar o serviço ou encerrar contas a nosso critério.</p>
              </div>
            </section>

            {/* 4. Verificação KYC */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">4. Verificação de Identidade (KYC)</h3>
              <div className="space-y-2 text-gray-300">
                <p><strong className="text-white">4.1.</strong> Para cumprir regulamentações financeiras, exigimos verificação de identidade (KYC).</p>
                <p><strong className="text-white">4.2.</strong> Você deve fornecer documentos válidos (RG, CNH, CPF/CNPJ, comprovante de residência).</p>
                <p><strong className="text-white">4.3.</strong> Limites de transação podem ser aplicados até a conclusão do KYC.</p>
                <p><strong className="text-white">4.4.</strong> Reservamo-nos o direito de solicitar documentação adicional a qualquer momento.</p>
              </div>
            </section>

            {/* 5. Taxas e Pagamentos */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">5. Taxas e Pagamentos</h3>
              <div className="space-y-2 text-gray-300">
                <p><strong className="text-white">5.1.</strong> Taxas de transação são aplicadas conforme a tabela de preços disponível na plataforma.</p>
                <p><strong className="text-white">5.2.</strong> Taxas podem variar de acordo com o método de pagamento e volume de transações.</p>
                <p><strong className="text-white">5.3.</strong> Todas as taxas são cobradas automaticamente do saldo da carteira.</p>
                <p><strong className="text-white">5.4.</strong> Reservamo-nos o direito de alterar as taxas mediante aviso prévio de 30 dias.</p>
              </div>
            </section>

            {/* 6. Saques e Transferências */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">6. Saques e Transferências</h3>
              <div className="space-y-2 text-gray-300">
                <p><strong className="text-white">6.1.</strong> Saques estão sujeitos a aprovação e podem levar até 3 dias úteis.</p>
                <p><strong className="text-white">6.2.</strong> Valores mínimos e máximos de saque podem ser aplicados.</p>
                <p><strong className="text-white">6.3.</strong> Reservamo-nos o direito de recusar saques suspeitos ou fraudulentos.</p>
                <p><strong className="text-white">6.4.</strong> Taxas de saque são informadas antes da confirmação da operação.</p>
              </div>
            </section>

            {/* 7. Uso Proibido */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">7. Uso Proibido</h3>
              <p className="text-gray-300 mb-2">Você concorda em NÃO usar o Serviço para:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Atividades ilegais ou fraudulentas</li>
                <li>Lavagem de dinheiro ou financiamento ao terrorismo</li>
                <li>Venda de produtos ou serviços proibidos</li>
                <li>Violação de direitos de propriedade intelectual</li>
                <li>Envio de spam ou conteúdo malicioso</li>
                <li>Tentativas de hackear ou comprometer a segurança da plataforma</li>
              </ul>
            </section>

            {/* 8. Segurança */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">8. Segurança</h3>
              <div className="space-y-2 text-gray-300">
                <p><strong className="text-white">8.1.</strong> Implementamos medidas de segurança para proteger suas informações.</p>
                <p><strong className="text-white">8.2.</strong> Você é responsável por manter seus dispositivos seguros.</p>
                <p><strong className="text-white">8.3.</strong> Notifique-nos imediatamente sobre qualquer uso não autorizado de sua conta.</p>
                <p><strong className="text-white">8.4.</strong> Não nos responsabilizamos por perdas resultantes de violações de segurança causadas por você.</p>
              </div>
            </section>

            {/* 9. Limitação de Responsabilidade */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">9. Limitação de Responsabilidade</h3>
              <div className="space-y-2 text-gray-300">
                <p><strong className="text-white">9.1.</strong> O Serviço é fornecido "como está" sem garantias de qualquer tipo.</p>
                <p><strong className="text-white">9.2.</strong> Não garantimos disponibilidade ininterrupta ou livre de erros.</p>
                <p><strong className="text-white">9.3.</strong> Não nos responsabilizamos por perdas indiretas, incidentais ou consequenciais.</p>
                <p><strong className="text-white">9.4.</strong> Nossa responsabilidade total é limitada ao valor das taxas pagas nos últimos 12 meses.</p>
              </div>
            </section>

            {/* 10. Suspensão e Encerramento */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">10. Suspensão e Encerramento</h3>
              <div className="space-y-2 text-gray-300">
                <p><strong className="text-white">10.1.</strong> Podemos suspender ou encerrar sua conta por violação destes termos.</p>
                <p><strong className="text-white">10.2.</strong> Você pode encerrar sua conta a qualquer momento.</p>
                <p><strong className="text-white">10.3.</strong> Saldos remanescentes serão devolvidos após dedução de taxas aplicáveis.</p>
                <p><strong className="text-white">10.4.</strong> Reservamo-nos o direito de reter fundos suspeitos por até 180 dias.</p>
              </div>
            </section>

            {/* 11. Propriedade Intelectual */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">11. Propriedade Intelectual</h3>
              <p className="text-gray-300 leading-relaxed">
                Todo o conteúdo, marcas, logos e propriedade intelectual do Dimpay são de nossa propriedade exclusiva. Você não pode copiar, modificar ou distribuir nosso conteúdo sem autorização prévia por escrito.
              </p>
            </section>

            {/* 12. Alterações nos Termos */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">12. Alterações nos Termos</h3>
              <p className="text-gray-300 leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas por email ou através da plataforma. O uso continuado do Serviço após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            {/* 13. Lei Aplicável */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">13. Lei Aplicável</h3>
              <p className="text-gray-300 leading-relaxed">
                Estes termos são regidos pelas leis da República Federativa do Brasil. Quaisquer disputas serão resolvidas nos tribunais competentes do Brasil.
              </p>
            </section>

            {/* 14. Contato */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">14. Contato</h3>
              <p className="text-gray-300 leading-relaxed">
                Para questões sobre estes Termos de Serviço, entre em contato:
              </p>
              <div className="mt-2 text-gray-300">
                <p><strong className="text-white">Email:</strong> suporte@dimpay.com.br</p>
                <p><strong className="text-white">Telefone:</strong> 0800 123 4567</p>
                <p><strong className="text-white">Endereço:</strong> São Paulo, SP - Brasil</p>
              </div>
            </section>

            {/* Última Atualização */}
            <section className="border-t border-gray-700 pt-4">
              <p className="text-xs text-gray-500 text-center">
                Estes Termos de Serviço foram atualizados pela última vez em 04 de Novembro de 2025.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
