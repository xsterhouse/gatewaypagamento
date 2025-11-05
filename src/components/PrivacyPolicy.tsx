import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield } from 'lucide-react'

interface PrivacyPolicyProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrivacyPolicy({ open, onOpenChange }: PrivacyPolicyProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="text-primary" size={24} />
            Política de Privacidade
          </DialogTitle>
          <DialogDescription>
            Última atualização: 04 de Novembro de 2025
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* Introdução */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">Introdução</h3>
              <p className="text-gray-300 leading-relaxed">
                A Dimpay ("nós", "nosso" ou "empresa") está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações pessoais quando você usa nossa plataforma de pagamentos digitais.
              </p>
            </section>

            {/* 1. Informações que Coletamos */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">1. Informações que Coletamos</h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-white mb-2">1.1. Informações de Cadastro</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Nome completo</li>
                    <li>Email</li>
                    <li>CPF ou CNPJ</li>
                    <li>Data de nascimento</li>
                    <li>Telefone</li>
                    <li>Endereço completo</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">1.2. Informações Financeiras</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Dados bancários (banco, agência, conta)</li>
                    <li>Chaves PIX</li>
                    <li>Histórico de transações</li>
                    <li>Saldos de carteiras</li>
                    <li>Informações de pagamento</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">1.3. Documentos de Verificação (KYC)</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Documento de identidade (RG, CNH)</li>
                    <li>Comprovante de residência</li>
                    <li>Selfie para verificação facial</li>
                    <li>Documentos empresariais (para CNPJ)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">1.4. Informações Técnicas</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Endereço IP</li>
                    <li>Tipo de navegador e dispositivo</li>
                    <li>Sistema operacional</li>
                    <li>Localização geográfica</li>
                    <li>Cookies e tecnologias similares</li>
                    <li>Logs de acesso e atividades</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. Como Usamos suas Informações */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">2. Como Usamos suas Informações</h3>
              <p className="text-gray-300 mb-2">Utilizamos suas informações para:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Processar transações e pagamentos</li>
                <li>Verificar sua identidade (KYC/AML)</li>
                <li>Prevenir fraudes e atividades suspeitas</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Melhorar nossos serviços e experiência do usuário</li>
                <li>Enviar notificações sobre transações e conta</li>
                <li>Fornecer suporte ao cliente</li>
                <li>Realizar análises e pesquisas</li>
                <li>Enviar comunicações de marketing (com seu consentimento)</li>
              </ul>
            </section>

            {/* 3. Base Legal para Processamento */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">3. Base Legal para Processamento (LGPD)</h3>
              <div className="space-y-2 text-gray-300">
                <p><strong className="text-white">3.1. Execução de Contrato:</strong> Processamos dados necessários para fornecer nossos serviços.</p>
                <p><strong className="text-white">3.2. Obrigação Legal:</strong> Cumprimos requisitos legais de KYC, AML e regulamentações financeiras.</p>
                <p><strong className="text-white">3.3. Legítimo Interesse:</strong> Prevenimos fraudes e melhoramos nossos serviços.</p>
                <p><strong className="text-white">3.4. Consentimento:</strong> Para comunicações de marketing e cookies não essenciais.</p>
              </div>
            </section>

            {/* 4. Compartilhamento de Informações */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">4. Compartilhamento de Informações</h3>
              <p className="text-gray-300 mb-2">Podemos compartilhar suas informações com:</p>
              
              <div className="space-y-2 text-gray-300">
                <p><strong className="text-white">4.1. Provedores de Serviço:</strong> Empresas que nos auxiliam (processadores de pagamento, verificação de identidade, hospedagem).</p>
                <p><strong className="text-white">4.2. Instituições Financeiras:</strong> Bancos e adquirentes para processar transações.</p>
                <p><strong className="text-white">4.3. Autoridades Legais:</strong> Quando exigido por lei ou ordem judicial.</p>
                <p><strong className="text-white">4.4. Parceiros Comerciais:</strong> Com seu consentimento explícito.</p>
                <p><strong className="text-white">4.5. Sucessores:</strong> Em caso de fusão, aquisição ou venda de ativos.</p>
              </div>

              <p className="text-gray-300 mt-3">
                <strong className="text-white">Importante:</strong> Nunca vendemos suas informações pessoais a terceiros.
              </p>
            </section>

            {/* 5. Segurança dos Dados */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">5. Segurança dos Dados</h3>
              <p className="text-gray-300 mb-2">Implementamos medidas de segurança robustas:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Criptografia SSL/TLS para transmissão de dados</li>
                <li>Criptografia de dados sensíveis em repouso</li>
                <li>Autenticação de dois fatores (2FA)</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Controles de acesso rigorosos</li>
                <li>Auditorias de segurança regulares</li>
                <li>Backup e recuperação de desastres</li>
              </ul>
            </section>

            {/* 6. Retenção de Dados */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">6. Retenção de Dados</h3>
              <div className="space-y-2 text-gray-300">
                <p><strong className="text-white">6.1.</strong> Mantemos suas informações pelo tempo necessário para fornecer nossos serviços.</p>
                <p><strong className="text-white">6.2.</strong> Dados financeiros são retidos por 5 anos conforme legislação brasileira.</p>
                <p><strong className="text-white">6.3.</strong> Documentos KYC são mantidos por 5 anos após encerramento da conta.</p>
                <p><strong className="text-white">6.4.</strong> Logs de segurança são mantidos por 6 meses.</p>
                <p><strong className="text-white">6.5.</strong> Após os períodos de retenção, os dados são anonimizados ou excluídos.</p>
              </div>
            </section>

            {/* 7. Seus Direitos (LGPD) */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">7. Seus Direitos sob a LGPD</h3>
              <p className="text-gray-300 mb-2">Você tem direito a:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li><strong className="text-white">Acesso:</strong> Solicitar cópia de seus dados pessoais</li>
                <li><strong className="text-white">Correção:</strong> Atualizar dados incorretos ou incompletos</li>
                <li><strong className="text-white">Exclusão:</strong> Solicitar exclusão de dados (sujeito a obrigações legais)</li>
                <li><strong className="text-white">Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong className="text-white">Oposição:</strong> Opor-se ao processamento de dados</li>
                <li><strong className="text-white">Revogação:</strong> Retirar consentimento a qualquer momento</li>
                <li><strong className="text-white">Informação:</strong> Saber com quem compartilhamos seus dados</li>
              </ul>
              <p className="text-gray-300 mt-3">
                Para exercer seus direitos, entre em contato: <strong className="text-white">privacidade@dimpay.com.br</strong>
              </p>
            </section>

            {/* 8. Cookies e Tecnologias Similares */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">8. Cookies e Tecnologias Similares</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-white mb-2">8.1. Cookies Essenciais</h4>
                  <p className="text-gray-300">Necessários para o funcionamento da plataforma (autenticação, segurança).</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">8.2. Cookies de Desempenho</h4>
                  <p className="text-gray-300">Coletam informações sobre como você usa o site para melhorias.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">8.3. Cookies de Marketing</h4>
                  <p className="text-gray-300">Usados para publicidade direcionada (requerem consentimento).</p>
                </div>
              </div>
              <p className="text-gray-300 mt-3">
                Você pode gerenciar cookies nas configurações do navegador.
              </p>
            </section>

            {/* 9. Transferência Internacional */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">9. Transferência Internacional de Dados</h3>
              <p className="text-gray-300 leading-relaxed">
                Seus dados podem ser transferidos e processados em servidores localizados fora do Brasil. Garantimos que tais transferências cumpram a LGPD e incluam salvaguardas adequadas, como cláusulas contratuais padrão.
              </p>
            </section>

            {/* 10. Menores de Idade */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">10. Menores de Idade</h3>
              <p className="text-gray-300 leading-relaxed">
                Nossos serviços não são destinados a menores de 18 anos. Não coletamos intencionalmente informações de menores. Se tomarmos conhecimento de que coletamos dados de um menor, excluiremos essas informações imediatamente.
              </p>
            </section>

            {/* 11. Alterações nesta Política */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">11. Alterações nesta Política</h3>
              <p className="text-gray-300 leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre alterações significativas por email ou através da plataforma. A data da última atualização será sempre indicada no topo deste documento.
              </p>
            </section>

            {/* 12. Encarregado de Dados (DPO) */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">12. Encarregado de Proteção de Dados (DPO)</h3>
              <p className="text-gray-300 leading-relaxed mb-2">
                Nosso Encarregado de Proteção de Dados está disponível para esclarecer dúvidas sobre esta política:
              </p>
              <div className="text-gray-300">
                <p><strong className="text-white">Email:</strong> dpo@dimpay.com.br</p>
                <p><strong className="text-white">Telefone:</strong> 0800 123 4567</p>
              </div>
            </section>

            {/* 13. Autoridade de Proteção de Dados */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">13. Autoridade Nacional de Proteção de Dados (ANPD)</h3>
              <p className="text-gray-300 leading-relaxed">
                Você tem o direito de apresentar uma reclamação à Autoridade Nacional de Proteção de Dados (ANPD) se acreditar que o processamento de seus dados pessoais viola a LGPD.
              </p>
              <div className="mt-2 text-gray-300">
                <p><strong className="text-white">Website:</strong> www.gov.br/anpd</p>
              </div>
            </section>

            {/* 14. Contato */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">14. Contato</h3>
              <p className="text-gray-300 leading-relaxed mb-2">
                Para questões sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais:
              </p>
              <div className="text-gray-300">
                <p><strong className="text-white">Email:</strong> privacidade@dimpay.com.br</p>
                <p><strong className="text-white">Suporte:</strong> suporte@dimpay.com.br</p>
                <p><strong className="text-white">Telefone:</strong> 0800 123 4567</p>
                <p><strong className="text-white">Endereço:</strong> São Paulo, SP - Brasil</p>
              </div>
            </section>

            {/* Última Atualização */}
            <section className="border-t border-gray-700 pt-4">
              <p className="text-xs text-gray-500 text-center">
                Esta Política de Privacidade foi atualizada pela última vez em 04 de Novembro de 2025.
              </p>
              <p className="text-xs text-gray-500 text-center mt-2">
                Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
