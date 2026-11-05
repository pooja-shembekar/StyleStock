import { DeleteFilled, EditFilled } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Col, Flex, Modal, Pagination, Row, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import CustomInput from '../../components/CustomInput';
import ProductManagementFilter from '../../components/query-filters/ProductManagementFilter';
import VariantEditor, { ProductVariantFormValue } from '../../components/product/VariantEditor';
import ProductDetailsModal from '../../components/product/ProductDetailsModal';
import toastMessage from '../../lib/toastMessage';
import { getApiErrorMessage } from '../../utils/apiError';
import { useGetAllBrandsQuery } from '../../redux/features/management/brandApi';
import { useGetAllCategoriesQuery } from '../../redux/features/management/categoryApi';
import {
  useAddStockMutation,
  useDeleteProductMutation,
  useGetAllProductsQuery,
  useUpdateProductMutation,
} from '../../redux/features/management/productApi';
import { useGetAllSellerQuery } from '../../redux/features/management/sellerApi';
import { useCreateSaleMutation } from '../../redux/features/management/saleApi';
import { ICategory, IProduct, IProductVariant } from '../../types/product.types';
import { serializeProductVariants, validateProductVariants } from '../../utils/productVariants';

type ListedProduct = IProduct & { key: string };

const toFormVariants = (variants: IProductVariant[] = []): ProductVariantFormValue[] =>
  variants.map((variant) => ({
    _id: variant._id,
    size: variant.size,
    color: variant.color,
    stock: String(variant.stock),
    lowStockThreshold: String(variant.lowStockThreshold ?? 5),
    sku: variant.sku || '',
  }));

const ProductManagePage = () => {
  const [current, setCurrent] = useState(1);
  const [query, setQuery] = useState({ name: '', category: '', brand: '', limit: 10 });
  const [selectedProduct, setSelectedProduct] = useState<ListedProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<ListedProduct | null>(null);
  const [stockTarget, setStockTarget] = useState<{ product: ListedProduct; variantId: string } | null>(null);
  const { data: products, isFetching } = useGetAllProductsQuery({ ...query, page: current });

  const tableData = products?.data?.map((product: IProduct) => ({
    ...product,
    key: product._id,
    categoryName: product.category?.name || 'Uncategorized',
    sellerName: product.seller?.name || 'DELETED SELLER',
    variants: product.variants || [],
  }));

  const columns: TableColumnsType<ListedProduct> = [
    { title: 'Product Name', key: 'name', dataIndex: 'name' },
    { title: 'Category', key: 'categoryName', dataIndex: 'categoryName', align: 'center' },
    { title: 'Price', key: 'price', dataIndex: 'price', align: 'center' },
    {
      title: 'Variants / stock',
      key: 'variants',
      align: 'center',
      render: (_value, product) => (
        <Flex vertical gap={4}>
          {product.variants.map((variant) => (
            <span key={variant._id}>
              {variant.size} / {variant.color}:{' '}
              <Tag color={variant.stock === 0 ? 'red' : variant.stock <= (variant.lowStockThreshold ?? 5) ? 'orange' : 'green'}>
                {variant.stock === 0 ? 'Out of stock' : `${variant.stock} in stock`}
              </Tag>
            </span>
          ))}
        </Flex>
      ),
    },
    {
      title: 'Purchase From',
      key: 'sellerName',
      dataIndex: 'sellerName',
      align: 'center',
      render: (sellerName: string) => (
        <Tag color={sellerName === 'DELETED SELLER' ? 'red' : 'green'}>{sellerName}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_value, product) => (
        <Flex gap={4} onClick={(event) => event.stopPropagation()}>
          <SellProductModal product={product} />
          <AddStockModal product={product} />
          <UpdateProductModal product={product} />
          <DeleteProductModal id={product.key} />
        </Flex>
      ),
    },
  ];

  const onChange: PaginationProps['onChange'] = (page) => setCurrent(page);

  return (
    <>
      <ProductManagementFilter query={query} setQuery={setQuery} />
      <Table
        size='small'
        loading={isFetching}
        columns={columns}
        dataSource={tableData}
        pagination={false}
        scroll={{ x: true }}
        onRow={(product) => ({
          onClick: () => setSelectedProduct(product),
          className: 'product-clickable-row',
        })}
      />
      <Flex justify='center' style={{ marginTop: '1rem' }}>
        <Pagination
          current={current}
          onChange={onChange}
          defaultPageSize={query.limit}
          total={products?.meta?.total}
        />
      </Flex>
      <ProductDetailsModal
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onEdit={(product) => setEditingProduct({ ...product, key: product._id })}
        onAddStock={(product, variantId) =>
          setStockTarget({ product: { ...product, key: product._id }, variantId })
        }
      />
      {editingProduct && (
        <UpdateProductModal
          key={editingProduct.key}
          product={editingProduct}
          open
          hideTrigger
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingProduct(null);
          }}
        />
      )}
      {stockTarget && (
        <AddStockModal
          key={`${stockTarget.product.key}-${stockTarget.variantId}`}
          product={stockTarget.product}
          initialVariantId={stockTarget.variantId}
          open
          hideTrigger
          onOpenChange={(isOpen) => {
            if (!isOpen) setStockTarget(null);
          }}
        />
      )}
    </>
  );
};

const SellProductModal = ({ product }: { product: ListedProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { handleSubmit, register, reset } = useForm();
  const [saleProduct, { isLoading }] = useCreateSaleMutation();
  const close = () => setIsModalOpen(false);

  const onSubmit = async (data: FieldValues) => {
    const variant = product.variants.find((item) => item._id === data.variantId);
    if (!variant) {
      toastMessage({ icon: 'error', text: 'Select a valid product variant.' });
      return;
    }
    const quantity = Number(data.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > variant.stock) {
      toastMessage({ icon: 'error', text: 'Sale quantity must be a whole number within the selected variant stock.' });
      return;
    }
    try {
      const res = await saleProduct({
        product: product.key,
        variantId: data.variantId,
        productName: product.name,
        productPrice: product.price,
        quantity,
        buyerName: data.buyerName,
        date: data.date,
      }).unwrap();
      if (res.statusCode === 201) {
        toastMessage({ icon: 'success', text: res.message });
        reset();
        close();
      }
    } catch (error: unknown) {
      toastMessage({ icon: 'error', text: getApiErrorMessage(error, 'Unable to record sale') });
    }
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} type='primary' className='table-btn' style={{ backgroundColor: 'royalblue' }}>
        Sell
      </Button>
      <Modal title='Sell Product' open={isModalOpen} onCancel={close} footer={null}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '1rem' }}>
          <label className='label' htmlFor={`sale-variant-${product.key}`}>Variant</label>
          <select
            id={`sale-variant-${product.key}`}
            className='input-field'
            {...register('variantId', { required: true })}
          >
            <option value=''>Select size / colour</option>
            {product.variants.map((variant) => (
              <option value={variant._id} key={variant._id} disabled={variant.stock === 0}>
                {variant.size} / {variant.color} ({variant.stock} available)
              </option>
            ))}
          </select>
          <CustomInput name='buyerName' label='Buyer Name' register={register} required />
          <CustomInput name='date' label='Selling date' type='date' register={register} required />
          <CustomInput
            name='quantity'
            label='Quantity'
            type='number'
            register={register}
            required
          />
          <Flex justify='center' style={{ marginTop: '1rem' }}>
            <Button htmlType='submit' type='primary' disabled={isLoading || product.variants.length === 0}>
              Sell variant
            </Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
};

interface AddStockModalProps {
  product: ListedProduct;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialVariantId?: string;
  hideTrigger?: boolean;
}

const AddStockModal = ({
  product,
  open,
  onOpenChange,
  initialVariantId,
  hideTrigger = false,
}: AddStockModalProps) => {
  const [localOpen, setLocalOpen] = useState(false);
  const isModalOpen = open ?? localOpen;
  const { handleSubmit, register, reset } = useForm();
  const [addToStock, { isLoading }] = useAddStockMutation();
  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) setLocalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };
  const close = () => setOpen(false);
  const showModal = () => {
    reset({ variantId: initialVariantId || '', stock: '' });
    setOpen(true);
  };

  useEffect(() => {
    if (open) reset({ variantId: initialVariantId || '', stock: '' });
  }, [open, initialVariantId, reset]);

  const onSubmit = async (data: FieldValues) => {
    const quantity = Number(data.stock);
    if (!Number.isInteger(quantity) || quantity < 1) {
      toastMessage({ icon: 'error', text: 'Stock must be a positive whole number.' });
      return;
    }
    try {
      const res = await addToStock({
        id: product.key,
        payload: { variantId: data.variantId, stock: quantity },
      }).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
        reset();
        close();
      }
    } catch (error: unknown) {
      toastMessage({ icon: 'error', text: getApiErrorMessage(error, 'Unable to add stock') });
    }
  };

  return (
    <>
      {!hideTrigger && (
        <Button onClick={showModal} type='primary' className='table-btn' style={{ backgroundColor: 'blue' }}>
          Add Stock
        </Button>
      )}
      <Modal title='Add stock to a variant' open={isModalOpen} onCancel={close} footer={null}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ margin: '1rem' }}>
          <label className='label' htmlFor={`stock-variant-${product.key}-${hideTrigger ? 'details' : 'table'}`}>Variant</label>
          <select
            id={`stock-variant-${product.key}-${hideTrigger ? 'details' : 'table'}`}
            className='input-field'
            {...register('variantId', { required: true })}
          >
            <option value=''>Select size / colour</option>
            {product.variants.map((variant) => (
              <option value={variant._id} key={variant._id}>
                {variant.size} / {variant.color}
              </option>
            ))}
          </select>
          <CustomInput name='stock' label='Quantity to add' register={register} type='number' required />
          <Flex justify='center' style={{ marginTop: '1rem' }}>
            <Button htmlType='submit' type='primary' disabled={isLoading || product.variants.length === 0}>
              Add stock
            </Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
};

interface UpdateProductModalProps {
  product: ListedProduct;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const UpdateProductModal = ({
  product,
  open,
  onOpenChange,
  hideTrigger = false,
}: UpdateProductModalProps) => {
  const [updateProduct, { isLoading }] = useUpdateProductMutation();
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: sellers, isLoading: isSellerLoading } = useGetAllSellerQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);
  const { handleSubmit, register, formState: { errors }, reset } = useForm();
  const [variants, setVariants] = useState<ProductVariantFormValue[]>(toFormVariants(product.variants));
  const [localOpen, setLocalOpen] = useState(false);
  const isModalOpen = open ?? localOpen;
  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) setLocalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };
  const close = () => setOpen(false);

  const showModal = () => {
    reset({
      name: product.name,
      price: product.price,
      seller: product.seller?._id,
      category: product.category?._id,
      brand: product.brand?._id || '',
      description: product.description || '',
    });
    setVariants(toFormVariants(product.variants));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    reset({
      name: product.name,
      price: product.price,
      seller: product.seller?._id,
      category: product.category?._id,
      brand: product.brand?._id || '',
      description: product.description || '',
    });
    setVariants(toFormVariants(product.variants));
  }, [open, product, reset]);

  const onSubmit = async (data: FieldValues) => {
    const variantError = validateProductVariants(variants);
    if (variantError) {
      toastMessage({ icon: 'error', text: variantError });
      return;
    }
    try {
      const res = await updateProduct({
        id: product.key,
        payload: { ...data, price: Number(data.price), variants: serializeProductVariants(variants) },
      }).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
        close();
      }
    } catch (error: unknown) {
      toastMessage({ icon: 'error', text: getApiErrorMessage(error, 'Unable to update product') });
    }
  };

  return (
    <>
      {!hideTrigger && (
        <Button onClick={showModal} type='primary' className='table-btn-small' style={{ backgroundColor: 'green' }}>
          <EditFilled />
        </Button>
      )}
      <Modal title='Update product' open={isModalOpen} onCancel={close} footer={null} width={760}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CustomInput name='name' errors={errors} label='Name' register={register} required />
          <CustomInput
            errors={errors}
            label='Price'
            type='number'
            name='price'
            register={register}
            required
          />
          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}><label htmlFor={`seller-${product.key}`} className='label'>Seller</label></Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select id={`seller-${product.key}`} disabled={isSellerLoading} {...register('seller', { required: true })} className='input-field'>
                {sellers?.data.map((item: ICategory) => <option value={item._id} key={item._id}>{item.name}</option>)}
              </select>
            </Col>
          </Row>
          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}><label htmlFor={`category-${product.key}`} className='label'>Category</label></Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select id={`category-${product.key}`} {...register('category', { required: true })} className='input-field'>
                {categories?.data.map((item: ICategory) => <option value={item._id} key={item._id}>{item.name}</option>)}
              </select>
            </Col>
          </Row>
          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}><label htmlFor={`brand-${product.key}`} className='label'>Brand</label></Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select id={`brand-${product.key}`} {...register('brand')} className='input-field'>
                <option value=''>Select brand</option>
                {brands?.data.map((item: ICategory) => <option value={item._id} key={item._id}>{item.name}</option>)}
              </select>
            </Col>
          </Row>
          <CustomInput label='Description' name='description' register={register} />
          <VariantEditor variants={variants} onChange={setVariants} />
          <Flex justify='center' style={{ marginTop: '1rem' }}>
            <Button htmlType='submit' type='primary' disabled={isLoading}>Update product</Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
};

const DeleteProductModal = ({ id }: { id: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteProduct] = useDeleteProductMutation();
  const handleCancel = () => setIsModalOpen(false);

  const handleDelete = async () => {
    try {
      const res = await deleteProduct(id).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
        handleCancel();
      }
    } catch (error: unknown) {
      handleCancel();
      toastMessage({ icon: 'error', text: getApiErrorMessage(error, 'Unable to delete product') });
    }
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} type='primary' className='table-btn-small' style={{ backgroundColor: 'red' }}>
        <DeleteFilled />
      </Button>
      <Modal title='Delete Product' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Are you want to delete this product?</h2>
          <h4>You won&apos;t be able to revert it.</h4>
          <Flex gap='1rem' justify='center' style={{ marginTop: '1rem' }}>
            <Button onClick={handleCancel} type='primary'>Cancel</Button>
            <Button onClick={handleDelete} type='primary' danger>Yes, delete</Button>
          </Flex>
        </div>
      </Modal>
    </>
  );
};

export default ProductManagePage;
