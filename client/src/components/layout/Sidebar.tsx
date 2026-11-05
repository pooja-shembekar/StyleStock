import {useState} from 'react';
import {Outlet, useNavigate} from 'react-router-dom';
import {Button, Layout, Menu} from 'antd';
import {LogoutOutlined} from '@ant-design/icons';
import {sidebarItems} from '../../constant/sidebarItems';
import {useAppDispatch} from '../../redux/hooks';
import {logoutUser} from '../../redux/services/authSlice';

const {Content, Sider} = Layout;

const Sidebar = () => {
  const [showLogoutBtn, setShowLogoutBtn] = useState(true);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleClick = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  return (
    <Layout style={{height: '100vh'}}>
      <Sider
        breakpoint='lg'
        collapsedWidth='0'
        onCollapse={(collapsed, type) => {
          if (type === 'responsive') {
            setShowLogoutBtn(!collapsed);
          }
          if (type === 'clickTrigger') {
            setShowLogoutBtn(!collapsed);
          }
        }}
        width='260px'
        style={{
          background: 'linear-gradient(135deg, #172033 0%, #1c2740 100%)',
          position: 'relative',
          boxShadow: '12px 0 30px rgba(23, 32, 51, 0.12)',
        }}
      >
        <div style={{padding: '1.75rem 1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
          <h1 style={{
            color: '#FFFFFF',
            fontSize: '1.65rem',
            fontWeight: 800,
            textAlign: 'center',
            margin: 0,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            StyleStock
          </h1>
          <p style={{color: 'rgba(255,255,255,0.72)', textAlign: 'center', margin: '0.5rem 0 0 0', fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase'}}>
            Fashion retail OS
          </p>
        </div>
        <Menu
          theme='dark'
          mode='inline'
          style={{
            background: 'transparent',
            fontWeight: 700,
            border: 'none',
            marginTop: '1rem',
            fontSize: '0.82rem',
            letterSpacing: '0.04em',
          }}
          defaultSelectedKeys={['Dashboard']}
          items={sidebarItems}
        />
        {showLogoutBtn && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              padding: '1.5rem',
              display: 'flex',
              width: '100%',
              justifyContent: 'center',
              background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.15))',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Button
              type='primary'
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #6658E8, #4F46E5)',
                border: 'none',
                fontWeight: 700,
                height: '42px',
                fontSize: '14px',
                boxShadow: '0 10px 18px rgba(102, 88, 232, 0.35)',
              }}
              onClick={handleClick}
            >
              <LogoutOutlined style={{marginRight: '0.5rem'}} />
              Logout
            </Button>
          </div>
        )}
      </Sider>
      <Layout>
        <Content style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, #F7F8FA 0%, #EDF1F7 100%)',
          backgroundAttachment: 'fixed',
          overflowY: 'auto',
        }}>
          <div
            style={{
              padding: '2rem',
              maxHeight: 'calc(100vh - 4rem)',
              minHeight: 'calc(100vh - 4rem)',
              background: '#FFFFFF',
              borderRadius: '18px',
              overflow: 'auto',
              boxShadow: '0 12px 32px rgba(23, 32, 51, 0.08)',
              border: '1px solid rgba(23, 32, 51, 0.05)',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;
