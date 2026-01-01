// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { api } from '@/integrations/api/client.ts';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
// import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
// import { useAnimateIn } from '@/lib/animations.ts';
// import { Calendar, MapPin, Users, ArrowLeft } from 'lucide-react';
// import { toast } from 'sonner';
// import { Button } from '@/components/ui/button.tsx';
// import { useAuth } from '@/contexts/AuthContext.tsx';
// import { DATABASE_TYPES } from '@/integrations/api/types.ts';
//
// const SharedTripPage = () => {
//   const show = useAnimateIn(false, 250);
//   const { slug } = useParams();
//   const navigate = useNavigate();
//   const { user, isAuthenticated } = useAuth();
//   const [trip, setTrip] = useState<DATABASE_TYPES.trips | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [memberCount, setMemberCount] = useState(0);
//   const [isJoining, setIsJoining] = useState(false);
//   const [isAlreadyMember, setIsAlreadyMember] = useState(false);
//
//   useEffect(() => {
//     const fetchTrip = async () => {
//       setLoading(true);
//       try {
//         const data = await api.trips.getBySlug(slug as string);
//
//         setTrip(data);
//         document.title = `${data.name} - Chia sẻ | Goouty`;
//
//         // Get member count
//         const { count } = await api.members.count(data.id);
//         setMemberCount(count);
//
//         // Check if user is already a member
//         if (isAuthenticated && user) {
//           const { isMember } = await api.members.isMember(data.id, user.id);
//           setIsAlreadyMember(isMember);
//         }
//       } catch (error) {
//         toast.error('Không thể tải chuyến đi');
//       } finally {
//         setLoading(false);
//       }
//     };
//
//     if (slug) {
//       fetchTrip();
//     }
//   }, [slug, isAuthenticated, user]);
//
//   const formatDate = (dateString: string | null) => {
//     if (!dateString) return '—';
//     return new Date(dateString).toLocaleDateString('vi-VN', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric'
//     });
//   };
//
//   const handleJoinTrip = async () => {
//     if (!trip || !user) return;
//
//     setIsJoining(true);
//     try {
//       await api.members.create({
//         trip_id: trip.id,
//         user_id: user.id,
//         name: user.email?.split('@')[0] || 'Thành viên mới',
//         is_creator: false
//       });
//
//       toast.success('Đã tham gia chuyến đi thành công!');
//       // Redirect to trip details page
//       navigate(`/trip/${trip.id}`);
//     } catch (error: any) {
//       if (error.response?.status === 409) {
//         // Conflict - user already a member
//         toast.error('Bạn đã là thành viên của chuyến đi này');
//         setIsAlreadyMember(true);
//       } else {
//         toast.error(error.response?.data?.message || 'Không thể tham gia chuyến đi');
//       }
//     } finally {
//       setIsJoining(false);
//     }
//   };
//
//   return (
//     <div className="min-h-screen pt-24 pb-12 px-4">
//       <AnimatedTransition show={show} animation="slide-up">
//         <div className="max-w-3xl mx-auto">
//           {loading && (
//             <div className="text-center py-12">
//               <p className="text-muted-foreground">Đang tải...</p>
//             </div>
//           )}
//
//           {!loading && trip && (
//             <Card>
//               <CardHeader>
//                 <div className="flex items-center gap-2 mb-2">
//                   <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                   <span className="text-sm text-green-600 font-medium">Chuyến đi công khai</span>
//                 </div>
//                 <CardTitle className="text-2xl">{trip.name}</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 {trip.description && (
//                   <p className="text-muted-foreground">{trip.description}</p>
//                 )}
//                 <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
//                   <div className="flex items-center">
//                     <Calendar className="w-4 h-4 mr-1" />
//                     <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
//                   </div>
//                   <div className="flex items-center">
//                     <Users className="w-4 h-4 mr-1" />
//                     <span>{memberCount} thành viên</span>
//                   </div>
//                 </div>
//
//                 <div className="pt-4 border-t">
//                   {!isAuthenticated ? (
//                     <>
//                       <p className="text-sm text-muted-foreground mb-2">
//                         Đăng nhập để tham gia chuyến đi này:
//                       </p>
//                       <Button onClick={() => navigate('/auth')}>
//                         Đăng nhập / Đăng ký
//                       </Button>
//                     </>
//                   ) : isAlreadyMember ? (
//                     <>
//                       <p className="text-sm text-muted-foreground mb-2">
//                         Bạn đã là thành viên của chuyến đi này.
//                       </p>
//                       <Button onClick={() => navigate(`/trip/${trip.id}`)}>
//                         Xem chi tiết chuyến đi
//                       </Button>
//                     </>
//                   ) : (
//                     <>
//                       <p className="text-sm text-muted-foreground mb-2">
//                         Tham gia chuyến đi này để xem chi tiết và cùng lập kế hoạch:
//                       </p>
//                       <div className="flex gap-2">
//                         <Button onClick={handleJoinTrip} disabled={isJoining}>
//                           {isJoining ? 'Đang tham gia...' : 'Tham gia chuyến đi'}
//                         </Button>
//                         <Button
//                           variant="outline"
//                           onClick={() => navigate(`/trip/${trip.id}`)}
//                         >
//                           Xem chi tiết
//                         </Button>
//                       </div>
//                     </>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           )}
//
//           {!loading && !trip && (
//             <div className="text-center py-12">
//               <p className="text-muted-foreground mb-4">Không tìm thấy chuyến đi hoặc chuyến đi không công khai.</p>
//               <Button variant="outline" onClick={() => window.location.href = '/'}>
//                 <ArrowLeft className="w-4 h-4 mr-2" />
//                 Về trang chủ
//               </Button>
//             </div>
//           )}
//         </div>
//       </AnimatedTransition>
//     </div>
//   );
// };
//
// export default SharedTripPage;
