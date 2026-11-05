import { Button, Flex, Modal } from 'antd';
import { ChangeEvent, useEffect, useState } from 'react';
import toastMessage from '../../lib/toastMessage';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAddStockMutation } from '../../redux/features/management/productApi';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getCreateVariantModel,
  getCreateVariantModelData,
  toggleCreateVariantModel,
} from '../../redux/services/modal.Slice';
import { IProduct } from '../../types/product.types';

const AddStockModal = () => {
  const modalOpen = useAppSelector(getCreateVariantModel);
  const data = useAppSelector(getCreateVariantModelData) as IProduct | null;
  const [addStock, { isLoading }] = useAddStockMutation();
  const dispatch = useAppDispatch();
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    setVariantId(data?.variants?.[0]?._id || '');
    setQuantity('');
  }, [data]);

  const close = () => dispatch(toggleCreateVariantModel({ open: false, data: null }));

  const onSubmit = async () => {
    const stock = Number(quantity);
    if (!data?._id || !variantId || !Number.isInteger(stock) || stock < 1) {
      toastMessage({ icon: 'error', text: 'Select a variant and enter a positive whole-number quantity.' });
      return;
    }

    try {
      const res = await addStock({ id: data._id, payload: { variantId, stock } }).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
        close();
      }
    } catch (error: unknown) {
      toastMessage({ icon: 'error', text: getApiErrorMessage(error, 'Unable to add stock') });
    }
  };

  return (
    <Modal title='Add stock' centered open={modalOpen} onCancel={close} footer={<Button onClick={close}>Close</Button>}>
      <form onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}>
        <label htmlFor='stock-variant' className='label'>Variant</label>
        <select
          id='stock-variant'
          className='input-field'
          value={variantId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setVariantId(event.target.value)}
        >
          <option value=''>Select size / colour</option>
          {data?.variants?.map((variant) => (
            <option value={variant._id} key={variant._id}>{variant.size} / {variant.color}</option>
          ))}
        </select>
        <label htmlFor='stock-quantity' className='label'>Quantity</label>
        <input
          id='stock-quantity'
          type='number'
          min='1'
          step='1'
          className='input-field'
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <Flex justify='center' style={{ margin: '1rem' }}>
          <Button htmlType='submit' type='primary' loading={isLoading} disabled={!data?.variants?.length}>
            Add stock
          </Button>
        </Flex>
      </form>
    </Modal>
  );
};

export default AddStockModal;
