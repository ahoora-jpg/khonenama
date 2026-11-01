import React from 'react';
import {createRoot} from 'react-dom/client';
import SmsApplication from '../../components/sms/SmsApplication';
import '../../app/sms/sms.css';
import {smsPages} from '../../lib/sms-admin-ui';
// Synthetic browser fixture only. All API requests are intercepted by the QA runner.
const page = new URLSearchParams(location.search).get('screen') || location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
createRoot(document.getElementById('root')!).render(<SmsApplication page={smsPages.find(p=>p.key===page)?.key || 'dashboard'}/>);
