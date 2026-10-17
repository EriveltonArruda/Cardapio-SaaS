import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "./CartContext";
import type { Product, ProductAddon } from "@/types";

// ✅ Mocka a loja (delivery_fee/free_delivery_min) sem precisar de uma
// StoreProvider real nem de chamadas de rede.
const mockStore = {
  id: "store-1",
  delivery_fee: 0,
  free_delivery_min: null as number | null,
};
vi.mock("@/contexts/StoreContext", () => ({
  useStore: () => ({ store: mockStore }),
}));

// ✅ Mocka o cliente supabase pra applyCoupon não tentar bater na rede de
// verdade. O chain .from().select().eq().eq().eq().single() é o mesmo
// usado em CartContext.applyCoupon.
interface MockCoupon {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_purchase: number;
  is_active: boolean;
}
let mockCouponResponse: { data: MockCoupon | null; error: { message: string } | null } = {
  data: null,
  error: { message: "not found" },
};
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              single: async () => mockCouponResponse,
            }),
          }),
        }),
      }),
    }),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    store_id: "store-1",
    category_id: null,
    name: "X-Burguer",
    description: null,
    price: 20,
    image_url: null,
    is_available: true,
    is_active: true,
    sort_order: 0,
    is_cold: false,
    is_alcoholic: false,
    has_container: false,
    is_suggestion: false,
    ...overrides,
  } as Product;
}

function makeAddon(overrides: Partial<ProductAddon> = {}): ProductAddon {
  return {
    id: "addon-1",
    store_id: "store-1",
    name: "Bacon",
    price: 5,
    category_id: null,
    is_active: true,
    ...overrides,
  } as ProductAddon;
}

function renderCart() {
  return renderHook(() => useCart(), { wrapper: CartProvider });
}

beforeEach(() => {
  localStorage.clear();
  mockStore.delivery_fee = 0;
  mockStore.free_delivery_min = null;
  mockCouponResponse = { data: null, error: { message: "not found" } };
});

describe("CartContext — cálculos financeiros", () => {
  it("getSubtotal soma preço x quantidade, incluindo adicionais", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(makeProduct({ price: 20 }), 2, [makeAddon({ price: 5 })], "");
    });

    // (20 + 5) * 2 = 50
    expect(result.current.getSubtotal()).toBe(50);
  });

  it("usa promo_price no lugar do price quando disponível", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(makeProduct({ price: 20, promo_price: 15 } as Partial<Product>), 1, [], "");
    });

    expect(result.current.getSubtotal()).toBe(15);
  });

  it("getTotal sem cupom nem taxa de entrega é igual ao subtotal", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(makeProduct({ price: 30 }), 1, [], "");
    });

    expect(result.current.getTotal()).toBe(30);
  });

  it("aplica taxa de entrega fixa quando a loja tem uma configurada", () => {
    mockStore.delivery_fee = 6;
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(makeProduct({ price: 30 }), 1, [], "");
    });

    expect(result.current.getDeliveryFee()).toBe(6);
    expect(result.current.getTotal()).toBe(36);
  });

  it("zera a taxa de entrega quando o subtotal atinge o mínimo grátis", () => {
    mockStore.delivery_fee = 6;
    mockStore.free_delivery_min = 50;
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(makeProduct({ price: 60 }), 1, [], "");
    });

    expect(result.current.getDeliveryFee()).toBe(0);
    expect(result.current.getTotal()).toBe(60);
  });

  it("aplica cupom percentual corretamente", async () => {
    mockCouponResponse = {
      data: { code: "PROMO10", type: "percentage", value: 10, min_purchase: 0, is_active: true },
      error: null,
    };
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(makeProduct({ price: 100 }), 1, [], "");
    });

    await act(async () => {
      await result.current.applyCoupon("PROMO10");
    });

    // 10% de 100 = 10 de desconto
    expect(result.current.getDiscountAmount()).toBe(10);
    expect(result.current.getTotal()).toBe(90);
  });

  it("aplica cupom de valor fixo corretamente", async () => {
    mockCouponResponse = {
      data: { code: "FIXO15", type: "fixed", value: 15, min_purchase: 0, is_active: true },
      error: null,
    };
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(makeProduct({ price: 100 }), 1, [], "");
    });

    await act(async () => {
      await result.current.applyCoupon("FIXO15");
    });

    expect(result.current.getDiscountAmount()).toBe(15);
    expect(result.current.getTotal()).toBe(85);
  });

  it("getTotal nunca fica negativo mesmo com cupom maior que o subtotal", async () => {
    mockCouponResponse = {
      data: { code: "MEGA", type: "fixed", value: 500, min_purchase: 0, is_active: true },
      error: null,
    };
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(makeProduct({ price: 20 }), 1, [], "");
    });

    await act(async () => {
      await result.current.applyCoupon("MEGA");
    });

    expect(result.current.getTotal()).toBe(0);
  });

  it("rejeita cupom quando o subtotal é menor que o mínimo exigido", async () => {
    mockCouponResponse = {
      data: { code: "ACIMA50", type: "percentage", value: 10, min_purchase: 50, is_active: true },
      error: null,
    };
    const { result } = renderCart();

    act(() => {
      result.current.addToCart(makeProduct({ price: 20 }), 1, [], "");
    });

    let response: { success: boolean; message: string } | undefined;
    await act(async () => {
      response = await result.current.applyCoupon("ACIMA50");
    });

    expect(response?.success).toBe(false);
    expect(result.current.getDiscountAmount()).toBe(0);
  });

  it("itens com mesma config (produto + adicionais + obs) somam quantidade em vez de duplicar", () => {
    const { result } = renderCart();
    const product = makeProduct({ price: 10 });

    act(() => {
      result.current.addToCart(product, 1, [], "sem cebola");
      result.current.addToCart(product, 2, [], "sem cebola");
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(3);
  });
});
