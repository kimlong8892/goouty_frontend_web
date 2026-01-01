import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { googleAuthService } from '@/services/googleAuth';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Function to send authorization code to backend for processing
async function processGoogleCallback(code: string) {
  try {
    // Send the authorization code to backend
    // Backend will exchange it for access token and get user info
    const response = await api.post('/auth/google/callback', {
      code: code,
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI
    });

    return response;
  } catch (error) {
    console.error('Error processing Google callback:', error);
    throw new Error('Failed to authenticate with Google');
  }
}

const GoogleCallbackPage = () => {
  const show = useAnimateIn(false, 250);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setError(`Google OAuth error: ${error}`);
          setIsProcessing(false);
          return;
        }

        if (!code) {
          setError('No authorization code received from Google');
          setIsProcessing(false);
          return;
        }

        // Send authorization code to backend for processing
        const response = await processGoogleCallback(code);

        // Store token
        localStorage.setItem('accessToken', (response as any).accessToken);
        
        // Dispatch custom event to notify AuthContext
        const event = new CustomEvent('tokenUpdated', {
          detail: { token: (response as any).accessToken }
        });
        window.dispatchEvent(event);
        
        toast.success('Đăng nhập Google thành công');
        
        // Small delay to ensure AuthContext has updated
        setTimeout(() => {
          navigate('/my-trips');
        }, 100);
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    navigate('/auth');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen pt-4 pb-12 px-4">
      <AnimatedTransition show={show} animation="slide-up">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {isProcessing ? 'Đang xử lý đăng nhập...' : 'Đăng nhập thất bại'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {isProcessing ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">
                    Đang xác thực với Google...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-red-500">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground">
                    {error || 'Có lỗi xảy ra khi đăng nhập với Google'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={handleRetry}>
                      Thử lại
                    </Button>
                    <Button onClick={handleGoHome}>
                      Về trang chủ
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default GoogleCallbackPage;
