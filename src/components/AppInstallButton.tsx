import { Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useAppInstall } from '@/hooks/useAppInstall';
import { toast } from '@/hooks/use-toast';

export default function AppInstallButton({ controller }: { controller: ReturnType<typeof useAppInstall> }) {
  const { canInstall, installed, install, isPrompting, instructionsOpen, closeInstructions } = controller;
  if (!canInstall && !installed) return null;
  return <>
    <Button variant="outline" className="w-full justify-between" disabled={installed || isPrompting} onClick={() => { void install().catch(() => toast({ title: 'تعذر فتح نافذة التثبيت', description: 'أعد المحاولة من قائمة المتصفح.', variant: 'destructive' })); }}>
      <span>{installed ? 'التطبيق مثبت' : 'تثبيت التطبيق'}</span><Download className="w-5 h-5 text-primary" />
    </Button>
    <Dialog open={instructionsOpen} onOpenChange={open => { if (!open) closeInstructions(); }}>
      <DialogContent dir="rtl"><DialogTitle>تثبيت التطبيق</DialogTitle><DialogDescription className="flex items-center gap-2"><Share className="w-5 h-5 shrink-0 text-primary" />اضغط مشاركة ثم اختر إضافة إلى الشاشة الرئيسية</DialogDescription><DialogFooter><Button onClick={closeInstructions}>إغلاق</Button></DialogFooter></DialogContent>
    </Dialog>
  </>;
}
