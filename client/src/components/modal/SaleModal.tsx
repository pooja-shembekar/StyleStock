import { Button, Flex, Modal } from 'antd';
import { ChangeEvent, useState } from 'react';
import toastMessage from '../../lib/toastMessage';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getSaleModal, getSaleModalData, toggleSaleModel } from '../../redux/services/modal.Slice';
import { useCreateSaleMutation } from '../../redux/features/management/saleApi';

const SaleModal = () => {
  const modalOpen = useAppSelector(getSaleModal);
  const data = useAppSelector(getSaleModalData);
  const [createNewSale, { isLoading }] = useCreateSaleMutation();
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({ variantId: '', buyerName: '', quantity: '', date: '' });

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };
  const close = () => dispatch(toggleSaleModel({ open: false, data: null }));

  const onSubmit = async () => {
    const quantity = Number(form.quantity);
    if (!data || !form.variantId || !Number.isInteger(quantity) || quantity < 1) {
      toastMessage({ icon: 'error', text: 'Select a variant and enter a positive whole-number quantity.' });
      return;
    }

    try {
      const res = await createNewSale({
        ...form,
        product: data._id,
        quantity,
      }).unwrap();
      if (res.statusCode === 201) {
        toastMessage({ icon: 'success', text: res.message });
        setForm({ variantId: '', buyerName: '', quantity: '', date: '' });
        close();
      }
    } catch (error: unknown) {
      toastMessage({ icon: 'error', text: getApiErrorMessage(error, 'Unable to record sale') });
    }
  };

  return (
    <Modal title='New product sale' centered open={modalOpen} onCancel={close} footer={<Button onClick={close}>Close</Button>}>
      <form onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}>
        <label className='label' htmlFor='sale-variant'>Variant</label>
        <select id='sale-variant' className='input-field' name='variantId' value={form.variantId} onChange={handleChange}>
          <option value=''>Select size / colour</option>
          {data?.variants.map((variant) => (
            <option value={variant._id} key={variant._id} disabled={variant.stock === 0}>
              {variant.size} / {variant.color} ({variant.stock} available)
            </option>
          ))}
        </select>
        <label className='label' htmlFor='sale-buyer'>Buyer name</label>
        <input id='sale-buyer' className='input-field' name='buyerName' value={form.buyerName} onChange={handleChange} required />
        <label className='label' htmlFor='sale-quantity'>Quantity</label>
        <input id='sale-quantity' className='input-field' name='quantity' type='number' min='1' step='1' value={form.quantity} onChange={handleChange} required />
        <label className='label' htmlFor='sale-date'>Selling date</label>
        <input id='sale-date' className='input-field' name='date' type='date' value={form.date} onChange={handleChange} required />
        <Flex justify='center' style={{ margin: '1rem' }}>
          <Button htmlType='submit' type='primary' loading={isLoading} disabled={!data?.variants?.length}>Sell variant</Button>
        </Flex>
      </form>
    </Modal>
  );
};

export default SaleModal;
