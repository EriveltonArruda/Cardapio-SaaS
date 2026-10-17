import { describe, it, expect } from "vitest";
import {
  registerSchema,
  checkoutSchema,
  productSchema,
  categorySchema,
  couponSchema,
  zodErrorsToMap,
} from "./validations";

describe("registerSchema", () => {
  const valid = {
    storeName: "Zezinho Lanches",
    slug: "zezinho-lanches",
    email: "dono@exemplo.com",
    phone: "(81) 99999-8888",
    password: "senha123",
  };

  it("aceita dados válidos", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const result = registerSchema.safeParse({ ...valid, email: "não-é-email" });
    expect(result.success).toBe(false);
  });

  it("rejeita senha menor que 6 caracteres", () => {
    const result = registerSchema.safeParse({ ...valid, password: "123" });
    expect(result.success).toBe(false);
  });

  it("rejeita slug com letra maiúscula ou espaço", () => {
    expect(registerSchema.safeParse({ ...valid, slug: "Zezinho Lanches" }).success).toBe(false);
  });

  it("rejeita telefone incompleto", () => {
    expect(registerSchema.safeParse({ ...valid, phone: "(81) 999" }).success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const valid = {
    name: "Cliente Teste",
    phone: "(81) 99999-8888",
    street: "Rua das Flores",
    number: "123",
    neighborhood: "Centro",
    landmark: "perto da praça",
    paymentMethod: "pix",
  };

  it("aceita dados válidos", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita quando falta forma de pagamento", () => {
    expect(checkoutSchema.safeParse({ ...valid, paymentMethod: "" }).success).toBe(false);
  });

  it("zodErrorsToMap devolve uma mensagem por campo", () => {
    const result = checkoutSchema.safeParse({ ...valid, name: "", phone: "" });
    if (result.success) throw new Error("deveria ter falhado");
    const map = zodErrorsToMap(result.error);
    expect(map.name).toBeTruthy();
    expect(map.phone).toBeTruthy();
  });
});

describe("productSchema", () => {
  it("aceita produto com preço positivo", () => {
    expect(productSchema.safeParse({ name: "Pizza Calabresa", price: 39.9 }).success).toBe(true);
  });

  it("rejeita preço zero (bug real que existia antes da validação)", () => {
    expect(productSchema.safeParse({ name: "Pizza Calabresa", price: 0 }).success).toBe(false);
  });

  it("rejeita preço negativo", () => {
    expect(productSchema.safeParse({ name: "Pizza Calabresa", price: -10 }).success).toBe(false);
  });

  it("rejeita nome muito curto", () => {
    expect(productSchema.safeParse({ name: "P", price: 10 }).success).toBe(false);
  });
});

describe("categorySchema", () => {
  it("aceita nome válido", () => {
    expect(categorySchema.safeParse({ name: "Bebidas" }).success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    expect(categorySchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("couponSchema", () => {
  it("aceita cupom percentual válido", () => {
    expect(couponSchema.safeParse({ code: "PROMO10", type: "percentage", value: 10 }).success).toBe(true);
  });

  it("rejeita desconto percentual acima de 100% (bug real corrigido)", () => {
    const result = couponSchema.safeParse({ code: "MEGA", type: "percentage", value: 500 });
    expect(result.success).toBe(false);
  });

  it("aceita desconto fixo acima de 100 (não é percentual, então vale)", () => {
    expect(couponSchema.safeParse({ code: "FIXO200", type: "fixed", value: 200 }).success).toBe(true);
  });

  it("rejeita valor zero ou negativo", () => {
    expect(couponSchema.safeParse({ code: "ZERO", type: "fixed", value: 0 }).success).toBe(false);
  });

  it("rejeita código com caracteres especiais", () => {
    expect(couponSchema.safeParse({ code: "PROMO-10%", type: "fixed", value: 5 }).success).toBe(false);
  });
});
