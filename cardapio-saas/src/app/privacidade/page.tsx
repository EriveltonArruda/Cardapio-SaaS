import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppContainer } from "@/components/layout/AppContainer";

export const metadata = {
  title: "Política de Privacidade",
};

// ⚠️ Minuta inicial — revisar com um advogado/DPO antes de divulgar
// amplamente. Preencher os campos entre [colchetes] com os dados reais.
export default function PrivacyPage() {
  return (
    <AppContainer>
      <div className="min-h-screen bg-white px-6 py-10 text-slate-700">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-8 hover:text-slate-600">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>

        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-1">Política de Privacidade</h1>
        <p className="text-xs text-slate-400 mb-8">Última atualização: [DATA]</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-black text-slate-900 mb-2">1. Quem somos</h2>
            <p>
              Esta Política explica como [NOME DO SAAS / RAZÃO SOCIAL] (&quot;Plataforma&quot;,
              &quot;nós&quot;) trata dados pessoais ao operar o serviço de cardápio digital
              multi-loja, em conformidade com a Lei Geral de Proteção de Dados
              (Lei 13.709/2018 — LGPD).
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">2. Dois papéis diferentes: Lojista e Cliente Final</h2>
            <p className="mb-2">
              <strong>Dados do Lojista</strong> (quem assina um plano): coletamos e-mail,
              senha (de forma criptografada), nome da loja, telefone e informações de
              configuração do cardápio. Aqui a Plataforma é <strong>controladora</strong> dos
              dados, usados para operar a conta e cobrar a assinatura.
            </p>
            <p>
              <strong>Dados do Cliente Final</strong> (quem faz um pedido no cardápio de um
              Lojista): coletamos nome, telefone e endereço de entrega, exclusivamente
              para viabilizar aquele pedido específico. Nesse caso, o <strong>Lojista é o
              controlador</strong> desses dados (ele decide o que fazer com eles — ex.: usá-los
              pra entregar o pedido) e a Plataforma atua apenas como
              <strong> operadora</strong>, fornecendo a infraestrutura técnica de
              armazenamento.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">3. Para que usamos os dados</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Viabilizar o cadastro e login do Lojista;</li>
              <li>Processar e exibir pedidos feitos pelos clientes finais no painel do Lojista;</li>
              <li>Montar a mensagem de WhatsApp enviada ao Lojista quando um pedido é feito;</li>
              <li>Calcular o progresso em programas de fidelidade/promoções, quando ativados pelo Lojista;</li>
              <li>Enviar comunicações sobre a conta (cobrança, suporte, avisos de alteração destes termos);</li>
              <li>Cumprir obrigações legais.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">4. Com quem compartilhamos</h2>
            <p>
              Usamos provedores de infraestrutura para operar a Plataforma: Supabase
              (banco de dados e autenticação) e Vercel (hospedagem da aplicação). Esses
              provedores têm acesso técnico aos dados apenas na medida necessária para
              prestar o serviço. Não vendemos dados pessoais a terceiros.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">5. Armazenamento local no navegador</h2>
            <p>
              O carrinho de compras do cliente final é salvo no navegador dele
              (localStorage), não em nossos servidores, e é removido automaticamente ao
              finalizar ou limpar o pedido.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">6. Por quanto tempo guardamos os dados</h2>
            <p>
              Os dados de pedidos são mantidos pelo tempo necessário para o Lojista
              gerenciar seu histórico de vendas, ou até que o Lojista ou o titular dos
              dados solicite a exclusão, observadas eventuais obrigações legais de
              retenção.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">7. Seus direitos como titular de dados</h2>
            <p className="mb-2">Nos termos da LGPD, você pode solicitar, a qualquer momento:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirmação de que tratamos seus dados e acesso a eles;</li>
              <li>Correção de dados incompletos ou desatualizados;</li>
              <li>Exclusão ou anonimização de dados desnecessários;</li>
              <li>Portabilidade a outro fornecedor;</li>
              <li>Revogação de consentimentos dados anteriormente.</li>
            </ul>
            <p className="mt-2">
              Se o pedido envolver dados de um Cliente Final, podemos redirecioná-lo ao
              Lojista correspondente (controlador daqueles dados) quando aplicável.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">8. Segurança</h2>
            <p>
              Adotamos controles de acesso por loja (cada Lojista só acessa os dados da
              própria loja) e criptografia de senhas. Nenhum sistema é 100% imune a
              incidentes; em caso de incidente de segurança relevante, comunicaremos os
              titulares e a Autoridade Nacional de Proteção de Dados conforme exigido
              pela LGPD.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">9. Alterações desta Política</h2>
            <p>
              Podemos atualizar esta Política periodicamente. A data da última
              atualização está indicada no topo desta página.
            </p>
          </section>

          <section>
            <h2 className="font-black text-slate-900 mb-2">10. Contato / Encarregado de Dados (DPO)</h2>
            <p>Para exercer seus direitos ou tirar dúvidas: [E-MAIL DE CONTATO]</p>
          </section>
        </div>

        <p className="mt-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 text-center">
          SaaS Cardápio Digital © {new Date().getFullYear()}
        </p>
      </div>
    </AppContainer>
  );
}
