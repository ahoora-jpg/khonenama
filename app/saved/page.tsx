import Header from '@/components/Header';import Footer from '@/components/Footer';import SavedBusinesses from '@/components/SavedBusinesses';
export const metadata={title:'غرفه‌های ذخیره‌شده و مقایسه',robots:{index:false,follow:true}};
export default function Page(){return <main><Header/><div className="shell inner-page"><SavedBusinesses/></div><Footer/></main>;}
