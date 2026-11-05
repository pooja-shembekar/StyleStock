import { RouterProvider } from 'react-router-dom';
import { router } from './routes/routes';
import { ConfigProvider } from 'antd';

const App = () => {
  return (
    <>
      <ConfigProvider
        theme={{
          token: {
            fontFamily: 'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            colorPrimary: '#6658E8',
            colorSuccess: '#16A36A',
            colorWarning: '#E9A23B',
            colorError: '#DC5252',
            colorInfo: '#6658E8',
            borderRadius: 12,
            fontSize: 14,
            lineHeight: 1.6,
            colorBgBase: '#F7F8FA',
            colorTextBase: '#202938',
            colorBorder: 'rgba(23, 32, 51, 0.08)',
            colorBgLayout: '#F7F8FA',
            colorBgContainer: '#FFFFFF',
            colorBgElevated: '#FFFFFF',
            boxShadow: '0 12px 28px rgba(23, 32, 51, 0.08)',
            fontSizeHeading1: 32,
            fontSizeHeading2: 28,
            fontSizeHeading3: 24,
            fontSizeHeading4: 20,
            fontSizeHeading5: 16,
          },
          components: {
            Button: {
              primaryColor: '#6658E8',
              controlHeight: 42,
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
            },
            Input: {
              controlHeight: 42,
              borderRadius: 10,
              fontSize: 14,
              colorBorder: 'rgba(23, 32, 51, 0.08)',
              controlPaddingHorizontal: 14,
              colorTextPlaceholder: '#778196',
            },
            Select: {
              controlHeight: 42,
              borderRadius: 10,
              fontSize: 14,
            },
            Card: {
              colorBgContainer: '#FFFFFF',
              boxShadow: '0 12px 28px rgba(23, 32, 51, 0.08)',
              borderRadiusLG: 16,
              boxShadowSecondary: '0 12px 28px rgba(23, 32, 51, 0.08)',
            },
            Table: {
              headerBg: '#F7F8FA',
              headerColor: '#202938',
              headerBorderRadius: 12,
              colorBgContainer: '#FFFFFF',
              borderColor: 'rgba(23, 32, 51, 0.08)',
              rowHoverBg: '#F3F4FF',
            },
            Menu: {
              colorBgBase: '#172033',
              colorItemBg: '#172033',
              colorItemBgHover: 'rgba(102, 88, 232, 0.18)',
              colorItemBgSelectedHorizontal: 'rgba(102, 88, 232, 0.2)',
            },
            Layout: {
              headerBg: '#172033',
              headerHeight: 64,
              headerPadding: '0 24px',
              headerColor: '#FFFFFF',
            },
            Modal: {
              contentBg: '#FFFFFF',
              titleFontSize: 18,
            },
            Form: {
              labelFontSize: 14,
              labelColor: '#202938',
            },
          },
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>
    </>
  );
};

export default App;
