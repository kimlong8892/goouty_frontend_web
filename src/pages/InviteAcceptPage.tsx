import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const InviteAcceptPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      toast.error('Token không hợp lệ');
      navigate('/');
      return;
    }

    (async () => {
      try {
        const res = await api.post<any>('/trips/invites/accept', { token });
        toast.success('Bạn đã tham gia chuyến đi thành công!');
        const tripId = res?.trip?.id;
        if (tripId) navigate(`/trip/${tripId}`);
        else navigate('/my-trips');
      } catch (err: any) {
        const msg = err?.message || 'Không thể chấp nhận lời mời';
        toast.error(msg);
        navigate('/');
      }
    })();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Đang xử lý lời mời...</p>
      </div>
    </div>
  );
};

export default InviteAcceptPage;


