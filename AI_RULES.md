# 🤖 Regras de Desenvolvimento para o Editor AI

Este documento define a stack tecnológica e as regras de uso das bibliotecas para garantir a consistência, manutenibilidade e performance do projeto.

## 🚀 Stack Tecnológica

O projeto "Dimpay Gateway de Pagamento" é construído com as seguintes tecnologias:

1.  **React 18 & TypeScript:** Base para a construção da interface de usuário, garantindo tipagem estática e robustez.
2.  **Vite:** Ferramenta de build e servidor de desenvolvimento, otimizando a velocidade de desenvolvimento.
3.  **Tailwind CSS:** Framework CSS utilitário para toda a estilização e design responsivo.
4.  **shadcn/ui & Radix UI:** Biblioteca de componentes de UI de alta qualidade, estilizados com Tailwind, para elementos como botões, cards, modais e formulários.
5.  **Supabase:** Backend as a Service (BaaS) utilizado para Autenticação (Auth), Banco de Dados (PostgreSQL), e Armazenamento (Storage).
6.  **React Router:** Biblioteca padrão para roteamento e navegação na aplicação.
7.  **Sonner:** Biblioteca moderna e acessível para exibir notificações (toasts) ao usuário.
8.  **Lucide React:** Conjunto de ícones vetoriais leves e consistentes.
9.  **Zod & React Hook Form:** Utilizados para gerenciamento e validação de formulários complexos.
10. **Mercado Pago / Adquirentes:** Integração de pagamentos PIX via APIs de adquirentes bancários.

## 🛠️ Regras de Uso de Bibliotecas

| Funcionalidade | Biblioteca/Ferramenta Obrigatória | Regras de Uso |
| :--- | :--- | :--- |
| **Estilização/UI** | **Tailwind CSS & shadcn/ui** | Use classes Tailwind para todo o estilo. Utilize componentes shadcn/ui (Button, Card, Input, etc.) sempre que possível. |
| **Roteamento** | **React Router** | Mantenha as rotas centralizadas em `src/App.tsx`. |
| **Backend/Dados** | **Supabase** | Use `supabase` (via `src/lib/supabase.ts`) para todas as operações de banco de dados, autenticação e storage. |
| **Formulários** | **React Hook Form & Zod** | Use React Hook Form para gerenciar o estado do formulário e Zod para validação de schemas. |
| **Notificações** | **Sonner (via `src/lib/toast.tsx`)** | Use o utilitário `toast` customizado para todas as mensagens de feedback (sucesso, erro, aviso). |
| **Ícones** | **Lucide React** | Use apenas ícones do pacote `lucide-react`. |
| **Gráficos** | **Recharts** | Use Recharts para renderizar gráficos e visualizações de dados. |
| **PDF/Exportação** | **jsPDF & jspdf-autotable** | Use estas bibliotecas para gerar relatórios e faturas em PDF. |
| **Datas** | **String Manipulation & `src/lib/utils.ts`** | **NUNCA** use `new Date()` com strings de data (`YYYY-MM-DD`) vindas do banco ou inputs, pois causa problemas de timezone. Use as funções utilitárias (`formatDate`, `prepareDateForDB`, etc.) para manipular strings diretamente. |
| **Criptografia** | **EncryptionService** | Use `src/services/encryptionService.ts` para criptografar dados sensíveis (secrets de API) antes de salvar no banco. |
| **Lógica de Negócio** | **Services (`src/services/*.ts`)** | Use os serviços existentes (`walletService`, `pixProcessorService`, `notificationService`, etc.) para encapsular a lógica de negócio e interações com o banco. |

## 💡 Princípios de Codificação

*   **Componentização:** Crie um novo arquivo para cada novo componente ou hook.
*   **Responsividade:** O design deve ser responsivo por padrão (mobile-first).
*   **Simplicidade:** Mantenha o código simples, elegante e focado no requisito do usuário.
*   **Segurança:** Priorize a segurança, garantindo que as políticas RLS (Row Level Security) sejam respeitadas em todas as consultas.