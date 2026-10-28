import { query } from '../database/connection.js';

export const CATEGORIES = ['Burgerlar', 'Lavash va hot-dog', 'Gazaklar', 'Ichimliklar'];

function toProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    ingredients: row.ingredients,
    imageUrl: row.image_url,
    oldPrice: row.old_price,
    newPrice: row.new_price,
    category: row.category,
    isPopular: row.is_popular,
    isBump: row.is_bump,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

/** Admin tahrirlay oladigan maydonlar: API nomi → ustun nomi. */
const EDITABLE = {
  name: 'name',
  description: 'description',
  ingredients: 'ingredients',
  imageUrl: 'image_url',
  oldPrice: 'old_price',
  newPrice: 'new_price',
  category: 'category',
  isPopular: 'is_popular',
  isBump: 'is_bump',
  isActive: 'is_active',
  sortOrder: 'sort_order',
};

/** "Double chizburger" → "double-chizburger" */
function slugify(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/[‘’'`ʻʼ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'taom';
}

const ProductModel = {
  async listActive(category) {
    const filterByCategory = category && category !== 'Barchasi';
    const { rows } = await query(
      `SELECT * FROM products
       WHERE is_active ${filterByCategory ? 'AND category = $1' : ''}
       ORDER BY sort_order, id`,
      filterByCategory ? [category] : [],
    );
    return rows.map(toProduct);
  },

  async listPopular() {
    const { rows } = await query(
      'SELECT * FROM products WHERE is_active AND is_popular ORDER BY sort_order, id',
    );
    return rows.map(toProduct);
  },

  /** Savatchadagi "Order Bump" taklifi uchun mahsulot. */
  async findBump() {
    const { rows } = await query(
      'SELECT * FROM products WHERE is_active AND is_bump ORDER BY sort_order, id LIMIT 1',
    );
    return toProduct(rows[0]);
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM products WHERE id = $1', [Number(id)]);
    return toProduct(rows[0]);
  },

  async findManyByIds(ids) {
    const numericIds = ids.map(Number).filter(Number.isInteger);
    if (numericIds.length === 0) return [];

    const { rows } = await query('SELECT * FROM products WHERE id = ANY($1::int[])', [numericIds]);
    return rows.map(toProduct);
  },

  /** Faol mahsulotlari bor kategoriyalar, CATEGORIES tartibida. */
  async categories() {
    const { rows } = await query('SELECT DISTINCT category FROM products WHERE is_active');
    const present = new Set(rows.map((row) => row.category));
    const ordered = CATEGORIES.filter((category) => present.has(category));
    const extra = [...present].filter((category) => !CATEGORIES.includes(category)).sort();
    return ['Barchasi', ...ordered, ...extra];
  },

  /** slug bo'yicha qo'shadi yoki yangilaydi (seed uchun). */
  async upsert(product) {
    const { rows } = await query(
      `INSERT INTO products
         (slug, name, description, ingredients, image_url, old_price, new_price,
          category, is_popular, is_bump, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (slug) DO UPDATE SET
         name        = EXCLUDED.name,
         description = EXCLUDED.description,
         ingredients = EXCLUDED.ingredients,
         image_url   = EXCLUDED.image_url,
         old_price   = EXCLUDED.old_price,
         new_price   = EXCLUDED.new_price,
         category    = EXCLUDED.category,
         is_popular  = EXCLUDED.is_popular,
         is_bump     = EXCLUDED.is_bump,
         is_active   = EXCLUDED.is_active,
         sort_order  = EXCLUDED.sort_order,
         updated_at  = NOW()
       RETURNING *`,
      [
        product.slug,
        product.name,
        product.description || '',
        product.ingredients || [],
        product.imageUrl || '',
        product.oldPrice || 0,
        product.newPrice,
        product.category,
        Boolean(product.isPopular),
        Boolean(product.isBump),
        product.isActive !== false,
        product.sortOrder || 0,
      ],
    );
    return toProduct(rows[0]);
  },

  async count() {
    const { rows } = await query('SELECT COUNT(*) AS count FROM products');
    return rows[0].count;
  },

  /** Admin uchun: o'chirilganlari (stop-list) bilan birga hammasi. */
  async listAll() {
    const { rows } = await query('SELECT * FROM products ORDER BY sort_order, id');
    return rows.map(toProduct);
  },

  /** Admin paneldan yangi taom. slug nomdan yasaladi, band bo'lsa oxiriga raqam qo'shiladi. */
  async create(product) {
    const base = slugify(product.name);
    const { rows: taken } = await query('SELECT slug FROM products WHERE slug = $1 OR slug LIKE $2', [
      base,
      `${base}-%`,
    ]);
    const used = new Set(taken.map((row) => row.slug));
    let slug = base;
    for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`;

    const { rows: last } = await query('SELECT COALESCE(MAX(sort_order), 0) AS max FROM products WHERE category = $1', [
      product.category,
    ]);

    return this.upsert({ ...product, slug, sortOrder: product.sortOrder ?? last[0].max + 10 });
  },

  /** Faqat berilgan maydonlarni yangilaydi. */
  async update(id, fields) {
    const sets = [];
    const values = [Number(id)];
    for (const [key, column] of Object.entries(EDITABLE)) {
      if (fields[key] === undefined) continue;
      values.push(fields[key]);
      sets.push(`${column} = $${values.length}`);
    }
    if (sets.length === 0) return this.findById(id);

    const { rows } = await query(
      `UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values,
    );
    return toProduct(rows[0]);
  },

  /** Buyurtmalarda taom nomi va narxi nusxa bo'lib saqlangan — o'chirish tarixni buzmaydi. */
  async remove(id) {
    const { rowCount } = await query('DELETE FROM products WHERE id = $1', [Number(id)]);
    return rowCount > 0;
  },
};

export default ProductModel;
