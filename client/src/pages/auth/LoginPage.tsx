import { SpinnerIcon } from '@phosphor-icons/react';
import {
  BarChartOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  InboxOutlined,
  LockOutlined,
  MailOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import { FieldValues, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toastMessage from '../../lib/toastMessage';
import { useLoginMutation } from '../../redux/features/authApi';
import { useAppDispatch } from '../../redux/hooks';
import { loginUser } from '../../redux/services/authSlice';
import decodeToken from '../../utils/decodeToken';
import './LoginPage.css';

const LoginPage = () => {
  const [userLogin, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FieldValues) => {
    try {
      const res = await userLogin(data).unwrap();

      if (res.statusCode === 200) {
        const user = decodeToken(res.data.token);
        dispatch(loginUser({ token: res.data.token, user }));
        navigate('/');
        toastMessage({ icon: 'success', text: 'Successfully Login!' });
      }
    } catch (error: any) {
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  return (
    <main className='login-page'>
      <section className='login-branding' aria-label='About StyleStock'>
        <div className='login-brand'>
          <span className='login-brand-mark' aria-hidden='true'>S</span>
          <span>StyleStock</span>
        </div>

        <div className='login-brand-content'>
          <p className='login-eyebrow'>THE OPERATING SYSTEM FOR RETAIL</p>
          <h1>Manage Your Store.<br />Master Your Inventory.</h1>
          <p className='login-brand-description'>
            A smarter way to manage products, stock, purchases and sales.
          </p>

          <div className='login-visual' aria-hidden='true'>
            <div className='login-visual-label'>
              <span className='login-visual-label-dot' />
              A clearer view of your store
            </div>
            <svg className='login-fashion-illustration' viewBox='0 0 620 300' fill='none'>
              <defs>
                <linearGradient id='rack-glow' x1='54' y1='69' x2='553' y2='266' gradientUnits='userSpaceOnUse'>
                  <stop stopColor='#A69CFF' stopOpacity='.9' />
                  <stop offset='1' stopColor='#6658E8' stopOpacity='.45' />
                </linearGradient>
                <linearGradient id='coat-one' x1='142' y1='92' x2='230' y2='258' gradientUnits='userSpaceOnUse'>
                  <stop stopColor='#D8D2FF' />
                  <stop offset='1' stopColor='#8D82EA' />
                </linearGradient>
                <linearGradient id='coat-two' x1='243' y1='92' x2='326' y2='256' gradientUnits='userSpaceOnUse'>
                  <stop stopColor='#F3E9DF' />
                  <stop offset='1' stopColor='#C4A996' />
                </linearGradient>
                <linearGradient id='coat-three' x1='355' y1='90' x2='456' y2='256' gradientUnits='userSpaceOnUse'>
                  <stop stopColor='#C8E2DE' />
                  <stop offset='1' stopColor='#82B9B2' />
                </linearGradient>
              </defs>
              <ellipse cx='310' cy='270' rx='223' ry='19' fill='#080D1C' fillOpacity='.32' />
              <path d='M104 72H516M142 72V252M478 72V252M129 252H491' stroke='url(#rack-glow)' strokeWidth='5' strokeLinecap='round' />
              <path d='M309 45c0-12 8-20 19-20 8 0 13 5 13 12 0 6-4 10-10 10h-8v13' stroke='#BFB8FF' strokeWidth='4' strokeLinecap='round' strokeLinejoin='round' />
              <path d='M197 85l30 19 30-19-30-13-30 13Z' stroke='#D6D1FF' strokeWidth='3' strokeLinejoin='round' />
              <path d='M227 104v12' stroke='#D6D1FF' strokeWidth='3' strokeLinecap='round' />
              <path d='M180 124c0-11 9-20 20-20h54c11 0 20 9 20 20l-8 118c-1 10-9 17-19 17h-41c-10 0-18-7-19-17l-7-118Z' fill='url(#coat-one)' />
              <path d='m207 106 20 25 20-25M227 131v116M201 172h21M232 172h21' stroke='#6057A6' strokeOpacity='.56' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' />
              <path d='M303 85l29 18 29-18-29-13-29 13Z' stroke='#E4D0C1' strokeWidth='3' strokeLinejoin='round' />
              <path d='M332 103v13' stroke='#E4D0C1' strokeWidth='3' strokeLinecap='round' />
              <path d='M289 123c0-10 8-18 18-18h50c11 0 19 8 19 18l-7 119c-1 10-9 17-19 17h-37c-10 0-18-7-19-17l-5-119Z' fill='url(#coat-two)' />
              <path d='m313 108 19 30 20-30M332 138v108M307 177h18M339 177h18' stroke='#927A68' strokeOpacity='.55' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' />
              <path d='M408 84l30 19 30-19-30-13-30 13Z' stroke='#B7DCD7' strokeWidth='3' strokeLinejoin='round' />
              <path d='M438 103v13' stroke='#B7DCD7' strokeWidth='3' strokeLinecap='round' />
              <path d='M394 123c0-10 8-18 19-18h50c11 0 19 8 18 18l-8 119c-1 10-9 17-19 17h-36c-10 0-18-7-19-17l-5-119Z' fill='url(#coat-three)' />
              <path d='m418 108 20 29 19-29M438 137v109M413 177h18M444 177h19' stroke='#4C8580' strokeOpacity='.6' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' />
              <circle cx='95' cy='124' r='4' fill='#A69CFF' />
              <circle cx='531' cy='167' r='5' fill='#A69CFF' fillOpacity='.7' />
              <path d='M86 147h22M520 190h22' stroke='#A69CFF' strokeOpacity='.5' strokeWidth='2' strokeLinecap='round' />
            </svg>
            <div className='login-visual-note'>
              <span className='login-note-icon'><InboxOutlined /></span>
              <span><strong>Every item, in its place</strong><small>One view for your whole collection</small></span>
            </div>
          </div>

          <ul className='login-features'>
            <li><span><InboxOutlined /></span>Smart Inventory Tracking</li>
            <li><span><SyncOutlined /></span>Real-time Stock Updates</li>
            <li><span><BarChartOutlined /></span>Business Analytics</li>
          </ul>
        </div>
        <p className='login-brand-footer'>A better way to run retail.</p>
      </section>

      <section className='login-main'>
        <div className='login-mobile-brand'>
          <span className='login-brand-mark' aria-hidden='true'>S</span>
          <span>StyleStock</span>
        </div>

        <div className='login-form-card'>
          <div className='login-form-heading'>
            <p className='login-form-kicker'>YOUR STORE, IN SYNC</p>
            <h2>Welcome back</h2>
            <p>Sign in to continue to your StyleStock dashboard.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className='login-field'>
              <label htmlFor='login-email'>Email address</label>
              <div className={`login-input-wrap ${errors.email ? 'has-error' : ''}`}>
                <MailOutlined className='login-input-icon' aria-hidden='true' />
                <input
                  id='login-email'
                  type='email'
                  autoComplete='email'
                  placeholder='you@yourstore.com'
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  {...register('email', { required: true })}
                />
              </div>
              {errors.email && <span className='login-field-error' id='login-email-error'>Email is required.</span>}
            </div>

            <div className='login-field'>
              <label htmlFor='login-password'>Password</label>
              <div className={`login-input-wrap ${errors.password ? 'has-error' : ''}`}>
                <LockOutlined className='login-input-icon' aria-hidden='true' />
                <input
                  id='login-password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  placeholder='Enter your password'
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  {...register('password', { required: true })}
                />
                <button
                  className='login-password-toggle'
                  type='button'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </button>
              </div>
              {errors.password && <span className='login-field-error' id='login-password-error'>Password is required.</span>}
            </div>

            <Button
              className='login-submit'
              htmlType='submit'
              type='primary'
              disabled={isLoading}
              block
            >
              {isLoading && <SpinnerIcon className='login-spinner' weight='bold' />}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className='login-register'>
            <p>
              Don&apos;t have an account?{' '}
              <Link to='/register'>Create one</Link>
            </p>
          </div>
        </div>
        <p className='login-main-footer'>© StyleStock · Fashion &amp; lifestyle inventory</p>
      </section>
    </main>
  );
};

export default LoginPage;
