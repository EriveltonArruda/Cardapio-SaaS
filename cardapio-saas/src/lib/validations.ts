import { z } from "zod";

/**
 * Schemas de validação centralizados (zod). Antes disso, os formulários só
 * confiavam no atributo HTML `required` — sem checar formato de e-mail,
 * tamanho de senha, telefone válido, preço positivo, etc.
 *
 * Convenção usada nos componentes: `schema.safeParse(data)` e, se falhar,
 * `zodErrorsToMap(result.error)` para preencher o mesmo `Record<string, string>`
 * de erros por campo que os formulários já exibem.
 */

/** Converte um ZodError na forma { campo: mensagem } usada pelos formulários. */
export function zodErrorsToMap(error: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString();
    if (key && !map[key]) map[key] = issue.message;
  }
  return map;
}

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const brPhone = z
  .string()
  .min(1, "WhatsApp é obrigatório")
  .refine((v) => {
    const d = digitsOnly(v);
    return d.length === 10 || d.length === 11;
  }, "Informe um WhatsApp válido com DDD");

// ---------------------------------------------------------------------
// Cadastro de loja (self-service) — src/app/register/page.tsx
// ---------------------------------------------------------------------
export const registerSchema = z.object({
  storeName: z.string().trim().min(3, "Nome muito curto").max(80, "Nome muito longo"),
  slug: z
    .string()
    .trim()
    .min(3, "URL muito curta")
    .max(60, "URL muito longa")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  email: z.string().trim().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  phone: brPhone,
  password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres"),
});
export type RegisterFormData = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------
// Checkout — src/components/checkout/CheckoutForm.tsx
// ---------------------------------------------------------------------
export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Nome é obrigatório"),
  phone: brPhone,
  street: z.string().trim().min(2, "A rua é obrigatória"),
  number: z.string().trim().min(1, "O número é obrigatório"),
  neighborhood: z.string().trim().min(2, "O bairro é obrigatório"),
  landmark: z.string().trim().min(2, "Referência é obrigatória"),
  paymentMethod: z.string().min(1, "Escolha a forma de pagamento"),
});
export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ---------------------------------------------------------------------
// Produto — src/components/admin/ProductForm.tsx
// ---------------------------------------------------------------------
export const productSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120, "Nome muito longo"),
  price: z.number({ error: "Informe um preço" }).positive("O preço precisa ser maior que zero"),
});
export type ProductFormData = z.infer<typeof productSchema>;

// ---------------------------------------------------------------------
// Categoria — src/components/admin/CategoriesTab.tsx
// ---------------------------------------------------------------------
export const categorySchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(60, "Nome muito longo"),
});
export type CategoryFormData = z.infer<typeof categorySchema>;

// ---------------------------------------------------------------------
// Cupom — src/components/admin/CouponForm.tsx
// ---------------------------------------------------------------------
export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Código muito curto")
      .max(30, "Código muito longo")
      .regex(/^[A-Z0-9]+$/, "Use apenas letras e números"),
    type: z.enum(["percentage", "fixed"], { error: "Escolha o tipo de desconto" }),
    value: z.number({ error: "Informe o valor do desconto" }).positive("O desconto precisa ser maior que zero"),
    min_purchase: z.number().min(0, "Não pode ser negativo").optional(),
  })
  .refine((data) => data.type !== "percentage" || data.value <= 100, {
    message: "Desconto percentual não pode passar de 100%",
    path: ["value"],
  });
export type CouponFormData = z.infer<typeof couponSchema>;
