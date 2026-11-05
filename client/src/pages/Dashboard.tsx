import { Alert, Card, Col, Row, Table, Tag } from 'antd';
import { ShoppingCartOutlined, ShoppingOutlined, DollarOutlined } from '@ant-design/icons';
import MonthlyChart from '../components/Charts/MonthlyChart';
import Loader from '../components/Loader';
import { useCountProductsQuery, useGetLowStockProductsQuery } from '../redux/features/management/productApi';
import { useYearlySaleQuery } from '../redux/features/management/saleApi';
import DailyChart from '../components/Charts/DailyChart';
import { ILowStockVariant } from '../types/product.types';
import { ComponentType, ReactNode } from 'react';

interface StatCardProps {
  icon: ComponentType<{ style?: React.CSSProperties }>;
  title: string;
  value: ReactNode;
  color: string;
}

const Dashboard = () => {
  const { data: products, isLoading } = useCountProductsQuery(undefined);
  const { data: yearlyData, isLoading: isLoading1 } = useYearlySaleQuery(undefined);
  const {
    data: lowStock,
    isLoading: isLoadingLowStock,
    isError: isLowStockError,
  } = useGetLowStockProductsQuery(undefined);

  if (isLoading || isLoading1 || isLoadingLowStock) return <Loader />;

  const alertColumns = [
    { title: 'Product', dataIndex: 'name', key: 'name' },
    {
      title: 'Variant',
      key: 'variant',
      render: (_value: unknown, item: ILowStockVariant) => `${item.variant.size} / ${item.variant.color}`,
    },
    {
      title: 'Stock',
      key: 'stock',
      render: (_value: unknown, item: ILowStockVariant) => (
        <Tag color={item.variant.stock === 0 ? 'red' : 'orange'}>
          {item.variant.stock === 0 ? 'Out of stock' : `${item.variant.stock} left`}
        </Tag>
      ),
    },
    {
      title: 'Alert threshold',
      key: 'threshold',
      render: (_value: unknown, item: ILowStockVariant) => item.variant.lowStockThreshold ?? 5,
    },
  ];

  const StatCard = ({ icon: Icon, title, value, color }: StatCardProps) => (
    <Card
      style={{
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
        borderColor: `${color}30`,
        border: `2px solid ${color}30`,
        borderRadius: '12px',
        height: '100%',
      }}
      hoverable
    >
      <div style={{textAlign: 'center'}}>
        <Icon style={{fontSize: '2.5rem', color: color, marginBottom: '1rem'}} />
        <h3 style={{color: '#2d3436', marginBottom: '0.5rem', fontWeight: 500}}>{title}</h3>
        <h1 style={{fontSize: '2rem', color: color, fontWeight: 700, margin: 0}}>
          {value}
        </h1>
      </div>
    </Card>
  );

  return (
    <>
      <Row gutter={[16, 16]} style={{marginBottom: '2rem'}}>
        <Col xs={{ span: 24 }} sm={{ span: 12 }} lg={{ span: 8 }}>
          <StatCard
            icon={ShoppingCartOutlined}
            title='Total Stock'
            value={products?.data?.totalQuantity || 0}
            color='#1890ff'
          />
        </Col>
        <Col xs={{ span: 24 }} sm={{ span: 12 }} lg={{ span: 8 }}>
          <StatCard
            icon={ShoppingOutlined}
            title='Total Items Sold'
            value={
              yearlyData?.data.reduce(
                (acc: number, cur: { totalQuantity: number }) => (acc += cur.totalQuantity),
                0
              ) || 0
            }
            color='#52c41a'
          />
        </Col>
        <Col xs={{ span: 24 }} sm={{ span: 12 }} lg={{ span: 8 }}>
          <StatCard
            icon={DollarOutlined}
            title='Total Revenue'
            value={`$${
              yearlyData?.data.reduce(
                (acc: number, cur: { totalRevenue: number }) => (acc += cur.totalRevenue),
                0
              ) || 0
            }`}
            color='#faad14'
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={{ span: 24 }} lg={{ span: 12 }}>
          <Card
            title={
              <h2 style={{margin: 0, fontSize: '1.25rem', fontWeight: 700}}>
                📊 Daily Sales & Revenue
              </h2>
            }
            bordered={false}
            style={{borderRadius: '12px', height: '100%'}}
          >
            <DailyChart />
          </Card>
        </Col>
        <Col xs={{ span: 24 }} lg={{ span: 12 }}>
          <Card
            title={
              <h2 style={{margin: 0, fontSize: '1.25rem', fontWeight: 700}}>
                📈 Monthly Revenue
              </h2>
            }
            bordered={false}
            style={{borderRadius: '12px', height: '100%'}}
          >
            <MonthlyChart />
          </Card>
        </Col>
      </Row>
      <Card
        title='Low-stock alerts'
        bordered={false}
        style={{ borderRadius: '12px', marginTop: '1rem' }}
      >
        {isLowStockError ? (
          <Alert type='error' showIcon message='Unable to load low-stock alerts.' />
        ) : lowStock?.data?.length ? (
          <Table<ILowStockVariant>
            rowKey={(item) => `${item._id}-${item.variant._id}`}
            loading={isLoadingLowStock}
            columns={alertColumns}
            dataSource={lowStock.data}
            pagination={false}
            size='small'
          />
        ) : (
          <Alert type='success' showIcon message='No low-stock or out-of-stock variants.' />
        )}
      </Card>
    </>
  );
};

export default Dashboard;
