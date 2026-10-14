'use client';

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { SITE_URL } from "@/lib/site";
import { Download, Copy, QrCode as QrCodeIcon } from "lucide-react";

// Feature Pro: QR Code do cardápio. Gera em cima do link público da loja
// (o mesmo formato usado no sitemap/metadata — ver src/lib/site.ts), sem
// depender de nenhum serviço externo — tudo renderizado no client.
export function QrCodeTab() {
  const { store } = useStore();
  const { toast } = useToast();
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  if (!store) return null;

  const menuUrl = `${SITE_URL}/${store.slug}`;

  const handleDownload = () => {
    const canvas = canvasWrapperRef.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `qrcode-${store.slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      toast({ title: "Link copiado!" });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto py-6">
      <div className="text-center space-y-1">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <QrCodeIcon className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-black uppercase tracking-tight text-foreground">QR Code do Cardápio</h2>
        <p className="text-sm text-muted-foreground">
          Baixe e imprima pra colar na mesa, vitrine ou embalagem. Aponta direto pro seu cardápio online.
        </p>
      </div>

      <Card>
        <CardContent className="p-8 flex flex-col items-center gap-6">
          <div ref={canvasWrapperRef} className="p-4 bg-white rounded-2xl border border-border shadow-sm">
            <QRCodeCanvas value={menuUrl} size={220} level="M" marginSize={2} />
          </div>

          <p className="text-xs text-muted-foreground font-mono text-center break-all">{menuUrl}</p>

          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" /> Copiar link
            </Button>
            <Button className="flex-1" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" /> Baixar PNG
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
