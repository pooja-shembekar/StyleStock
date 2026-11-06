import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row } from 'antd';
import userProPic from '../assets/User.png';
import CustomInput from '../components/CustomInput';
import { useForm } from 'react-hook-form';
import { IProfileUpdate, IUser, profileInputFields } from '../constant/profile';
import { useGetSelfProfileQuery, useUpdateProfileMutation } from '../redux/features/authApi';
import Loader from '../components/Loader';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { config } from '../utils/config';
import { getApiErrorMessage } from '../utils/apiError';

const EditProfilePage = () => {
  const { data, isLoading } = useGetSelfProfileQuery(undefined);
  const [updateProfile, { isLoading: isUploadingAvatar }] = useUpdateProfileMutation();
  const navigate = useNavigate();

  if (isLoading) {
    return <Loader />;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    e.target.value = '';
    if (!image) return;

    const cloudName = config.VITE_CLOUDINARY_CLOUD_NAME?.trim();
    const uploadPreset = config.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();
    if (!cloudName || !uploadPreset) {
      toast.error('Profile image upload is not configured. Set the Cloudinary cloud name and unsigned upload preset.');
      return;
    }
    if (!image.type.startsWith('image/') || image.size > 10 * 1024 * 1024) {
      toast.error('Choose an image file smaller than 10 MB.');
      return;
    }

    const toastId = toast.loading('Uploading Image...');
    const data = new FormData();
    data.append('file', image);
    data.append('upload_preset', uploadPreset);
    data.append('folder', 'inventory');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
        {
          method: 'POST',
          body: data,
        }
      );
      const res = await response.json() as { secure_url?: unknown };
      if (!response.ok || typeof res.secure_url !== 'string' || !/^https:\/\//i.test(res.secure_url)) {
        throw new Error('Cloudinary did not return a secure image URL.');
      }

      const result = await updateProfile({ avatar: res.secure_url }).unwrap();
      if (!result.success) {
        throw new Error('The image uploaded, but the profile update was not confirmed.');
      }
      toast.success('Profile image updated successfully.', { id: toastId });
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, error instanceof Error ? error.message : 'Failed to upload profile image.'), { id: toastId });
    }
  };

  return (
    <Row>
      <Col xs={{ span: 24 }} lg={{ span: 8 }}>
        <Flex align='center' vertical style={{ margin: '1rem 0' }}>
          <Flex
            justify='center'
            style={{
              width: '250px',
              height: '250px',
              border: '2px solid gray',
              padding: '.5rem',
              borderRadius: '50%',
            }}
          >
            <img
              src={data?.data?.avatar || userProPic}
              alt='user'
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          </Flex>
          <Flex style={{ padding: '1rem' }}>
            <input
              type='file'
              name='avatar'
              id='avatar'
              accept='image/*'
              placeholder='Change Profile Picture'
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isUploadingAvatar}
            />
            <label
              htmlFor='avatar'
              style={{
                background: '#164863',
                color: '#fff',
                padding: '.5rem 1rem',
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                fontSize: '1rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <UploadOutlined />
              Change Profile Picture
            </label>
          </Flex>
        </Flex>
      </Col>
      <Col xs={{ span: 24 }} lg={{ span: 16 }}>
        <Flex justify='end' style={{ margin: '1rem 0' }}>
          <Button type='default' onClick={() => navigate('/profile')}>
            <ArrowLeftOutlined /> Go Back
          </Button>
        </Flex>
        <EditProfileForm data={data?.data as Partial<IUser> | undefined} />
      </Col>
    </Row>
  );
};

export default EditProfilePage;

const EditProfileForm = ({ data }: { data?: Partial<IUser> }) => {
  const navigate = useNavigate();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IProfileUpdate>({ defaultValues: data });

  const onSubmit = async (values: IProfileUpdate) => {
    const normalize = (value: string | undefined) => value?.trim();
    const profile: IProfileUpdate = {
      name: normalize(values.name),
      email: normalize(values.email),
      title: normalize(values.title),
      description: normalize(values.description),
      address: normalize(values.address),
      phone: normalize(values.phone),
      city: normalize(values.city),
      country: normalize(values.country),
      facebook: normalize(values.facebook),
      twitter: normalize(values.twitter),
      linkedin: normalize(values.linkedin),
      instagram: normalize(values.instagram),
    };
    if (!Object.values(profile).some((value) => value !== undefined)) {
      toast.error('Enter at least one profile field before saving.');
      return;
    }

    const toastId = toast.loading('Updating profile...');
    try {
      const res = await updateProfile(profile).unwrap();

      if (res.success) {
        toast.success('Profile updated successfully', { id: toastId });
        navigate('/profile');
      } else {
        toast.error('Profile update was not confirmed.', { id: toastId });
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to update profile'), { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {profileInputFields.map((input) => (
        <CustomInput
          key={input.id}
          name={input.name}
          errors={errors}
          label={input.label}
          type={input.type}
          register={register}
          required={input.name === 'name' || input.name === 'email'}
        />
      ))}

      <Flex justify='center'>
        <Button
          htmlType='submit'
          type='primary'
          loading={isLoading}
          disabled={isLoading}
          style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
        >
          Update Profile
        </Button>
      </Flex>
    </form>
  );
};
