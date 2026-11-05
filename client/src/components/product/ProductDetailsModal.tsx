import {
  AppstoreOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  InboxOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
  TagOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Dropdown,
  Empty,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Spin,
  Tag,
  Tooltip,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import toastMessage from '../../lib/toastMessage';
import { config } from '../../utils/config';
import {
  useCreateProductNoteMutation,
  useCreateNewProductMutation,
  useDeleteProductNoteMutation,
  useGetProductMovementsQuery,
  useGetProductNotesQuery,
  useGetSingleProductQuery,
  useUpdateProductMutation,
} from '../../redux/features/management/productApi';
import { IProduct, IProductNote, IProductVariant, IStockMovement } from '../../types/product.types';
import { getApiErrorMessage } from '../../utils/apiError';
import './ProductDetailsModal.css';

type DetailsTab = 'overview' | 'history' | 'notes';

interface ProductDetailsModalProps {
  product: IProduct | null;
  open: boolean;
  onClose: () => void;
  onEdit: (product: IProduct) => void;
  onAddStock: (product: IProduct, variantId: string) => void;
}

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const displayDate = (date?: string) => {
  if (!date) return 'Not available';
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? 'Not available'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parsedDate);
};

const displayDateTime = (date?: string) => {
  if (!date) return 'Not available';
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? 'Not available'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(parsedDate);
};

const movementLabels: Record<IStockMovement['type'], string> = {
  initial_stock: 'Initial stock',
  purchase: 'Purchase / stock in',
  sale: 'Sale / stock out',
  return: 'Customer return',
  adjustment: 'Manual adjustment',
};

const isImagePath = (path: string) =>
  (path.startsWith('/') && !path.startsWith('//')) || /^https:\/\//i.test(path);

const stockState = (variant: IProductVariant) => {
  if (variant.stock === 0) return { label: 'Out of stock', className: 'is-out' };
  if (variant.stock <= (variant.lowStockThreshold ?? 5)) return { label: 'Low stock', className: 'is-low' };
  return { label: 'In stock', className: 'is-in' };
};

const colorValue = (color: string) => {
  const normalized = color.trim().toLowerCase();
  const knownColors: Record<string, string> = {
    black: '#15191f',
    white: '#f5f5f2',
    navy: '#243c5a',
    blue: '#4784c7',
    red: '#c34a4a',
    green: '#438a68',
    olive: '#74834a',
    beige: '#d8c6a9',
    tan: '#b9875b',
    brown: '#79543d',
    grey: '#9299a1',
    gray: '#9299a1',
    pink: '#d88fa5',
    purple: '#8b70b2',
  };
  return knownColors[normalized] || '#6658e8';
};

const authorName = (author?: IProductNote['author'] | IStockMovement['performedBy']) => {
  if (author && typeof author === 'object') return author.name || author.email || 'Team member';
  return 'Team member';
};

const ProductDetailsModal = ({
  product,
  open,
  onClose,
  onEdit,
  onAddStock,
}: ProductDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<DetailsTab>('overview');
  const [imageIndex, setImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyVariant, setHistoryVariant] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [createProduct, { isLoading: isCloning }] = useCreateNewProductMutation();
  const [createNote, { isLoading: isCreatingNote }] = useCreateProductNoteMutation();
  const [deleteNote] = useDeleteProductNoteMutation();

  const productId = product?._id || '';
  const {
    data: productResponse,
    isFetching: isProductFetching,
    isError: isProductError,
    refetch: refetchProduct,
  } = useGetSingleProductQuery(productId, {
    skip: !open || !productId,
    refetchOnMountOrArgChange: true,
  });
  const details = (productResponse?.data as IProduct | undefined) || product;

  const {
    data: movementsResponse,
    isFetching: isMovementsFetching,
    isError: isMovementsError,
  } = useGetProductMovementsQuery(
    { id: productId, page: historyPage, limit: 10, ...(historyVariant ? { variantId: historyVariant } : {}) },
    { skip: !open || activeTab !== 'history' || !productId },
  );
  const {
    data: notesResponse,
    isFetching: isNotesFetching,
    isError: isNotesError,
  } = useGetProductNotesQuery(productId, {
    skip: !open || activeTab !== 'notes' || !productId,
  });

  const movements = (movementsResponse?.data || []) as IStockMovement[];
  const notes = (notesResponse?.data || []) as IProductNote[];
  const imagePaths = useMemo(
    () => (details?.images || []).filter((image) => typeof image === 'string' && isImagePath(image)),
    [details?.images],
  );

  useEffect(() => {
    setActiveTab('overview');
    setImageIndex(0);
    setFailedImages([]);
    setHistoryPage(1);
    setHistoryVariant('');
    setNoteBody('');
  }, [productId]);

  useEffect(() => {
    setImageIndex((current) => Math.min(current, Math.max(imagePaths.length - 1, 0)));
  }, [imagePaths.length]);

  if (!product) return null;

  const currentImage = imagePaths[imageIndex];
  const canShowCurrentImage = currentImage && !failedImages.includes(currentImage);
  const status = details?.status === 'inactive' ? 'inactive' : 'active';
  const totalStock = details?.variants.reduce((total, variant) => total + variant.stock, 0) ?? 0;
  const lowStockCount = details?.variants.filter(
    (variant) => variant.stock <= (variant.lowStockThreshold ?? 5),
  ).length ?? 0;

  const setHistoryFilter = (variantId: string) => {
    setHistoryVariant(variantId);
    setHistoryPage(1);
    setActiveTab('history');
  };

  const handleClone = async () => {
    if (!details?.category?._id || !details.seller?._id) {
      toastMessage({ icon: 'error', text: 'Product category or supplier is unavailable; this product cannot be cloned.' });
      return;
    }

    try {
      await createProduct({
        name: `${details.name} (Copy)`,
        category: details.category._id,
        seller: details.seller._id,
        ...(details.brand?._id ? { brand: details.brand._id } : {}),
        price: details.price,
        description: details.description || '',
        images: details.images || [],
        variants: details.variants.map((variant) => ({
          size: variant.size,
          color: variant.color,
          stock: 0,
          lowStockThreshold: variant.lowStockThreshold ?? 5,
          sku: '',
        })),
      }).unwrap();
      toastMessage({ icon: 'success', text: 'Product copy created with zero starting stock.' });
    } catch (error: unknown) {
      toastMessage({ icon: 'error', text: getApiErrorMessage(error, 'Unable to clone product') });
    }
  };

  const handleToggleStatus = async () => {
    try {
      await updateProduct({
        id: productId,
        payload: { status: status === 'active' ? 'inactive' : 'active' },
      }).unwrap();
      toastMessage({
        icon: 'success',
        text: `Product marked ${status === 'active' ? 'inactive' : 'active'}.`,
      });
    } catch (error: unknown) {
      toastMessage({ icon: 'error', text: getApiErrorMessage(error, 'Unable to update product status') });
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    if (!files.length || !details) return;

    const remainingSlots = 12 - (details.images?.length || 0);
    if (remainingSlots <= 0) {
      toastMessage({ icon: 'error', text: 'A product can have up to 12 images.' });
      return;
    }
    if (files.some((file) => !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024)) {
      toastMessage({ icon: 'error', text: 'Choose image files smaller than 10 MB.' });
      return;
    }

    const cloudName = config.VITE_CLOUDINARY_CLOUD_NAME?.trim();
    const uploadPreset = config.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();
    if (!cloudName || !uploadPreset) {
      const missingSettings = [
        !cloudName && 'VITE_CLOUDINARY_CLOUD_NAME',
        !uploadPreset && 'VITE_CLOUDINARY_UPLOAD_PRESET',
      ].filter(Boolean);
      toastMessage({
        icon: 'error',
        text: `Product image upload is not configured. Set ${missingSettings.join(' and ')} in client/.env and restart Vite.`,
      });
      return;
    }

    setIsImageUploading(true);
    try {
      const uploadedImages: string[] = [];
      for (const file of files.slice(0, remainingSlots)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'inventory/products');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
          { method: 'POST', body: formData },
        );
        const responseBody = await response.text();
        let result: { secure_url?: string; error?: { message?: string } };
        try {
          result = JSON.parse(responseBody) as typeof result;
        } catch {
          throw new Error(
            response.ok
              ? 'Cloudinary returned an unreadable response.'
              : `Cloudinary upload failed (HTTP ${response.status})${responseBody ? `: ${responseBody.slice(0, 250)}` : '.'}`,
          );
        }
        if (!response.ok) {
          throw new Error(
            result.error?.message
              ? `Cloudinary upload failed: ${result.error.message}`
              : `Cloudinary upload failed (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}).`,
          );
        }
        if (!result.secure_url || !/^https:\/\//i.test(result.secure_url)) {
          throw new Error('Cloudinary upload succeeded but did not return a valid secure image URL.');
        }
        uploadedImages.push(result.secure_url);
      }

      const images = [...(details.images || []), ...uploadedImages];
      try {
        await updateProduct({ id: productId, payload: { images } }).unwrap();
      } catch (error: unknown) {
        toastMessage({
          icon: 'error',
          text: `Image${uploadedImages.length === 1 ? '' : 's'} uploaded to Cloudinary, but saving them to the product failed: ${getApiErrorMessage(error, 'product update failed')}`,
        });
        return;
      }
      setImageIndex(images.length - 1);
      toastMessage({ icon: 'success', text: `${uploadedImages.length} product image${uploadedImages.length === 1 ? '' : 's'} uploaded.` });
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : getApiErrorMessage(error, 'Unable to upload product images to Cloudinary');
      toastMessage({ icon: 'error', text: message });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleCreateNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = noteBody.trim();
    if (!body) {
      toastMessage({ icon: 'error', text: 'Enter a note before saving.' });
      return;
    }
    try {
      await createNote({ id: productId, body }).unwrap();
      setNoteBody('');
      toastMessage({ icon: 'success', text: 'Product note added.' });
    } catch (error: unknown) {
      toastMessage({ icon: 'error', text: getApiErrorMessage(error, 'Unable to add product note') });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote({ id: productId, noteId }).unwrap();
      toastMessage({ icon: 'success', text: 'Product note deleted.' });
    } catch (error: unknown) {
      toastMessage({ icon: 'error', text: getApiErrorMessage(error, 'Unable to delete product note') });
    }
  };

  const moreActions = [
    {
      key: 'clone',
      label: 'Clone product',
      icon: <AppstoreOutlined />,
      disabled: !details?.category?._id || !details?.seller?._id,
    },
    {
      key: 'status',
      label: `Mark ${status === 'active' ? 'inactive' : 'active'}`,
      icon: status === 'active' ? <ClockCircleOutlined /> : <CheckCircleFilled />,
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1160}
      centered
      destroyOnClose
      wrapClassName='product-details-modal-wrap'
      title={null}
    >
      <div className='product-details'>
        <header className='product-details-header'>
          <div className='product-details-heading'>
            <div className='product-details-heading-mark'><AppstoreOutlined /></div>
            <div>
              <p className='product-details-kicker'>PRODUCT OVERVIEW</p>
              <h2>{details?.name || product.name}</h2>
              <div className='product-details-header-meta'>
                <span>{details?.variants.length ?? product.variants.length} variants</span>
                <span className='product-details-meta-dot' />
                <span>{details?.category?.name || 'Uncategorized'}</span>
                <Tag className={`product-status-tag ${status}`}>{status}</Tag>
              </div>
            </div>
          </div>
          <div className='product-details-actions'>
            <Button icon={<PlusOutlined />} onClick={() => details && onEdit(details)} disabled={!details}>
              Add variant
            </Button>
            <Button type='primary' icon={<EditOutlined />} onClick={() => details && onEdit(details)} disabled={!details}>
              Edit product
            </Button>
            <Dropdown
              menu={{
                items: moreActions,
                onClick: ({ key }) => {
                  if (key === 'clone') void handleClone();
                  if (key === 'status') void handleToggleStatus();
                },
              }}
              trigger={['click']}
            >
              <Button aria-label='More product actions' icon={<EllipsisOutlined />} loading={isCloning || isUpdating} />
            </Dropdown>
            <Button className='product-details-close' aria-label='Close product details' onClick={onClose}>
              ×
            </Button>
          </div>
        </header>

        {isProductError && (
          <Alert
            className='product-details-alert'
            type='error'
            showIcon
            message='Could not refresh this product.'
            action={<Button size='small' onClick={() => void refetchProduct()}>Retry</Button>}
          />
        )}

        <div className='product-details-stats'>
          <div><span>Total stock</span><strong>{totalStock}</strong></div>
          <div><span>Variant count</span><strong>{details?.variants.length ?? 0}</strong></div>
          <div className={lowStockCount > 0 ? 'product-stat-warning' : ''}>
            <span>Low-stock variants</span><strong>{lowStockCount}</strong>
          </div>
          <div><span>Selling price</span><strong>{currency.format(details?.price ?? 0)}</strong></div>
        </div>

        <nav className='product-details-tabs' aria-label='Product detail sections'>
          {([
            ['overview', 'Overview', <AppstoreOutlined key='overview-icon' />],
            ['history', 'Stock history', <ClockCircleOutlined key='history-icon' />],
            ['notes', 'Notes', <FileTextOutlined key='notes-icon' />],
          ] as const).map(([key, label, icon]) => (
            <button
              className={activeTab === key ? 'active' : ''}
              key={key}
              onClick={() => setActiveTab(key)}
              type='button'
            >
              {icon}{label}
            </button>
          ))}
        </nav>

        {isProductFetching && !productResponse ? (
          <div className='product-details-loading'><Spin /></div>
        ) : !details ? (
          <Alert type='error' showIcon message='Product details are unavailable.' />
        ) : activeTab === 'overview' ? (
          <div className='product-details-overview'>
            <section className='product-detail-panel product-gallery-panel'>
              <div className='product-gallery-main'>
                <label className={`product-image-upload ${isImageUploading ? 'uploading' : ''}`}>
                  <UploadOutlined />
                  <span>{isImageUploading ? 'Uploading...' : 'Add images'}</span>
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    disabled={isImageUploading || (details.images?.length || 0) >= 12}
                    onChange={(event) => void handleImageUpload(event)}
                    aria-label='Upload product images'
                  />
                </label>
                {canShowCurrentImage ? (
                  <img
                    src={currentImage}
                    alt={`${details.name} product view ${imageIndex + 1}`}
                    onError={() => setFailedImages((failed) => [...failed, currentImage])}
                  />
                ) : (
                  <div className='product-image-placeholder'>
                    <InboxOutlined />
                    <strong>Product imagery</strong>
                    <span>No product image available</span>
                  </div>
                )}
                {imagePaths.length > 1 && (
                  <>
                    <button
                      className='product-gallery-nav previous'
                      aria-label='Previous product image'
                      onClick={() => setImageIndex((index) => (index - 1 + imagePaths.length) % imagePaths.length)}
                      type='button'
                    >
                      <LeftOutlined />
                    </button>
                    <button
                      className='product-gallery-nav next'
                      aria-label='Next product image'
                      onClick={() => setImageIndex((index) => (index + 1) % imagePaths.length)}
                      type='button'
                    >
                      <RightOutlined />
                    </button>
                    <span className='product-image-counter'>{imageIndex + 1} / {imagePaths.length}</span>
                  </>
                )}
                <span className='product-image-primary'>
                  {canShowCurrentImage ? (imageIndex === 0 ? 'Primary image' : 'Gallery image') : 'Image placeholder'}
                </span>
              </div>
              {imagePaths.length > 0 && (
                <div className='product-gallery-thumbnails'>
                  {imagePaths.map((image, index) => (
                    <button
                      className={imageIndex === index ? 'selected' : ''}
                      key={`${image}-${index}`}
                      onClick={() => setImageIndex(index)}
                      type='button'
                      aria-label={`Show product image ${index + 1}`}
                    >
                      {!failedImages.includes(image) ? (
                        <img
                          src={image}
                          alt=''
                          onError={() => setFailedImages((failed) => [...failed, image])}
                        />
                      ) : <InboxOutlined />}
                      {index === 0 && <span>Primary</span>}
                    </button>
                  ))}
                </div>
              )}

              <div className='product-general-info'>
                <div className='product-panel-title'>
                  <div><h3>General information</h3><p>Product details and catalog information</p></div>
                  <TagOutlined />
                </div>
                <dl>
                  <div><dt>Product name</dt><dd>{details.name}</dd></div>
                  <div><dt>Description</dt><dd>{details.description?.trim() || 'No description provided.'}</dd></div>
                  <div><dt>Brand</dt><dd>{details.brand?.name || 'Unbranded'}</dd></div>
                  <div><dt>Category</dt><dd>{details.category?.name || 'Uncategorized'}</dd></div>
                  <div><dt>Supplier</dt><dd>{details.seller?.name || 'Supplier unavailable'}</dd></div>
                  <div><dt>Selling price</dt><dd>{currency.format(details.price)}</dd></div>
                  <div><dt>Created</dt><dd><CalendarOutlined /> {displayDate(details.createdAt)}</dd></div>
                  <div><dt>Last updated</dt><dd><ClockCircleOutlined /> {displayDate(details.updatedAt)}</dd></div>
                  <div><dt>Total variants</dt><dd>{details.variants.length}</dd></div>
                  <div><dt>Total stock</dt><dd>{totalStock} units</dd></div>
                </dl>
              </div>
            </section>

            <section className='product-detail-panel product-variants-panel'>
              <div className='product-panel-title'>
                <div><h3>Variant inventory</h3><p>Stock by size and colour</p></div>
                <span className='product-variant-count'>{details.variants.length}</span>
              </div>
              {details.variants.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No variants added yet' />
              ) : (
                <div className='product-variant-list'>
                  {details.variants.map((variant) => {
                    const variantStatus = stockState(variant);
                    return (
                      <article className='product-variant-card' key={variant._id}>
                        <div className='product-variant-swatch' style={{ backgroundColor: colorValue(variant.color) }}>
                          <span>{variant.color.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className='product-variant-info'>
                          <div className='product-variant-title'>
                            <strong>{variant.color}</strong>
                            <span className={`product-stock-status ${variantStatus.className}`}>
                              <i />{variantStatus.label}
                            </span>
                          </div>
                          <p>Size {variant.size} <span>·</span> {variant.sku || 'SKU not set'}</p>
                          <div className='product-variant-numbers'>
                            <span><strong>{variant.stock}</strong> available</span>
                            <span>{currency.format(details.price)} <small>selling price</small></span>
                          </div>
                        </div>
                        <div className='product-variant-actions'>
                          <Tooltip title='Edit variant details'>
                            <button onClick={() => onEdit(details)} type='button' aria-label={`Edit ${variant.color} size ${variant.size}`}>
                              <EditOutlined />
                            </button>
                          </Tooltip>
                          <Tooltip title='Add stock'>
                            <button
                              onClick={() => onAddStock(details, variant._id)}
                              type='button'
                              aria-label={`Add stock to ${variant.color} size ${variant.size}`}
                            >
                              <PlusOutlined />
                            </button>
                          </Tooltip>
                          <Tooltip title='View variant movement history'>
                            <button
                              onClick={() => setHistoryFilter(variant._id)}
                              type='button'
                              aria-label={`View stock history for ${variant.color} size ${variant.size}`}
                            >
                              <ClockCircleOutlined />
                            </button>
                          </Tooltip>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              {lowStockCount > 0 && (
                <div className='product-low-stock-notice'>
                  <ClockCircleOutlined />
                  <span>{lowStockCount} variant{lowStockCount === 1 ? '' : 's'} at or below its stock threshold</span>
                </div>
              )}
            </section>
          </div>
        ) : activeTab === 'history' ? (
          <section className='product-detail-panel product-history-panel'>
            <div className='product-panel-title product-history-heading'>
              <div><h3>Stock movement history</h3><p>Recorded inventory changes for this product</p></div>
              <select
                aria-label='Filter history by variant'
                value={historyVariant}
                onChange={(event) => {
                  setHistoryVariant(event.target.value);
                  setHistoryPage(1);
                }}
              >
                <option value=''>All variants</option>
                {details.variants.map((variant) => (
                  <option value={variant._id} key={variant._id}>{variant.size} / {variant.color}</option>
                ))}
              </select>
            </div>
            {isMovementsError ? (
              <Alert type='error' showIcon message='Stock movement history could not be loaded.' />
            ) : isMovementsFetching ? (
              <div className='product-details-loading'><Spin /></div>
            ) : movements.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description='No stock movements have been recorded for this product yet.'
              />
            ) : (
              <>
                <div className='product-history-table-wrap'>
                  <table className='product-history-table'>
                    <thead>
                      <tr><th>Transaction</th><th>Date</th><th>Variant</th><th>Change</th><th>Stock</th><th>Reference</th><th>By</th></tr>
                    </thead>
                    <tbody>
                      {movements.map((movement) => (
                        <tr key={movement._id}>
                          <td>
                            <span className={`movement-type-icon ${movement.quantityChanged < 0 ? 'negative' : 'positive'}`}>
                              {movement.quantityChanged < 0 ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                            </span>
                            {movementLabels[movement.type]}
                            <small className='movement-reason'>{movement.reason}</small>
                          </td>
                          <td>{displayDateTime(movement.createdAt)}</td>
                          <td>{movement.variantSize} / {movement.variantColor}{movement.variantSku ? ` · ${movement.variantSku}` : ''}</td>
                          <td className={movement.quantityChanged < 0 ? 'movement-negative' : 'movement-positive'}>
                            {movement.quantityChanged > 0 ? '+' : ''}{movement.quantityChanged}
                          </td>
                          <td>{movement.previousStock} → {movement.newStock}</td>
                          <td>
                            {movement.referenceId ? (
                              <Tooltip title={movement.referenceId}>{movement.referenceId.slice(-8)}</Tooltip>
                            ) : '—'}
                          </td>
                          <td>{authorName(movement.performedBy)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  className='product-history-pagination'
                  current={historyPage}
                  onChange={setHistoryPage}
                  pageSize={10}
                  showSizeChanger={false}
                  total={movementsResponse?.meta?.total || 0}
                />
              </>
            )}
          </section>
        ) : (
          <section className='product-detail-panel product-notes-panel'>
            <div className='product-panel-title'>
              <div><h3>Product notes</h3><p>Private notes for your team about this item</p></div>
              <FileTextOutlined />
            </div>
            <form className='product-note-form' onSubmit={handleCreateNote}>
              <Input.TextArea
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                maxLength={2000}
                showCount
                placeholder='Add a note about this product...'
                autoSize={{ minRows: 3, maxRows: 6 }}
                aria-label='Product note'
              />
              <Button type='primary' htmlType='submit' icon={<PlusOutlined />} loading={isCreatingNote}>
                Add note
              </Button>
            </form>
            {isNotesError ? (
              <Alert type='error' showIcon message='Product notes could not be loaded.' />
            ) : isNotesFetching ? (
              <div className='product-details-loading'><Spin /></div>
            ) : notes.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No notes yet. Add the first note above.' />
            ) : (
              <div className='product-note-list'>
                {notes.map((note) => (
                  <article className='product-note-card' key={note._id}>
                    <div className='product-note-avatar'>{authorName(note.author).charAt(0).toUpperCase()}</div>
                    <div className='product-note-content'>
                      <div><strong>{authorName(note.author)}</strong><span>{displayDate(note.createdAt)}</span></div>
                      <p>{note.body}</p>
                    </div>
                    <Popconfirm
                      title='Delete this note?'
                      description='This action cannot be undone.'
                      okText='Delete'
                      okButtonProps={{ danger: true }}
                      onConfirm={() => void handleDeleteNote(note._id)}
                    >
                      <Button
                        type='text'
                        danger
                        icon={<DeleteOutlined />}
                        aria-label='Delete note'
                      />
                    </Popconfirm>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
};

export default ProductDetailsModal;
