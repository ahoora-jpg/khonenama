import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SupportForm from '@/components/SupportForm';
import SupportStatus from '@/components/SupportStatus';
export const metadata={title:'پشتیبانی خونه‌نما',robots:{index:false,follow:true}};
export default function Page(){return <main><Header/><section className="inner-page"><div className="shell"><h1>پشتیبانی و گزارش مشکل</h1><SupportForm/><SupportStatus/></div></section><Footer/></main>;}
