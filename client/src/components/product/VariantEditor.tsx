import { Button } from 'antd';

export type ProductVariantFormValue = {
  _id?: string;
  size: string;
  color: string;
  stock: string;
  lowStockThreshold: string;
  sku: string;
};

interface Props {
  variants: ProductVariantFormValue[];
  onChange: (variants: ProductVariantFormValue[]) => void;
}

const VariantEditor = ({ variants, onChange }: Props) => {
  const updateVariant = (index: number, field: keyof ProductVariantFormValue, value: string) => {
    onChange(variants.map((variant, currentIndex) =>
      currentIndex === index ? { ...variant, [field]: value } : variant,
    ));
  };

  return (
    <div>
      <h3>Size and colour variants</h3>
      {variants.map((variant, index) => (
        <div
          key={variant._id || `new-${index}`}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '.5rem',
            alignItems: 'center',
            marginBottom: '.75rem',
          }}
        >
          <input
            aria-label={`Variant ${index + 1} size`}
            className='input-field'
            placeholder='Size'
            value={variant.size}
            onChange={(event) => updateVariant(index, 'size', event.target.value)}
          />
          <input
            aria-label={`Variant ${index + 1} colour`}
            className='input-field'
            placeholder='Colour'
            value={variant.color}
            onChange={(event) => updateVariant(index, 'color', event.target.value)}
          />
          <input
            aria-label={`Variant ${index + 1} stock`}
            className='input-field'
            type='number'
            min='0'
            step='1'
            placeholder='Stock'
            value={variant.stock}
            onChange={(event) => updateVariant(index, 'stock', event.target.value)}
          />
          <input
            aria-label={`Variant ${index + 1} low-stock threshold`}
            className='input-field'
            type='number'
            min='0'
            step='1'
            placeholder='Alert at'
            title='Low-stock alert threshold'
            value={variant.lowStockThreshold}
            onChange={(event) => updateVariant(index, 'lowStockThreshold', event.target.value)}
          />
          <input
            aria-label={`Variant ${index + 1} SKU`}
            className='input-field'
            placeholder='SKU (optional)'
            value={variant.sku}
            onChange={(event) => updateVariant(index, 'sku', event.target.value)}
          />
          <Button
            htmlType='button'
            danger
            disabled={variants.length === 1}
            onClick={() => onChange(variants.filter((_, currentIndex) => currentIndex !== index))}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        htmlType='button'
        onClick={() => onChange([
          ...variants,
          { size: '', color: '', stock: '0', lowStockThreshold: '5', sku: '' },
        ])}
      >
        Add variant
      </Button>
    </div>
  );
};

export default VariantEditor;
