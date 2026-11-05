import { Button, Col, Flex, Row } from 'antd';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import CustomInput from '../components/CustomInput';
import CreateBrand from '../components/product/CreateBrand';
import CreateCategory from '../components/product/CreateCategory';
import CreateSeller from '../components/product/CreateSeller';
import VariantEditor, { ProductVariantFormValue } from '../components/product/VariantEditor';
import toastMessage from '../lib/toastMessage';
import { getApiErrorMessage } from '../utils/apiError';
import { useGetAllBrandsQuery } from '../redux/features/management/brandApi';
import { useGetAllCategoriesQuery } from '../redux/features/management/categoryApi';
import { useCreateNewProductMutation } from '../redux/features/management/productApi';
import { useGetAllSellerQuery } from '../redux/features/management/sellerApi';
import { ICategory } from '../types/product.types';
import { serializeProductVariants, validateProductVariants } from '../utils/productVariants';

interface ProductFormValues {
  name: string;
  price: string;
  seller: string;
  category: string;
  brand?: string;
  description?: string;
}

const initialVariant: ProductVariantFormValue = {
  size: '',
  color: '',
  stock: '0',
  lowStockThreshold: '5',
  sku: '',
};

const CreateProduct = () => {
  const [createNewProduct, { isLoading: isCreatingProduct }] = useCreateNewProductMutation();
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: sellers } = useGetAllSellerQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);
  const [variants, setVariants] = useState<ProductVariantFormValue[]>([{ ...initialVariant }]);
  const { handleSubmit, register, formState: { errors }, reset } = useForm<ProductFormValues>();

  const onSubmit = async (data: ProductFormValues) => {
    const variantError = validateProductVariants(variants);
    if (variantError) {
      toastMessage({ icon: 'error', text: variantError });
      return;
    }

    const payload = {
      ...data,
      price: Number(data.price),
      variants: serializeProductVariants(variants),
    };

    try {
      const res = await createNewProduct(payload).unwrap();
      if (res.statusCode === 201) {
        toastMessage({ icon: 'success', text: res.message });
        reset();
        setVariants([{ ...initialVariant }]);
      }
    } catch (error: unknown) {
      toastMessage({ icon: 'error', text: getApiErrorMessage(error, 'Unable to create product') });
    }
  };

  return (
    <Row gutter={30} style={{ height: 'calc(100vh - 6rem)', overflow: 'auto' }}>
      <Col xs={{ span: 24 }} lg={{ span: 14 }} style={{ display: 'flex' }}>
        <Flex vertical style={{ width: '100%', padding: '1rem 2rem', border: '1px solid #164863', borderRadius: '.6rem' }}>
          <h1 style={{ marginBottom: '.8rem', fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' }}>
            Add New Product
          </h1>
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
              <Col xs={{ span: 23 }} lg={{ span: 6 }}>
                <label htmlFor='seller' className='label'>Seller</label>
              </Col>
              <Col xs={{ span: 23 }} lg={{ span: 18 }}>
                <select id='seller' {...register('seller', { required: true })} className={`input-field ${errors.seller ? 'input-field-error' : ''}`}>
                  <option value=''>Select Seller*</option>
                  {sellers?.data.map((item: ICategory) => <option value={item._id} key={item._id}>{item.name}</option>)}
                </select>
              </Col>
            </Row>
            <Row>
              <Col xs={{ span: 23 }} lg={{ span: 6 }}>
                <label htmlFor='category' className='label'>Category</label>
              </Col>
              <Col xs={{ span: 23 }} lg={{ span: 18 }}>
                <select id='category' {...register('category', { required: true })} className={`input-field ${errors.category ? 'input-field-error' : ''}`}>
                  <option value=''>Select Category*</option>
                  {categories?.data.map((item: ICategory) => <option value={item._id} key={item._id}>{item.name}</option>)}
                </select>
              </Col>
            </Row>
            <Row>
              <Col xs={{ span: 23 }} lg={{ span: 6 }}>
                <label htmlFor='brand' className='label'>Brand</label>
              </Col>
              <Col xs={{ span: 23 }} lg={{ span: 18 }}>
                <select id='brand' {...register('brand')} className='input-field'>
                  <option value=''>Select brand</option>
                  {brands?.data.map((item: ICategory) => <option value={item._id} key={item._id}>{item.name}</option>)}
                </select>
              </Col>
            </Row>
            <CustomInput label='Description' name='description' register={register} />
            <VariantEditor variants={variants} onChange={setVariants} />
            <Flex justify='center' style={{ marginTop: '1rem' }}>
              <Button htmlType='submit' type='primary' disabled={isCreatingProduct} style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                {isCreatingProduct ? 'Saving…' : 'Add Product'}
              </Button>
            </Flex>
          </form>
        </Flex>
      </Col>
      <Col xs={{ span: 24 }} lg={{ span: 10 }}>
        <Flex vertical style={{ width: '100%', height: '100%', padding: '1rem 2rem', border: '1px solid #164863', borderRadius: '.6rem', justifyContent: 'space-around' }}>
          <CreateSeller />
          <CreateCategory />
          <CreateBrand />
        </Flex>
      </Col>
    </Row>
  );
};

export default CreateProduct;
