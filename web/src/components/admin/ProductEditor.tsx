'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { adminApi } from '@/lib/api';
import type { AdminProduct, ProductInput } from '@/lib/types';
import { cn, discountPercent } from '@/lib/utils';
import { shrinkImage } from '@/lib/image';
import { confirmAction } from '@/lib/confirm';
import { useTelegram } from '@/hooks/useTelegram';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Input, { Textarea } from '@/components/ui/Input';
import Switch from '@/components/ui/Switch';
import ProductImage from '@/components/ui/ProductImage';

interface ProductEditorProps {
  product: AdminProduct | 'new' | null;
  categories: string[];
  onClose: () => void;
  onSaved: (product: AdminProduct, created: boolean) => void;
  onDeleted: (product: AdminProduct) => void;
}

interface Form {
  name: string;
  description: string;
  category: string;
  newPrice: string;
  oldPrice: string;
  ingredients: string;
  imageUrl: string;
  isActive: boolean;
  isPopular: boolean;
  isBump: boolean;
}

const NEW_CATEGORY = '__new__';

function toForm(product: AdminProduct | null, fallbackCategory: string): Form {
  return {
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || fallbackCategory,
    newPrice: product ? String(product.newPrice) : '',
    oldPrice: product?.oldPrice ? String(product.oldPrice) : '',
    ingredients: product?.ingredients.join(', ') || '',
    imageUrl: product?.imageUrl || '',
    isActive: product?.isActive ?? true,
    isPopular: product?.isPopular ?? false,
    isBump: product?.isBump ?? false,
  };
}

/** "45 000" yoki "45,000" → "45000" */
const digits = (value: string) => value.replace(/\D/g, '').slice(0, 9);

function ToggleRow({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className="text-[14.5px] font-bold">{title}</div>
        <div className="text-[12.5px] leading-snug text-muted">{text}</div>
      </div>
      {children}
    </div>
  );
}

export function ProductEditor({ product, categories, onClose, onSaved, onDeleted }: ProductEditorProps) {
  const { haptic } = useTelegram();
  const existing = product && product !== 'new' ? product : null;
  const [form, setForm] = useState<Form>(() => toForm(null, categories[0] || ''));
  const [customCategory, setCustomCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!product) return;
    setForm(toForm(existing, categories[0] || ''));
    setCustomCategory('');
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await adminApi.uploadImage(await shrinkImage(file));
      set('imageUrl', url);
      haptic('success');
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const save = async () => {
    const category = form.category === NEW_CATEGORY ? customCategory.trim() : form.category;
    const newPrice = Number(form.newPrice);
    const oldPrice = Number(form.oldPrice) || 0;

    if (form.name.trim().length < 2) return setError('Taom nomini kiriting');
    if (!category) return setError('Bo‘limni tanlang yoki yangisini yozing');
    if (!newPrice) return setError('Narxni kiriting');
    if (oldPrice && oldPrice <= newPrice) return setError('Eski narx yangi narxdan katta bo‘lishi kerak (yoki bo‘sh qoldiring)');

    const body: ProductInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      category,
      newPrice,
      oldPrice,
      ingredients: form.ingredients.split(',').map((item) => item.trim()).filter(Boolean),
      imageUrl: form.imageUrl.trim(),
      isActive: form.isActive,
      isPopular: form.isPopular,
      isBump: form.isBump,
    };

    setSaving(true);
    setError('');
    try {
      const saved = existing ? await adminApi.updateProduct(existing.id, body) : await adminApi.createProduct(body);
      haptic('success');
      onSaved(saved, !existing);
    } catch (saveError) {
      haptic('error');
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!existing) return;
    const ok = await confirmAction(
      `«${existing.name}» butunlay o‘chirilsinmi? Qaytarib bo‘lmaydi.\n\nVaqtincha olib qo‘yish uchun stop-list yetarli.`,
    );
    if (!ok) return;
    setSaving(true);
    try {
      await adminApi.deleteProduct(existing.id);
      haptic('warning');
      onDeleted(existing);
    } catch (deleteError) {
      setError((deleteError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const discount = discountPercent(Number(form.oldPrice) || 0, Number(form.newPrice) || 0);

  return (
    <BottomSheet
      open={product !== null}
      onClose={onClose}
      title={existing ? 'Taomni tahrirlash' : 'Yangi taom'}
      footer={
        <div className="flex gap-2">
          {existing && (
            <Button variant="secondary" aria-label="O‘chirish" onClick={remove} disabled={saving} className="w-12 shrink-0 px-0 text-action">
              <Icon name="trash" size={20} />
            </Button>
          )}
          <Button block loading={saving} disabled={uploading} onClick={save}>
            {existing ? 'Saqlash' : 'Menyuga qo‘shish'}
          </Button>
        </div>
      }
    >
      {/* Rasm */}
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        className="relative mb-1 block h-[180px] w-full overflow-hidden rounded-[20px] bg-surface text-left"
      >
        {form.imageUrl ? (
          <ProductImage key={form.imageUrl} large src={form.imageUrl} alt="" className="absolute inset-0 h-full w-full" />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted">
            <Icon name="image" size={34} />
            <span className="text-[14px] font-bold">Rasm yuklash</span>
          </span>
        )}
        {form.imageUrl && (
          <span className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-extrabold text-ink shadow">
            <Icon name="image" size={16} /> Almashtirish
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 grid place-items-center bg-white/70">
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-action border-r-transparent" />
          </span>
        )}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => pickImage(event.target.files?.[0])}
      />
      <p className="mb-4 text-[12px] text-muted">Telefoningizdagi suratni tanlang — o‘zi kichraytirib yuklanadi.</p>

      <Input label="Nomi" value={form.name} maxLength={80} placeholder="Masalan: Chizburger" onChange={(event) => set('name', event.target.value)} />

      <div className="mb-3.5">
        <div className="mb-1.5 text-[13px] font-bold text-muted">Bo‘lim</div>
        <div className="flex flex-wrap gap-2">
          {[...categories, NEW_CATEGORY].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => set('category', category)}
              className={cn(
                'h-9 rounded-full px-3.5 text-[13.5px] font-bold transition',
                form.category === category ? 'bg-ink text-white' : 'bg-surface text-ink',
              )}
            >
              {category === NEW_CATEGORY ? '+ Yangi bo‘lim' : category}
            </button>
          ))}
        </div>
        {form.category === NEW_CATEGORY && (
          <input
            value={customCategory}
            onChange={(event) => setCustomCategory(event.target.value)}
            maxLength={40}
            placeholder="Masalan: Pitsalar"
            aria-label="Yangi bo‘lim nomi"
            className="mt-2 h-11 w-full rounded-2xl border border-transparent bg-surface px-4 text-[15px] outline-none focus:border-action focus:bg-white"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Narxi (so‘m)"
          inputMode="numeric"
          value={form.newPrice}
          placeholder="35000"
          onChange={(event) => set('newPrice', digits(event.target.value))}
        />
        <Input
          label="Eski narx"
          inputMode="numeric"
          value={form.oldPrice}
          placeholder="ixtiyoriy"
          hint={discount > 0 ? <b className="text-action">−{discount}% chegirma</b> : 'Chizilgan narx'}
          onChange={(event) => set('oldPrice', digits(event.target.value))}
        />
      </div>

      <Textarea
        label="Tavsif"
        value={form.description}
        maxLength={400}
        rows={3}
        placeholder="Mijoz nimani olishini qisqa yozing"
        onChange={(event) => set('description', event.target.value)}
      />
      <Input
        label="Tarkibi"
        value={form.ingredients}
        placeholder="Bulochka, kotlet, pishloq"
        hint="Vergul bilan ajrating"
        onChange={(event) => set('ingredients', event.target.value)}
      />

      <div className="mt-1 divide-y divide-line rounded-[18px] bg-white px-4 shadow-[var(--shadow-card)]">
        <ToggleRow title="Sotuvda" text="O‘chiq bo‘lsa — stop-list, mijozlar ko‘rmaydi">
          <Switch checked={form.isActive} onChange={(value) => set('isActive', value)} label="Sotuvda" />
        </ToggleRow>
        <ToggleRow title="Mashhur" text="Bosh sahifadagi «Hamma sevadigan» qatorida">
          <Switch checked={form.isPopular} onChange={(value) => set('isPopular', value)} label="Mashhur" />
        </ToggleRow>
        <ToggleRow title="Savatcha taklifi" text="Savatchada «buni ham qo‘shasizmi?» bo‘lib chiqadi">
          <Switch checked={form.isBump} onChange={(value) => set('isBump', value)} label="Savatcha taklifi" />
        </ToggleRow>
      </div>

      {error && <p className="mt-3 rounded-xl bg-action-soft px-3 py-2 text-[13.5px] font-semibold text-action-dark">{error}</p>}
    </BottomSheet>
  );
}

export default ProductEditor;
