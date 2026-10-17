import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppContainer } from "@/components/layout/AppContainer";

export const metadata = {
  title: "Termos de Uso",
};

// ⚠️ Minuta inicial — revisar com um advogado antes de divulgar amplamente,
// especialmente os pontos de LGPD e as cláusulas de cobrança/inadimplência.
// Preencher os campos entre [colchetes] com os dados reais do negócio.
export default function TermsPage() {
  return (
    <AppContainer>
      <div className="min-h-screen bg-white px-6 py-10 text-slate-700">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-8 hover:text-slate-600">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>

        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-1">Termos de Uso</h1>
        <p className="text-xs text-slate-400 mb-8">Última atualização: [DATA]</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-black text-slate-900 mb-2">1. Quem somos</h2>
            <p>
              Estes Termos de Uso regulam o uso da plataforma [NOME DO SAAS / RAZÃO SOCIAL],
              CNPJ [CNPJ, se houver] (&quot;Plataforma&quot;, &quot;nós&quot;), que oferece um serviço de
              cardápio digital multi-loja (SaaS) para estabelecimentos comerciais
              (&quot;Lojista&quot;, &quot;você&quot;) divulgarem produtos e receberem pedidos de seus
              próprios clientes finais.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">2. O que a Plataforma faz (e o que não faz)</h2>
            <p className="mb-2">
              A Plataforma fornece a infraestrutura para o Lojista criar e gerenciar um
              cardápio digital, cadastrar produtos, categorias, promoções e receber pedidos.
            </p>
            <p className="mb-2">
              <strong>Importante:</strong> a Plataforma não processa nem intermedeia o
              pagamento feito pelo cliente final ao Lojista. Cada pedido é enviado via
              WhatsApp diretamente ao número cadastrado pelo Lojista, e a forma de
              pagamento (Pix, dinheiro, cartão, etc.) é combinada diretamente entre o
              Lojista e seu cliente, fora da Plataforma. Não temos qualquer
              responsabilidade sobre esses pagamentos, entregas, trocas, qualidade dos
              produtos ou atendimento prestado pelo Lojista a seus clientes.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">3. Cadastro e responsabilidade pelas informações</h2>
            <p>
              O Lojista é o único responsável pela veracidade das informações cadastradas
              (nome da loja, endereço, horários, preços, fotos, dados de contato) e por
              manter a confidencialidade de suas credenciais de acesso. É responsabilidade
              do Lojista comunicar e recolher os tributos aplicáveis às suas próprias
              vendas — a Plataforma não é parte nessas transações.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">4. Planos, período de teste e cobrança</h2>
            <p className="mb-2">
              Ao se cadastrar, o Lojista recebe um período de teste gratuito de 7 dias.
              Após esse período, o uso continuado da Plataforma depende da assinatura de
              um dos planos pagos disponíveis (Starter ou Pro), cujos valores são
              informados no momento da contratação.
            </p>
            <p>
              O pagamento da assinatura é processado por um link de pagamento de
              terceiro (ex.: Mercado Pago) e confirmado manualmente pela equipe da
              Plataforma. Em caso de não identificação do pagamento após o fim do
              período de teste, o acesso ao painel administrativo e ao cardápio público
              da loja poderá ser suspenso até a regularização.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">5. Uso aceitável</h2>
            <p>
              É proibido usar a Plataforma para divulgar produtos ilegais, conteúdo
              enganoso, ou para qualquer finalidade que viole a legislação brasileira.
              Reservamo-nos o direito de suspender contas que violem estes Termos.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">6. Limitação de responsabilidade</h2>
            <p>
              A Plataforma é fornecida &quot;como está&quot;. Não garantimos disponibilidade
              ininterrupta e não nos responsabilizamos por perdas decorrentes de
              instabilidades, nem por disputas entre o Lojista e seus clientes finais.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">7. Cancelamento</h2>
            <p>
              O Lojista pode solicitar o cancelamento da sua conta a qualquer momento,
              entrando em contato pelos canais informados no final desta página. A
              Plataforma também pode encerrar contas inadimplentes ou que violem estes
              Termos, mediante aviso prévio quando possível.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">8. Alterações</h2>
            <p>
              Estes Termos podem ser atualizados periodicamente. Alterações relevantes
              serão comunicadas pelos canais de contato cadastrados.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">9. Lei aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil,
              elegendo-se o foro da comarca de [CIDADE/UF] para dirimir eventuais
              controvérsias.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">10. Contato</h2>
            <p>Dúvidas sobre estes Termos: [E-MAIL DE CONTATO] / [WHATSAPP DE CONTATO]</p>
          </section>
        </div>

        <p className="mt-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 text-center">
          SaaS Cardápio Digital © {new Date().getFullYear()}
        </p>
      </div>
    </AppContainer>
  );
}
