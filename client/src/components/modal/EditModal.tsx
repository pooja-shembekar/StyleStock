import { Button, Flex, Modal } from 'antd';
import { ChangeEvent, useEffect, useState } from 'react';
import VariantEditor, { ProductVariantFormValue } from '../product/VariantEditor';
import toastMessage from '../../lib/toastMessage';
import { getApiErrorMessage } from '../../utils/apiError';
import { useUpdateProductMutation } from '../../redux/features/management/productApi';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getUpdateModal,
  getUpdateModalData,
  toggleUpdateModel,
} from '../../redux/services/modal.Slice';
import { IProduct } from '../../types/product.types';
import ModalInput from './ModalInput';
import { serializeProductVariants, validateProductVariants } from '../../utils/productVariants';

const EditModal = () => {
  const modalOpen = useAppSelector(getUpdateModal);
  const data = useAppSelector(getUpdateModalData) as IProduct | null;
  const [updateProduct] = useUpdateProductMutation();
  const dispatch = useAppDispatch();
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [variants, setVariants] = useState<ProductVariantFormValue[]>([]);

  useEffect(() => {
    setProductName(data?.name || '');
    setPrice(data ? String(data.price) : '');
    setVariants((data?.variants || []).map((variant) => ({
      _id: variant._id,
      size: variant.size,
      color: variant.color,
      stock: String(variant.stock),
      lowStockThreshold: String(variant.lowStockThreshold ?? 5),
      sku: variant.sku || '',
    })));
  }, [data]);

  const close = () => dispatch(toggleUpdateModel({ open: false, data: null }));

  const onSubmit = async () => {
    if (!data?._id) return;
    const error = validateProductVariants(variants);
    if (error) {
      toastMessage({ icon: 'error', text: error });
      return;
    }

    try {
      const res = await updateProduct({
        id: data._id,
        payload: { name: productName, price: Number(price), variants: serializeProductVariants(variants) },
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
    <Modal
      title='Update product'
      centered
      open={modalOpen}
      onCancel={close}
      footer={<Button onClick={close}>Close</Button>}
      width={760}
    >
      <form onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}>
        <ModalInput
          handleChange={(event: ChangeEvent<HTMLInputElement>) => setProductName(event.target.value)}
          name='name'
          defaultValue={productName}
          label='Name'
        />
        <ModalInput
          handleChange={(event: ChangeEvent<HTMLInputElement>) => setPrice(event.target.value)}
          label='Price'
          type='number'
          defaultValue={price}
          name='price'
        />
        <VariantEditor variants={variants} onChange={setVariants} />
        <Flex justify='center' style={{ margin: '1rem' }}>
          <Button htmlType='submit' type='primary'>Update</Button>
        </Flex>
      </form>
    </Modal>
  );
};

export default EditModal;
