import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmsCenter from "@/components/SmsCenter";
import SmsCampaigns from "@/components/SmsCampaigns";
import SmsTemplates from "@/components/SmsTemplates";
export const metadata:Metadata={title:"مرکز پیامک خونه‌نما",robots:{index:false,follow:false}};
export default function Page(){return <main><Header/><div className="shell"><SmsCenter/><SmsCampaigns/><SmsTemplates/></div><Footer/></main>;}
