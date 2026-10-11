set -eu
id khonenama-payment >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin khonenama-payment
install -d -m 755 /opt/khonenama-payment
install -m 644 /tmp/khonenama-relay.py /opt/khonenama-payment/relay.py
install -m 644 /tmp/khonenama-payment.service /etc/systemd/system/khonenama-payment.service
if [ ! -f /etc/khonenama-payment.env ]; then
 umask 077
 printf 'PAYMENTS_ENABLED=false\nZARINPAL_MERCHANT_ID=\nPAYMENT_RELAY_SECRET=' > /etc/khonenama-payment.env
 python3 -c 'import secrets;print(secrets.token_urlsafe(48))' >> /etc/khonenama-payment.env
fi
systemctl daemon-reload
systemctl enable --now khonenama-payment
systemctl restart khonenama-payment
sleep 1
systemctl is-active khonenama-payment
curl --max-time 3 -s http://127.0.0.1:8081/health
