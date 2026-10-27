import type {Metadata} from "next";
import {notFound} from "next/navigation";
import SmsApplication from "@/components/sms/SmsApplication";
import {smsPages} from "@/lib/sms-admin-ui";
import "../sms.css";
export const metadata:Metadata={title:"مدیریت مرکز پیامک خونه‌نما",robots:{index:false,follow:false}};
export default async function SmsSection({params}:{params:Promise<{section:string}>}){const {section}=await params;const page=smsPages.find(p=>p.key===section&&p.key!=="dashboard");if(!page)notFound();return <SmsApplication page={page.key}/>;}
