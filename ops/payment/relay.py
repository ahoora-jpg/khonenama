#!/usr/bin/env python3
"""Private payment relay. Disabled until merchant approval and HTTPS setup."""
import hmac,json,os,re,urllib.request,urllib.parse
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args): pass
 def reply(self,status,payload):
  body=json.dumps(payload).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def do_GET(self):
  if self.path=='/health': self.reply(200,{'ok':True,'paymentsEnabled':os.getenv('PAYMENTS_ENABLED')=='true'} )
  else: self.reply(404,{'error':'NOT_FOUND'})
 def do_POST(self):
  secret=os.getenv('PAYMENT_RELAY_SECRET','')
  if not secret or not hmac.compare_digest(self.headers.get('Authorization',''),'Bearer '+secret):return self.reply(401,{'error':'UNAUTHORIZED'})
  if os.getenv('PAYMENTS_ENABLED')!='true':return self.reply(503,{'error':'PAYMENTS_DISABLED'})
  merchant=os.getenv('ZARINPAL_MERCHANT_ID','')
  if not re.fullmatch(r'[a-fA-F0-9-]{36}',merchant):return self.reply(503,{'error':'MERCHANT_NOT_CONFIGURED'})
  if self.path not in ['/request','/verify']:return self.reply(404,{'error':'NOT_FOUND'})
  try:
   length=int(self.headers.get('Content-Length','0'))
   if not 0<length<=8192:raise ValueError()
   data=json.loads(self.rfile.read(length));amount=data.get('amount')
   if type(amount) is not int or not 1000<=amount<=100000000000:raise ValueError()
   payload={'merchant_id':merchant,'amount':amount}
   if self.path=='/request':
    callback=urllib.parse.urlsplit(data.get('callback_url',''))
    if callback.scheme!='https' or callback.netloc!='www.khonenama.ir' or callback.path!='/api/billing/callback' or callback.fragment:raise ValueError()
    description=data.get('description','')
    if not isinstance(description,str) or not 1<=len(description)<=500:raise ValueError()
    payload.update(currency='IRR',callback_url=data['callback_url'],description=description)
   else:
    authority=data.get('authority','')
    if not re.fullmatch(r'A[a-zA-Z0-9]{35}',authority):raise ValueError()
    payload['authority']=authority
  except (ValueError,TypeError,AttributeError):return self.reply(400,{'error':'INVALID_REQUEST'})
  try:
   action=self.path[1:];req=urllib.request.Request('https://payment.zarinpal.com/pg/v4/payment/'+action+'.json',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'},method='POST')
   with urllib.request.urlopen(req,timeout=6) as response:
    result=json.loads(response.read(65537))
    if not isinstance(result,dict):raise ValueError()
    self.reply(200,result)
  except Exception:self.reply(502,{'error':'PAYMENT_NETWORK_ERROR'})
if __name__=='__main__':ThreadingHTTPServer(('127.0.0.1',8081),Handler).serve_forever()
