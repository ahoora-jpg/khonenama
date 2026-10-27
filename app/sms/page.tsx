import type {Metadata} from "next";
import SmsApplication from "@/components/sms/SmsApplication";
import "./sms.css";
export const metadata:Metadata={title:"داشبورد مرکز پیامک خونه‌نما",robots:{index:false,follow:false}};
export default function SmsPage(){return <SmsApplication page="dashboard"/>;}
